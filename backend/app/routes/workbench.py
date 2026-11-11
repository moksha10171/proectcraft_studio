"""Project-first API. Portable exports contain domain data, never credentials."""
import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ExperimentProject, ExperimentRevision, ExperimentPatch, ExperimentRun, Workspace
from app.db import repo
from app.domain.project import Contract, ProjectContent, SaveProject, ProposedFiles, Diagnostic, Dependency, BOARDS
from app.routes.studio import get_db
from app.services.experiments import get_project, save_project, create_project, propose_files, decide_patch
from app.services.builds import build_project, toolchain_info

router = APIRouter(prefix='/workbench', tags=['workbench'])


class NewProject(Contract):
    name: str = Field(min_length=1, max_length=100)
    boardId: Literal['uno', 'nano', 'mega', 'pi4'] = 'uno'
    template: Literal['blink', 'button', 'empty'] = 'blink'


class RevisionBody(Contract):
    revision: int = Field(ge=1)


class UndoBody(Contract):
    baseRevision: int = Field(ge=1)


class SignalEvent(Contract):
    timeUs: float = Field(ge=0, allow_inf_nan=False)
    pin: str | None = Field(default=None, pattern=r'^(D(?:[0-9]|1[0-3])|A[0-5])$')
    value: Literal[0, 1] | None = None
    serial: str | None = Field(default=None, max_length=1000)


class ImportedRun(BaseModel):
    # Local build records carry additional metadata; never import executable artifacts.
    model_config = ConfigDict(extra='ignore')
    id: str = Field(default='', max_length=100)
    origin: str = Field(default='imported', max_length=100)
    referenceOrigin: str | None = Field(default=None, max_length=100)
    referenceRunId: str | None = Field(default=None, max_length=100)
    buildId: str | None = Field(default=None, max_length=100)
    artifactHash: str | None = Field(default=None, max_length=128)
    dependencies: list[Dependency] = Field(default_factory=list, max_length=100)
    sourceHash: str = Field(default='', max_length=128)
    sourceRevision: int = Field(default=1, ge=1)
    boardId: Literal['uno', 'nano', 'mega', 'pi4'] = 'uno'
    engine: str = Field(default='unknown', max_length=100)
    engineVersion: str | None = Field(default=None, max_length=100)
    status: str = Field(default='recorded', max_length=50)
    startedAt: str = Field(default='', max_length=100)
    output: str = Field(default='', max_length=500_000)
    diagnostics: list[Diagnostic] = Field(default_factory=list, max_length=1000)
    toolchain: dict = Field(default_factory=dict)
    durationMs: float = Field(default=0, ge=0, allow_inf_nan=False)
    dropped: int = Field(default=0, ge=0)
    trace: list[SignalEvent] = Field(default_factory=list, max_length=10_000)

    @model_validator(mode='after')
    def ordered_trace(self):
        times = [event.timeUs for event in self.trace]
        if times != sorted(times) or any(t > self.durationMs * 1000 for t in times):
            raise ValueError('Imported trace must be ordered within its recording duration')
        return self


class Bundle(Contract):
    format: Literal['projectcraft-experiment'] = 'projectcraft-experiment'
    schemaVersion: Literal[1] = 1
    project: ProjectContent
    runs: list[ImportedRun] = Field(default_factory=list, max_length=20)


@router.get('/boards')
async def boards():
    return {'boards': [{'id': key, **value} for key, value in BOARDS.items()], 'toolchain': await toolchain_info()}


