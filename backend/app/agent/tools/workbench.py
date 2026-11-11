"""Workbench tools never apply a proposed change without a user decision."""
from sqlalchemy.orm import Session
from app.db.models import ExperimentProject
from app.domain.project import ProposedFiles, Source, BOARDS
from app.services.experiments import get_project, propose_files
from app.services.builds import build_project


async def execute_workbench(tool: str, args: dict, project_id: str, model_config: dict | None, db: Session):
    from app.agent.tools.executor import ToolResult
    from app.agent.tools.generate import run_generate
    if not db.get(ExperimentProject, project_id):
        return None
    project = get_project(db, project_id)
    board = BOARDS[project.boardId]
    files = [f.model_dump() for f in project.files]
    if tool == 'CHECK_PROJECT':
        run = await build_project(db, project_id, project.revision)
        return ToolResult(text=f"Build {run['id']} for revision {project.revision}, target {project.boardId}: {run['status']}.\n{run['output']}")
    if tool == 'APPLY_CHANGES':
        return ToolResult(text='Changes are staged for user review. The user applies or rejects proposals in the assistant drawer.')
    if tool in ('VERIFY_ARDUINO', 'VERIFY_PYTHON'):
        run = await build_project(db, project_id, project.revision)
        return ToolResult(text=f"Deterministic check {run['id']}: {run['status']} at revision {project.revision}.\n{run['output']}")
    if tool == 'DERIVE_WIRING':
        return ToolResult(text='The circuit uses explicit terminal nets. Inspect current connections: ' + project.circuit.model_dump_json() + '. Explain uncertainties; do not invent connections from source text.')
    if tool not in ('WRITE_FILE', 'GENERATE_ARDUINO', 'GENERATE_RPI', 'OPTIMIZE_CODE'):
        return None
    if tool == 'WRITE_FILE':
        changes = [Source(name=args.get('path') or args.get('name') or '', content=args.get('content', ''))]
        explanation = 'Assistant proposes a file change. Review before applying.'
    else:
        prompt = str(args.get('prompt') or 'Modify this project')
        prompt += f'\nExact board: {project.boardId}, FQBN: {board["fqbn"]}. Preserve unrelated files. Source revision: {project.revision}.'
        result = await run_generate(tool, files, prompt, board['mode'], model_config)
        data = result['data']
        if not isinstance(data, dict):
            raise ValueError('Expected a generated project object')
        changes = [Source.model_validate(f) for f in data.get('files', [])]
        explanation = str(data.get('explanation') or 'Review the proposed changes')[:10_000]
        if not changes:
            return ToolResult(text='No file changes proposed. ' + explanation)
    proposal = propose_files(db, project_id, ProposedFiles(baseRevision=project.revision, files=changes, explanation=explanation))
    return ToolResult(text=f"Proposal {proposal['id']} staged for review at revision {project.revision}. No source files were changed. Wait for the user's apply/reject decision before claiming it was built.", patch=proposal)
