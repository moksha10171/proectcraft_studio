"""SQLAlchemy ORM models for ProjectCraft."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Workspace(Base):
    """One Studio session / project."""

    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(256), default="Untitled")
    mode: Mapped[str] = mapped_column(String(32), default="arduino")  # arduino | raspberry-pi | nextjs | html
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    messages: Mapped[list[ChatMessage]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    turns: Mapped[list[AgentTurn]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    tool_calls: Mapped[list[ToolCallRecord]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    files: Mapped[list[ProjectFile]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    wiring: Mapped[Wiring | None] = relationship(back_populates="workspace", cascade="all, delete-orphan", uselist=False)
    uploads: Mapped[list[Upload]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    usage_logs: Mapped[list[UsageLog]] = relationship(back_populates="workspace", cascade="all, delete-orphan")


class ChatMessage(Base):
    """UI-visible chat transcript (what the user sees in the chat panel)."""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(16))          # user | assistant
    type: Mapped[str] = mapped_column(String(16), default="text")   # text | thinking | error
    content: Mapped[str] = mapped_column(Text, default="")
    model_name: Mapped[str | None] = mapped_column(String(128))
    thinking: Mapped[str | None] = mapped_column(Text)
    token_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="messages")


class AgentTurn(Base):
    """API-level context history (what is sent to the LLM — separate from UI transcript).

    Mirrors `historyRef` in useAgentEngine. Stored separately so we can compress
    old turns without affecting the UI transcript.
    """

    __tablename__ = "agent_turns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    seq: Mapped[int] = mapped_column(Integer)              # Turn order within the workspace
    role: Mapped[str] = mapped_column(String(16))          # user | assistant | tool
    content: Mapped[str] = mapped_column(Text, default="") # JSON-serialised parts/content
    tool: Mapped[str | None] = mapped_column(String(64))   # Tool name if role==tool
    tool_call_id: Mapped[str | None] = mapped_column(String(64))
    compressed: Mapped[bool] = mapped_column(Boolean, default=False)
    token_estimate: Mapped[int | None] = mapped_column(Integer)

    workspace: Mapped[Workspace] = relationship(back_populates="turns")


class ToolCallRecord(Base):
    """Single canonical shape for a tool invocation — drives the Agent tab.

    Replaces the dual taxonomy (agent-types.ts + tool-registry.ts) with one
    server-owned record that both the Agent tab and chat panel consume directly.
    """

    __tablename__ = "tool_call_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    message_id: Mapped[str | None] = mapped_column(ForeignKey("chat_messages.id", ondelete="SET NULL"))
    tool: Mapped[str] = mapped_column(String(64))          # e.g. GENERATE_ARDUINO
    label: Mapped[str] = mapped_column(String(128), default="")
    emoji: Mapped[str] = mapped_column(String(8), default="🔧")
    args_json: Mapped[str] = mapped_column(Text, default="{}")
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending|running|success|error
    result: Mapped[str | None] = mapped_column(Text)       # Truncated output preview
    elapsed_ms: Mapped[int | None] = mapped_column(Integer)
    provider: Mapped[str | None] = mapped_column(String(32))
    model: Mapped[str | None] = mapped_column(String(128))
    prompt_tokens: Mapped[int | None] = mapped_column(Integer)
    completion_tokens: Mapped[int | None] = mapped_column(Integer)
    total_tokens: Mapped[int | None] = mapped_column(Integer)
    files_modified_json: Mapped[str | None] = mapped_column(Text)  # JSON list of filenames
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="tool_calls")


class ProjectFile(Base):
    """Backend-owned project files — replaces localStorage/JSON file sync."""

    __tablename__ = "project_files"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(256))          # e.g. sketch.ino, main.py
    content: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[str] = mapped_column(String(16), default="code")  # code | config | doc
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="files")


class Wiring(Base):
    """Hardware wiring manifest — one per workspace."""

    __tablename__ = "wirings"

    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True
    )
    manifest_json: Mapped[str] = mapped_column(Text, default="{}")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="wiring")


class Upload(Base):
    """User-uploaded files (images, datasheets, etc.) — stored on disk, tracked in DB."""

    __tablename__ = "uploads"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String(512))      # Original filename
    mime_type: Mapped[str | None] = mapped_column(String(128))
    size: Mapped[int | None] = mapped_column(Integer)       # Bytes
    path: Mapped[str] = mapped_column(String(1024))         # Relative to DATA_ROOT
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="uploads")


class UsageLog(Base):
    """Append-only token usage ledger — Logen-style lite accounting."""

    __tablename__ = "usage_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    provider: Mapped[str | None] = mapped_column(String(32))  # gemini | groq | openai | anthropic
    model: Mapped[str | None] = mapped_column(String(128))
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    task_type: Mapped[str | None] = mapped_column(String(64))  # e.g. GENERATE_ARDUINO
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="usage_logs")