def template(body: NewProject):
    if body.boardId == 'pi4':
        code = 'from signal import pause\nfrom gpiozero import LED\n\nwith LED(17) as led:\n    led.blink(on_time=1, off_time=1)\n    pause()\n'
        return ProjectContent(name=body.name, boardId=body.boardId, files=[{'name': 'main.py', 'content': '' if body.template == 'empty' else code}],
                              notes='Linux Raspberry Pi GPIO. Syntax checking does not execute GPIO or emulate a Pi.')
    code = 'void setup() {\n  pinMode(LED_BUILTIN, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  Serial.println("LED on");\n  delay(1000);\n  digitalWrite(LED_BUILTIN, LOW);\n  Serial.println("LED off");\n  delay(1000);\n}\n'
    circuit = {'parts': [], 'nets': []}
    if body.template == 'button':
        code = 'void setup() {\n  pinMode(2, INPUT_PULLUP);\n  pinMode(LED_BUILTIN, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  const bool pressed = digitalRead(2) == LOW;\n  digitalWrite(LED_BUILTIN, pressed);\n  Serial.println(pressed ? "Pressed" : "Released");\n  delay(100);\n}\n'
        circuit = {'parts': [{'id': 'button1', 'kind': 'button', 'label': 'Push button', 'x': 500, 'y': 140}],
                   'nets': [{'id': 'input', 'label': 'D2 / input pull-up', 'terminals': ['board:D2', 'button1:1']},
                            {'id': 'ground', 'label': 'Ground', 'terminals': ['board:GND', 'button1:2']}]}
    if body.template == 'empty':
        code = 'void setup() {\n}\n\nvoid loop() {\n}\n'
    return ProjectContent(name=body.name, boardId=body.boardId, files=[{'name': 'sketch.ino', 'content': code}], circuit=circuit,
                          notes='Predict what happens on D13, change the delay, then compare GPIO and serial events. Built-in LED is on the board; it needs no external wire.')


@router.get('/projects')
def projects(db: Session = Depends(get_db)):
    # Import legacy workspaces without rewriting their files or losing any history.
    for ws in db.scalars(select(Workspace)).all():
        if db.get(ExperimentProject, ws.id):
            continue
        files = repo.list_files(db, ws.id)
        if files:
            content = ProjectContent(name=ws.name if ws.name != 'Untitled' else 'Imported workspace',
                        boardId='pi4' if ws.mode == 'raspberry-pi' else 'uno',
                        files=[{'name': f.name, 'content': f.content, 'type': f.type} for f in files],
                        notes='Imported from the earlier Studio. Legacy wiring is retained in the workspace; rebuild connections in the terminal editor.')
            save_project(db, ws.id, content)
    return [json.loads(row.document) for row in db.scalars(select(ExperimentProject)).all()]


@router.post('/projects')
def new_project(body: NewProject, db: Session = Depends(get_db)):
    return create_project(db, template(body))


@router.post('/import')
def import_bundle(body: Bundle, db: Session = Depends(get_db)):
    project = create_project(db, body.project)
    # Imported runs are reference data; never claim they were executed here.
    for source in body.runs:
        allowed = source.model_dump(exclude_none=True)
        import uuid
        run = {**allowed, 'referenceOrigin': allowed.get('referenceOrigin') or allowed['origin'],
               'referenceRunId': allowed.get('referenceRunId') or allowed['id'],
               'id': uuid.uuid4().hex, 'projectId': project.id, 'origin': 'imported', 'valid': False}
        db.add(ExperimentRun(id=run['id'], project_id=project.id, document=json.dumps(run)))
    db.commit()
    return project


@router.get('/projects/{project_id}')
def read_project(project_id: str, db: Session = Depends(get_db)):
    return get_project(db, project_id)


@router.put('/projects/{project_id}')
def update_project(project_id: str, body: SaveProject, db: Session = Depends(get_db)):
    return save_project(db, project_id, body.content, body.baseRevision)


@router.post('/projects/{project_id}/undo')
def undo(project_id: str, body: UndoBody, db: Session = Depends(get_db)):
    current = get_project(db, project_id)
    if current.revision != body.baseRevision:
        raise HTTPException(409, 'Project changed. Reload before undoing.')
    previous = db.get(ExperimentRevision, f'{project_id}:{current.revision - 1}')
    if not previous:
        raise HTTPException(409, 'No earlier revision')
    content = ProjectContent.model_validate({k: v for k, v in json.loads(previous.document).items() if k in ProjectContent.model_fields})
    return save_project(db, project_id, content, current.revision)


