from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import FileResponse

from app.config import PROJECTS_DIR

router = APIRouter(prefix="/projects", tags=["projects"])


def _read_json(name: str):
    path = PROJECTS_DIR / name
    return json.loads(path.read_text(encoding="utf-8"))


def _get_projects():
    return _read_json("projects.json")


def _get_categories():
    categories = _read_json("categories.json")
    projects = _get_projects()
    return [
        {
            **cat,
            "projectCount": sum(
                1
                for p in projects
                if p.get("category", {}).get("slug") == cat.get("slug")
                or p.get("topicSlug") == cat.get("slug")
            ),
        }
        for cat in categories
    ]


@router.get("/list")
def list_projects(
    category: Optional[str] = None,
    language: Optional[str] = None,
    difficulty: Optional[str] = None,
    project_type: Optional[str] = None,
    featured: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    projects = _get_projects()
    if category:
        projects = [
            p
            for p in projects
            if p.get("category", {}).get("slug") == category or p.get("topicSlug") == category
        ]
    if language:
        projects = [p for p in projects if p.get("language") == language]
    if difficulty:
        projects = [p for p in projects if p.get("difficulty") == difficulty]
    if project_type:
        projects = [p for p in projects if p.get("project_type") == project_type]
    if featured == "1":
        projects = [p for p in projects if p.get("featured")]
    if search:
        q = search.lower()
        projects = [
            p
            for p in projects
            if q in (p.get("title") or "").lower()
            or q in (p.get("description") or "").lower()
        ]
    total = len(projects)
    page = projects[offset : offset + limit]
    return {
        "success": True,
        "data": page,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "hasMore": offset + limit < total,
        },
    }


@router.get("/get")
def get_project(slug: str = Query(...)):
    for p in _get_projects():
        if p.get("slug") == slug:
            return {"success": True, "data": p}
    return {"success": False, "error": "Not found"}


@router.get("/categories")
def categories():
    cats = _get_categories()
    return {"success": True, "data": cats, "total": len(cats)}


@router.get("/download")
def download(slug: str = Query(...)):
    for p in _get_projects():
        if p.get("slug") == slug:
            file_path = p.get("downloadPath") or p.get("download_path")
            if file_path:
                full = Path(file_path)
                if not full.is_absolute():
                    full = PROJECTS_DIR.parent.parent / file_path.lstrip("/")
                if full.is_file():
                    return FileResponse(full)
            break
    return {"success": False, "error": "Download not available"}
