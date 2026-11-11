"""Generate real firmware for CPU tests outside Git (CLI/core must be installed)."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from app.routes.compile import CompileRequest, compile_code
from app.routes.workbench import NewProject, template


async def main():
    output = Path(sys.argv[1])
    output.mkdir(parents=True, exist_ok=True)
    for example in ('blink', 'button'):
        project = template(NewProject(name=example, template=example))
        result = await compile_code(CompileRequest(files=[{'name': f.name, 'content': f.content} for f in project.files], includeArtifact=True))
        if not result['valid'] or not result.get('artifact'):
            raise RuntimeError(result['output'])
        (output / f'{example}.hex').write_text(result['artifact']['content'])
        print(example, result['artifact']['sha256'])


asyncio.run(main())
