"""Web search + scraper for the WEB_SEARCH tool.

Supports Serper (SERPER_API_KEY) or Brave (BRAVE_SEARCH_API_KEY) for search,
then scrapes the top result pages with httpx + beautifulsoup4 to extract
readable text. This gives any provider benefit from real web research.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any

import httpx

log = logging.getLogger(__name__)

SCRAPE_MAX_CHARS = 3000
SCRAPE_TIMEOUT = 10.0
SUMMARY_MAX_CHARS = 6000
MAX_SCRAPE_URLS = 3


# ── Search providers ──────────────────────────────────────────────────────────

async def _search_serper(query: str, num: int = 5) -> list[dict]:
    key = os.environ.get("SERPER_API_KEY", "").strip()
    if not key:
        return []
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://google.serper.dev/search",
            json={"q": query, "num": num},
            headers={"X-API-KEY": key, "Content-Type": "application/json"},
        )
        resp.raise_for_status()
    data = resp.json()
    results = []
    for r in (data.get("organic") or [])[:num]:
        results.append({
            "title": r.get("title", ""),
            "url": r.get("link", ""),
            "snippet": r.get("snippet", ""),
        })
    return results


async def _search_brave(query: str, num: int = 5) -> list[dict]:
    key = os.environ.get("BRAVE_SEARCH_API_KEY", "").strip()
    if not key:
        return []
    q = query.replace(" ", "+")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"https://api.search.brave.com/res/v1/web/search?q={q}&count={num}",
            headers={"Accept": "application/json", "X-Subscription-Token": key},
        )
        resp.raise_for_status()
    data = resp.json()
    results = []
    for r in (data.get("web", {}).get("results") or [])[:num]:
        results.append({
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "snippet": r.get("description", ""),
        })
    return results


# ── Scraper ───────────────────────────────────────────────────────────────────

def _extract_text_bs4(html: str) -> str:
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")
        # Remove script/style/nav
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        # Collapse whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:SCRAPE_MAX_CHARS]
    except Exception as exc:
        log.debug("bs4 extraction failed: %s", exc)
        return ""


def _extract_text_selectolax(html: str) -> str:
    try:
        from selectolax.parser import HTMLParser
        tree = HTMLParser(html)
        for node in tree.css("script, style, nav, footer, header, aside"):
            node.decompose()
        text = tree.body.text(separator=" ") if tree.body else ""
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:SCRAPE_MAX_CHARS]
    except Exception as exc:
        log.debug("selectolax extraction failed: %s", exc)
        return ""


async def _scrape_url(url: str) -> str:
    if not url or not url.startswith("http"):
        return ""
    try:
        async with httpx.AsyncClient(
            timeout=SCRAPE_TIMEOUT,
            follow_redirects=True,
            headers={"User-Agent": "ProjectCraft-Research/1.0 (+https://github.com/projectcraft)"},
        ) as client:
            resp = await client.get(url)
            if resp.status_code >= 400:
                return ""
            content_type = resp.headers.get("content-type", "")
            if "text/html" not in content_type and "text/plain" not in content_type:
                return ""
            html = resp.text

        # Try selectolax first (faster), fall back to bs4
        text = _extract_text_selectolax(html) or _extract_text_bs4(html)
        return text
    except Exception as exc:
        log.debug("Scrape failed for %s: %s", url, exc)
        return ""


# ── Main entry point ──────────────────────────────────────────────────────────

async def web_search(query: str, context: str = "") -> dict[str, Any]:
    """Perform a web search and scrape top results.

    Returns:
        {
            "summary": str,          # snippet-based summary (always populated if results found)
            "scraped_text": str,     # combined scraped page text
            "sources": [{"title", "url", "snippet"}],
        }
    """
    full_query = f"{query} {context}".strip() if context else query

    # Try search providers in order
    results: list[dict] = []
    try:
        results = await _search_serper(full_query)
    except Exception as exc:
        log.debug("Serper failed: %s", exc)

    if not results:
        try:
            results = await _search_brave(full_query)
        except Exception as exc:
            log.debug("Brave failed: %s", exc)

    if not results:
        return {
            "summary": "Web search is not configured. Add SERPER_API_KEY or BRAVE_SEARCH_API_KEY to .env.local.",
            "scraped_text": "",
            "sources": [],
        }

    # Build snippet-based summary
    summary_parts = [f"{r['title']}: {r['snippet']}" for r in results[:3] if r.get("snippet")]
    summary = "\n".join(summary_parts) or "No results found."

    # Scrape top URLs in parallel
    import asyncio
    urls_to_scrape = [r["url"] for r in results[:MAX_SCRAPE_URLS] if r.get("url")]
    scraped_texts = await asyncio.gather(*[_scrape_url(url) for url in urls_to_scrape], return_exceptions=True)

    combined_scraped = ""
    for url, scraped in zip(urls_to_scrape, scraped_texts):
        if isinstance(scraped, str) and scraped:
            combined_scraped += f"\n\n--- {url} ---\n{scraped}"

    if len(combined_scraped) > SUMMARY_MAX_CHARS:
        combined_scraped = combined_scraped[:SUMMARY_MAX_CHARS] + "\n\n[... truncated ...]"

    return {
        "summary": summary,
        "scraped_text": combined_scraped.strip(),
        "sources": [{"title": r["title"], "url": r["url"], "snippet": r.get("snippet", "")} for r in results],
    }
