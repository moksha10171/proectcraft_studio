"""Build records bind actual diagnostics and artifacts to an immutable revision."""
import asyncio
import json
import platform
import shutil
import time
import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import ExperimentRun
from app.domain.project import BOARDS
from app.routes.compile import CompileRequest, compile_code
from app.services.experiments import get_project, timestamp


async def toolchain_info():
    cli = shutil.which('arduino-cli')
    if not cli:
        return {'arduinoCli': None, 'cores': [], 'libraries': [], 'python': platform.python_version()}
    data = {'python': platform.python_version()}
    for args, key in [(['version', '--format', 'json'], 'arduinoCli'), (['core', 'list', '--format', 'json'], 'cores'), (['lib', 'list', '--format', 'json'], 'libraries')]:
        process = await asyncio.create_subprocess_exec(cli, *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL)
        try:
            output, _ = await asyncio.wait_for(process.communicate(), 20)
            parsed = json.loads(output) if process.returncode == 0 else None
            if key == 'cores' and isinstance(parsed, dict):
                parsed = [{'id': p.get('id'), 'version': p.get('installed_version')} for p in parsed.get('platforms', []) if p.get('installed_version')]
            elif key == 'libraries' and isinstance(parsed, dict):
                parsed = [{'name': item.get('library', item).get('name'), 'version': item.get('library', item).get('version')} for item in parsed.get('installed_libraries', [])]
            data[key] = parsed
        except asyncio.TimeoutError:
            process.kill()
            await process.communicate()
            data[key] = None
        except ValueError:
            data[key] = None
    return data


async def build_project(db: Session, project_id: str, revision: int) -> dict:
    project = get_project(db, project_id)
    if project.revision != revision:
        raise HTTPException(409, 'Save your latest changes before building')
    board = BOARDS[project.boardId]
    environment = await toolchain_info()
    started = time.monotonic()
    run = {'id': uuid.uuid4().hex, 'projectId': project_id, 'sourceRevision': revision,
           'sourceHash': project.sourceHash, 'boardId': project.boardId, 'origin': 'compiler',
           'startedAt': timestamp(), 'status': 'running', 'engine': 'python-ast' if project.boardId == 'pi4' else 'arduino-cli'}
    try:
        if project.boardId != 'pi4' and environment.get('arduinoCli'):
            installed = next((c.get('version') for c in (environment.get('cores') or []) if c.get('id') == 'arduino:avr'), None)
            if project.coreVersion and installed != project.coreVersion:
                raise HTTPException(503, f"Project requires arduino:avr@{project.coreVersion}; installed version is {installed or 'none'}. Install it explicitly with arduino-cli core install arduino:avr@{project.coreVersion}.")
            for dependency in project.dependencies:
                if dependency.source != 'arduino-library':
                    raise HTTPException(503, f'Unsupported dependency source: {dependency.source}. Configure this toolchain externally.')
                if not any(lib.get('name') == dependency.name and lib.get('version') == dependency.version for lib in (environment.get('libraries') or [])):
                    raise HTTPException(503, f'Install the declared library explicitly: arduino-cli lib install "{dependency.name}@{dependency.version}"')
        result = await compile_code(CompileRequest(files=[{'name': f.name, 'content': f.content} for f in project.files],
                                   deviceMode=board['mode'], board=board['fqbn'] or 'arduino:avr:uno', includeArtifact=True))
        run.update(result)
        if result.get('artifact'):
            run['artifactHash'] = result['artifact']['sha256']
        run['status'] = 'passed' if result['valid'] else 'failed'
    except HTTPException as exc:
        run.update(status='unavailable' if exc.status_code == 503 else 'failed', valid=False, output=str(exc.detail),
                   errors=[str(exc.detail)], diagnostics=[{'severity': 'error', 'message': str(exc.detail)}])
    run['durationMs'] = round((time.monotonic() - started) * 1000)
    run['toolchain'] = environment
    run['dependencies'] = [d.model_dump() for d in project.dependencies]
    db.add(ExperimentRun(id=run['id'], project_id=project_id, document=json.dumps(run)))
    db.commit()
    return run
