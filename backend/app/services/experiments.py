"""Revisioned project operations. Updates use compare-and-swap, including undo."""
import json
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import update, select
from sqlalchemy.orm import Session

from app.db import repo
from app.db.models import ExperimentProject, ExperimentRevision, ExperimentPatch
from app.domain.project import Project, ProjectContent, ProposedFiles, BOARDS, source_hash


def timestamp():
    return datetime.now(timezone.utc).isoformat()


def get_project(db: Session, project_id: str) -> Project:
    row = db.get(ExperimentProject, project_id)
    if not row:
        raise HTTPException(404, 'Project not found')
    return Project.model_validate_json(row.document)


def mirror_workspace(db: Session, project: Project):
    mode = BOARDS[project.boardId]['mode']
    repo.get_or_create_workspace(db, project.id, name=project.name, mode=mode)
    repo.update_workspace(db, project.id, name=project.name, mode=mode)
    names = {f.name for f in project.files}
    for existing in repo.list_files(db, project.id):
        if existing.name not in names:
            db.delete(existing)
    for file in project.files:
        repo.upsert_file(db, project.id, name=file.name, content=file.content, type=file.type)


def save_project(db: Session, project_id: str, content: ProjectContent, base_revision: int | None = None) -> Project:
    revision = (base_revision or 0) + 1
    project = Project(**content.model_dump(), id=project_id, revision=revision, updatedAt=timestamp(), sourceHash=source_hash(content))
    encoded = project.model_dump_json()
    if base_revision is None:
        db.add(ExperimentProject(id=project_id, revision=revision, document=encoded))
    else:
        changed = db.execute(update(ExperimentProject).where(ExperimentProject.id == project_id,
                             ExperimentProject.revision == base_revision).values(revision=revision, document=encoded))
        if changed.rowcount != 1:
            db.rollback()
            raise HTTPException(409, 'This project changed in another session. Reload before saving.')
    db.add(ExperimentRevision(id=f'{project_id}:{revision}', project_id=project_id, document=encoded))
    mirror_workspace(db, project)
    db.commit()
    return project


def create_project(db: Session, content: ProjectContent):
    return save_project(db, uuid.uuid4().hex, content)


def propose_files(db: Session, project_id: str, proposal: ProposedFiles) -> dict:
    project = get_project(db, project_id)
    if project.revision != proposal.baseRevision:
        raise HTTPException(409, 'Proposal is based on an old revision')
    replacements = {f.name: f for f in proposal.files}
    merged = [replacements.pop(f.name, f) for f in project.files] + list(replacements.values())
    content = ProjectContent.model_validate({**project.model_dump(include=set(ProjectContent.model_fields)), 'files': [f.model_dump() for f in merged]})
    patch = {'id': uuid.uuid4().hex, 'projectId': project_id, 'baseRevision': project.revision,
             'status': 'proposed', 'explanation': proposal.explanation, 'createdAt': timestamp(),
             'before': project.model_dump(include=set(ProjectContent.model_fields)), 'after': content.model_dump()}
    db.add(ExperimentPatch(id=patch['id'], project_id=project_id, document=json.dumps(patch)))
    db.commit()
    return patch


def decide_patch(db: Session, project_id: str, patch_id: str, action: str):
    row = db.get(ExperimentPatch, patch_id)
    if not row or row.project_id != project_id:
        raise HTTPException(404, 'Proposal not found')
    patch = json.loads(row.document)
    if patch['status'] != 'proposed':
        raise HTTPException(409, 'Proposal was already resolved')
    current = get_project(db, project_id)
    if action == 'apply' and current.revision != patch['baseRevision']:
        raise HTTPException(409, 'Source changed after this proposal. Reject it and request a fresh patch.')
    patch['status'] = 'applied' if action == 'apply' else 'rejected'
    row.document = json.dumps(patch)
    if action == 'apply':
        return save_project(db, project_id, ProjectContent.model_validate(patch['after']), current.revision)
    db.commit()
    return current
