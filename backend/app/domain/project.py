"""Portable project contracts shared by storage, builds and assistant proposals."""
from __future__ import annotations

import hashlib
import json
from pathlib import PurePosixPath
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator

BOARDS = {
    'uno': {'name': 'Arduino Uno', 'mode': 'arduino', 'fqbn': 'arduino:avr:uno', 'clockHz': 16000000, 'emulator': 'avr8js-atmega328p', 'pins': [*[f'D{i}' for i in range(14)], *[f'A{i}' for i in range(6)], '5V', '3V3', 'GND']},
    'nano': {'name': 'Arduino Nano (classic)', 'mode': 'arduino', 'fqbn': 'arduino:avr:nano', 'clockHz': 16000000, 'emulator': None, 'pins': [*[f'D{i}' for i in range(14)], *[f'A{i}' for i in range(8)], '5V', '3V3', 'GND']},
    'mega': {'name': 'Arduino Mega 2560', 'mode': 'arduino', 'fqbn': 'arduino:avr:mega', 'clockHz': 16000000, 'emulator': None, 'pins': [*[f'D{i}' for i in range(54)], *[f'A{i}' for i in range(16)], '5V', '3V3', 'GND']},
    'pi4': {'name': 'Raspberry Pi • Linux Python', 'mode': 'raspberry-pi', 'fqbn': None, 'clockHz': None, 'emulator': None, 'pins': [*[f'GPIO{i}' for i in range(28)], '3V3', '5V', 'GND']},
}
PORTS = {'led': ['A', 'K'], 'resistor': ['1', '2'], 'button': ['1', '2']}


class Contract(BaseModel):
    model_config = ConfigDict(extra='forbid')


class Source(Contract):
    name: str = Field(min_length=1, max_length=200)
    content: str = Field(max_length=500_000)
    type: Literal['code', 'config', 'doc'] = 'code'

    @field_validator('name')
    @classmethod
    def safe_path(cls, value: str) -> str:
        p = PurePosixPath(value)
        if p.is_absolute() or '..' in p.parts or '\\' in value or ':' in value or str(p) in ('', '.') or str(p) != value:
            raise ValueError('Use a normalized relative project path')
        return value


class Part(Contract):
    id: str = Field(pattern=r'^[a-z][a-z0-9_-]{0,40}$')
    kind: Literal['led', 'resistor', 'button']
    label: str = Field(min_length=1, max_length=100)
    x: float = Field(default=500, ge=0, le=4000)
    y: float = Field(default=180, ge=0, le=4000)
    value: str = Field(default='', max_length=60)


class Net(Contract):
    id: str = Field(pattern=r'^[a-z][a-z0-9_-]{0,40}$')
    label: str = Field(default='', max_length=100)
    terminals: list[str] = Field(min_length=2, max_length=64)


class Circuit(Contract):
    parts: list[Part] = Field(default_factory=list, max_length=50)
    nets: list[Net] = Field(default_factory=list, max_length=100)


class Dependency(Contract):
    name: str = Field(min_length=1, max_length=150)
    version: str = Field(min_length=1, max_length=100)
    source: str = Field(default='arduino-library', max_length=200)


class ProjectContent(Contract):
    name: str = Field(min_length=1, max_length=100)
    boardId: Literal['uno', 'nano', 'mega', 'pi4'] = 'uno'
    coreVersion: str | None = Field(default='1.8.8', pattern=r'^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$', max_length=60)
    files: list[Source] = Field(min_length=1, max_length=50)
    circuit: Circuit = Field(default_factory=Circuit)
    dependencies: list[Dependency] = Field(default_factory=list, max_length=100)
    notes: str = Field(default='', max_length=50_000)

    @model_validator(mode='after')
    def coherent_project(self):
        if self.boardId == 'pi4':
            self.coreVersion = None
        names = [f.name for f in self.files]
        if len(names) != len(set(names)):
            raise ValueError('Duplicate file names')
        if sum(len(f.content.encode()) for f in self.files) > 1_000_000:
            raise ValueError('Project source exceeds 1 MB')
        part_ids = [p.id for p in self.circuit.parts]
        if 'board' in part_ids or len(part_ids) != len(set(part_ids)):
            raise ValueError('Duplicate or reserved component ID')
        allowed = {f'board:{pin}' for pin in BOARDS[self.boardId]['pins']}
        for part in self.circuit.parts:
            allowed.update(f'{part.id}:{port}' for port in PORTS[part.kind])
        seen = set()
        ids = set()
        for net in self.circuit.nets:
            if net.id in ids:
                raise ValueError('Duplicate net ID')
            ids.add(net.id)
            for terminal in net.terminals:
                if terminal not in allowed:
                    raise ValueError(f'Unknown terminal: {terminal}')
                if terminal in seen:
                    raise ValueError(f'Terminal belongs to multiple nets: {terminal}')
                seen.add(terminal)
        return self


class Project(ProjectContent):
    schemaVersion: Literal[1] = 1
    id: str
    revision: int = Field(ge=1)
    updatedAt: str
    sourceHash: str


class SaveProject(Contract):
    baseRevision: int = Field(ge=1)
    content: ProjectContent


class Diagnostic(Contract):
    severity: Literal['error', 'warning', 'info']
    message: str
    file: str | None = None
    line: int | None = None
    column: int | None = None


class ProposedFiles(Contract):
    baseRevision: int = Field(ge=1)
    files: list[Source] = Field(min_length=1, max_length=50)
    explanation: str = Field(default='', max_length=10_000)


def source_hash(content: ProjectContent) -> str:
    payload = {'boardId': content.boardId, 'files': sorted([f.model_dump() for f in content.files], key=lambda f: f['name']),
               'coreVersion': content.coreVersion, 'dependencies': [d.model_dump() for d in content.dependencies]}
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
