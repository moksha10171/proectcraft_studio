"""Local compiler checks. Submitted code is never executed or uploaded."""

import ast
import hashlib
import re
import asyncio
import shutil
import tempfile
from pathlib import Path, PurePosixPath
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/compile", tags=["compiler"])


class SourceFile(BaseModel):
    name: str = Field(min_length=1, max_length=256)
    content: str = Field(max_length=500_000)


class CompileRequest(BaseModel):
    files: list[SourceFile] = Field(min_length=1, max_length=50)
    deviceMode: Literal["arduino", "raspberry-pi"] = "arduino"
    includeArtifact: bool = False
    board: Literal["arduino:avr:uno", "arduino:avr:nano", "arduino:avr:mega"] = "arduino:avr:uno"


@router.get("/info")
def compiler_info():
    return {"arduinoCli": shutil.which("arduino-cli") is not None, "pythonSyntax": True,
            "boards": ["arduino:avr:uno", "arduino:avr:nano", "arduino:avr:mega"]}


@router.post("")
async def compile_code(body: CompileRequest):
    if sum(len(f.content.encode()) for f in body.files) > 1_000_000:
        raise HTTPException(413, "Project exceeds the 1 MB compiler limit")
    names = set()
    for source in body.files:
        path = PurePosixPath(source.name)
        if path.is_absolute() or ".." in path.parts or "\\" in source.name or ":" in source.name:
            raise HTTPException(400, "Use relative project file names without parent traversal")
        if str(path) in names:
            raise HTTPException(400, "Duplicate project file name")
        names.add(str(path))

    if body.deviceMode == "raspberry-pi":
        files = [f for f in body.files if f.name.endswith(".py")]
        if not files:
            raise HTTPException(400, "No Python files to check")
        errors = []
        for source in files:
            try:
                ast.parse(source.content, filename=source.name)
            except (SyntaxError, ValueError) as exc:
                errors.append(f"{source.name}:{getattr(exc, 'lineno', 1)}: {getattr(exc, 'msg', str(exc))}")
        return {"valid": not errors, "errors": errors, "engine": "python-ast",
                "output": "Python syntax check only; imports and GPIO behavior are not executed.",
                "diagnostics": [{"severity": "error", "message": e} for e in errors]}

    cli = shutil.which("arduino-cli")
    if not cli:
        raise HTTPException(503, "Arduino CLI is not installed. Follow README.md to install it and the arduino:avr core.")
    ino_files = [f for f in body.files if f.name.endswith(".ino")]
    if not ino_files:
        raise HTTPException(400, "No Arduino sketch (.ino) to compile")
    # Arduino requires a primary .ino matching its enclosing directory.
    with tempfile.TemporaryDirectory(prefix="projectcraft-") as temp:
        sketch = Path(temp) / "sketch"
        sketch.mkdir()
        primary = next((f for f in ino_files if f.name == "sketch.ino"), ino_files[0])
        for source in body.files:
            if Path(source.name).suffix not in {".ino", ".h", ".hpp", ".c", ".cpp", ".S"}:
                continue
            dest = sketch / ("sketch.ino" if source is primary else source.name)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(source.content, encoding="utf-8")
        process = await asyncio.create_subprocess_exec(
            cli, "compile", "--fqbn", body.board, "--build-path", str(Path(temp) / "build"), str(sketch),
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
        )
        try:
            output, _ = await asyncio.wait_for(process.communicate(), timeout=120)
        except asyncio.TimeoutError:
            process.kill()
            await process.communicate()
            raise HTTPException(504, "Compilation exceeded 120 seconds")
        text = output.decode(errors="replace")[-20_000:]
        diagnostics = []
        for line in text.splitlines():
            match = re.search(r"(?:^|/)([^/:]+\.(?:ino|cpp|c|h|hpp)):(\d+)(?::(\d+))?:\s*(error|warning|fatal error):\s*(.*)", line)
            if match:
                name, number, column, severity, message = match.groups()
                diagnostics.append({"file": primary.name if name == 'sketch.ino' else name,
                                    "line": int(number), "column": int(column or 1),
                                    "severity": "warning" if severity == "warning" else "error", "message": message})
        text = text.replace(temp, '<build>')
        if process.returncode and not diagnostics:
            diagnostics.append({"severity": "error", "message": text or 'Compiler exited without diagnostics'})
        result = {"valid": process.returncode == 0, "errors": [] if process.returncode == 0 else [text],
                  "engine": "arduino-cli", "board": body.board, "output": text, "diagnostics": diagnostics}
        artifact = Path(temp) / 'build' / 'sketch.ino.hex'
        if body.includeArtifact and process.returncode == 0 and artifact.is_file():
            content = artifact.read_text()
            result['artifact'] = {"format": "intel-hex", "content": content,
                                  "sha256": hashlib.sha256(content.encode()).hexdigest()}
        return result