@router.get('/projects/{project_id}/export')
def export_bundle(project_id: str, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    runs = [json.loads(r.document) for r in db.scalars(select(ExperimentRun).where(ExperimentRun.project_id == project_id)).all()][-20:]
    for run in runs:
        run.pop('artifact', None)
    return Bundle(project=ProjectContent.model_validate(project.model_dump(include=set(ProjectContent.model_fields))), runs=runs)


@router.post('/projects/{project_id}/build')
async def build(project_id: str, body: RevisionBody, db: Session = Depends(get_db)):
    return await build_project(db, project_id, body.revision)


@router.get('/projects/{project_id}/runs')
def runs(project_id: str, db: Session = Depends(get_db)):
    get_project(db, project_id)
    return sorted([json.loads(r.document) for r in db.scalars(select(ExperimentRun).where(ExperimentRun.project_id == project_id)).all()], key=lambda r: r.get('startedAt', ''), reverse=True)[:20]


@router.get('/projects/{project_id}/patches')
def patches(project_id: str, db: Session = Depends(get_db)):
    get_project(db, project_id)
    return [json.loads(p.document) for p in db.scalars(select(ExperimentPatch).where(ExperimentPatch.project_id == project_id)).all()]


@router.post('/projects/{project_id}/patches')
def propose(project_id: str, body: ProposedFiles, db: Session = Depends(get_db)):
    return propose_files(db, project_id, body)


@router.post('/projects/{project_id}/patches/{patch_id}/{action}')
def decide(project_id: str, patch_id: str, action: Literal['apply', 'reject'], db: Session = Depends(get_db)):
    return decide_patch(db, project_id, patch_id, action)


class Recording(Contract):
    buildId: str
    events: list[SignalEvent] = Field(max_length=10_000)
    durationUs: float = Field(ge=0, allow_inf_nan=False)
    dropped: int = Field(default=0, ge=0)


@router.post('/projects/{project_id}/recordings')
def record(project_id: str, body: Recording, db: Session = Depends(get_db)):
    import uuid
    from app.services.experiments import timestamp
    project = get_project(db, project_id)
    build = db.get(ExperimentRun, body.buildId)
    if not build or build.project_id != project_id:
        raise HTTPException(404, 'Build not found')
    compiled = json.loads(build.document)
    if compiled.get('origin') != 'compiler' or not compiled.get('valid') or compiled.get('boardId') != 'uno':
        raise HTTPException(400, 'A successful local Uno build is required')
    times = [e.timeUs for e in body.events]
    if times != sorted(times) or any(t > body.durationUs for t in times):
        raise HTTPException(400, 'Trace events must be ordered within the recording duration')
    run = {'id': uuid.uuid4().hex, 'projectId': project_id, 'sourceRevision': compiled['sourceRevision'],
           'sourceHash': compiled['sourceHash'], 'boardId': compiled['boardId'], 'origin': 'emulator',
           'engine': 'avr8js-atmega328p', 'engineVersion': '0.21.1', 'status': 'recorded', 'valid': True,
           'buildId': body.buildId, 'toolchain': compiled.get('toolchain', {}), 'dependencies': compiled.get('dependencies', []), 'artifactHash': compiled.get('artifact', {}).get('sha256'),
           'startedAt': timestamp(), 'durationMs': body.durationUs / 1000, 'trace': [e.model_dump(exclude_none=True) for e in body.events],
           'dropped': body.dropped, 'output': 'CPU/peripheral execution; digital model only. No analog electrical solver.', 'diagnostics': []}
    db.add(ExperimentRun(id=run['id'], project_id=project_id, document=json.dumps(run)))
    db.commit()
    return run
