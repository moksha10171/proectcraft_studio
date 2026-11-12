"""Digital trace measurements for recorded emulator runs.

Mirrors frontend/features/execution/signal-analysis.ts so the assistant reads the same numbers the
Signals panel shows. Backend/frontend parity is pinned by tests/test_signals.py.
"""
from __future__ import annotations

from statistics import median as _median


def median(values: list[float]) -> float | None:
    return float(_median(values)) if values else None


def channels(trace: list[dict]) -> dict[str, list[tuple[float, int]]]:
    """Group pin events by channel, dropping repeated levels so every entry is an edge."""
    result: dict[str, list[tuple[float, int]]] = {}
    for event in trace:
        pin, value = event.get('pin'), event.get('value')
        if not pin or value is None:
            continue
        level = 1 if value else 0
        edges = result.setdefault(pin, [])
        if edges and edges[-1][1] == level:
            continue
        edges.append((float(event['timeUs']), level))
    return result


def measure(edges: list[tuple[float, int]]) -> dict:
    """Period, frequency, duty and pulse widths. A rise only counts if the prior low was observed."""
    rises: list[float] = []
    highs: list[float] = []
    lows: list[float] = []
    for i in range(1, len(edges)):
        previous, (time, level) = edges[i - 1], edges[i]
        if level == 1:
            rises.append(time)
            if i >= 2:
                lows.append(time - previous[0])
        elif i >= 2:
            highs.append(time - previous[0])
    base = {'transitions': max(0, len(edges) - 1), 'cycles': 0, 'periodUs': None, 'frequencyHz': None, 'dutyPercent': None,
            'highUs': median(highs), 'lowUs': median(lows)}
    if len(rises) < 2:
        return base
    start, end = rises[0], rises[-1]
    high_total = 0.0
    for i in range(len(edges) - 1):
        if edges[i][1] != 1:
            continue
        low, high = max(edges[i][0], start), min(edges[i + 1][0], end)
        if high > low:
            high_total += high - low
    intervals = [b - a for a, b in zip(rises, rises[1:])]
    period = median(intervals)
    span = end - start
    return {**base, 'cycles': len(intervals), 'periodUs': period,
            'frequencyHz': 1e6 / period if period and period > 0 else None,
            'dutyPercent': min(100.0, high_total / span * 100) if span > 0 else None}


def summarize(trace: list[dict]) -> dict:
    return {'pins': {pin: measure(edges) for pin, edges in sorted(channels(trace).items())},
            'serial': ''.join(event.get('serial', '') for event in trace if event.get('serial'))}


def _time(us: float) -> str:
    if abs(us) >= 1e6:
        return f'{us / 1e6:.3f} s'
    if abs(us) >= 1e3:
        return f'{us / 1e3:.3f} ms'
    return f'{us:.1f} µs'


def describe(run: dict, current_revision: int) -> str:
    """Facts about one recording, labelled with its origin and whether it matches the current source."""
    summary = summarize(run.get('trace') or [])
    state = 'matches the current revision' if run.get('sourceRevision') == current_revision else f'STALE: current source is revision {current_revision}'
    lines = [f'Recording {run["id"][:8]} · {run.get("origin")} · {run.get("engine")} · source revision {run.get("sourceRevision")} ({state}) · '
             f'{run.get("durationMs", 0) / 1000:.3f} s simulated · {len(run.get("trace") or [])} retained events · {run.get("dropped", 0)} dropped.']
    for pin, m in summary['pins'].items():
        parts = [f'{m["transitions"]} edges']
        if m['periodUs'] is not None:
            parts += [f'period {_time(m["periodUs"])}', f'{m["frequencyHz"]:.3f} Hz', f'duty {m["dutyPercent"]:.1f} %' if m['dutyPercent'] is not None else 'duty n/a']
        else:
            parts.append('fewer than two observed rising edges, so no period')
        if m['highUs'] is not None:
            parts.append(f'high {_time(m["highUs"])}')
        if m['lowUs'] is not None:
            parts.append(f'low {_time(m["lowUs"])}')
        lines.append(f'- {pin}: ' + ', '.join(parts))
    if not summary['pins']:
        lines.append('- No pin edges were recorded.')
    serial = summary['serial']
    lines.append(f'UART text ({len(serial)} chars{", first 400 shown" if len(serial) > 400 else ""}): {serial[:400]!r}' if serial else 'UART text: none.')
    if run.get('dropped'):
        lines.append('Events were dropped at the buffer limit; measurements describe retained events only.')
    lines.append('Origin is the AVR8js emulator (digital model, no analog solver); it is not physical hardware evidence.')
    return '\n'.join(lines)
