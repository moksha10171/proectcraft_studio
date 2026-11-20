"""Tools that only the browser can run (the simulators live there) are requested over the SSE stream and
answered with a POST. The loop waits on a future keyed by the request id; nothing is trusted until the
route validates the payload."""
from __future__ import annotations

import asyncio
import uuid

_pending: dict[str, asyncio.Future] = {}


def open_request() -> tuple[str, asyncio.Future]:
    request_id = uuid.uuid4().hex
    future = asyncio.get_running_loop().create_future()
    _pending[request_id] = future
    return request_id, future


async def wait(request_id: str, future: asyncio.Future, timeout: float) -> dict | None:
    try:
        return await asyncio.wait_for(future, timeout)
    except asyncio.TimeoutError:
        return None
    finally:
        _pending.pop(request_id, None)


def resolve(request_id: str, payload: dict) -> bool:
    future = _pending.get(request_id)
    if not future or future.done():
        return False
    future.set_result(payload)
    return True
