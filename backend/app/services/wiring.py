"""Static comparison of what a sketch does with pins and what the circuit connects.

This is a heuristic, not a simulator. Only literal and simple named-constant pin arguments are
resolved; computed pins are reported as unresolved and pins managed by libraries (Servo, LCD, ...)
are invisible to it. Findings state what was actually seen so a learner can verify them.
"""
from __future__ import annotations

import re
from collections import defaultdict, deque

from app.domain.project import BOARDS, ProjectContent

CODE_SUFFIXES = ('.ino', '.cpp', '.c', '.h', '.hpp')
# Board geometry for the AVR boards the Studio compiles. analog_base is the pin number of A0.
AVR_LAYOUT = {
    'uno': {'digital': 14, 'analog_base': 14, 'analog': 6, 'pwm': {3, 5, 6, 9, 10, 11}},
    'nano': {'digital': 14, 'analog_base': 14, 'analog': 8, 'pwm': {3, 5, 6, 9, 10, 11}},
    'mega': {'digital': 54, 'analog_base': 54, 'analog': 16, 'pwm': {*range(2, 14), 44, 45, 46}},
}
CALLS = {'pinMode', 'digitalWrite', 'digitalRead', 'analogWrite', 'analogRead', 'tone', 'noTone', 'pulseIn', 'attachInterrupt'}
POWER = {'5V', '3V3', 'GND'}
DECLARATION = re.compile(
    r'\b(?:(?:const|constexpr|static|volatile)\s+)*(?:u?int(?:8|16|32)?_t|int|byte|short|long|unsigned(?:\s+(?:int|char|long))?|char)\s+(\w+)\s*=\s*(A?\d+)\s*;')
DEFINE = re.compile(r'^[ \t]*#[ \t]*define[ \t]+(\w+)[ \t]+\(?[ \t]*(A?\d+)[ \t]*\)?[ \t]*(?://.*)?$', re.MULTILINE)


def strip_noise(source: str) -> str:
    """Blank out comments and string/char literals, keeping every newline so line numbers hold."""
    out, i, n = [], 0, len(source)
    while i < n:
        two = source[i:i + 2]
        if two == '//':
            while i < n and source[i] != '\n':
                out.append(' '); i += 1
        elif two == '/*':
            out.append('  '); i += 2
            while i < n and source[i:i + 2] != '*/':
                out.append('\n' if source[i] == '\n' else ' '); i += 1
            out.append('  '); i += 2
        elif source[i] in '"\'':
            quote = source[i]; out.append(quote); i += 1
            while i < n and source[i] != quote and source[i] != '\n':
                if source[i] == '\\' and i + 1 < n:
                    out.append('  '); i += 2; continue
                out.append(' '); i += 1
            if i < n and source[i] == quote:
                out.append(quote); i += 1
        else:
            out.append(source[i]); i += 1
    return ''.join(out)


def split_arguments(text: str, open_index: int) -> list[str] | None:
    """Arguments of the call whose '(' is at open_index, or None when the parenthesis never closes."""
    depth, args, current = 0, [], []
    for i in range(open_index, len(text)):
        ch = text[i]
        if ch in '([{':
            depth += 1
            if depth > 1:
                current.append(ch)
        elif ch in ')]}':
            depth -= 1
            if depth == 0:
                args.append(''.join(current).strip())
                return [] if args == [''] else args
            current.append(ch)
        elif ch == ',' and depth == 1:
            args.append(''.join(current).strip()); current = []
        else:
            current.append(ch)
    return None


def collect_constants(sources: list[str]) -> dict[str, str]:
    constants: dict[str, str] = {}
    for text in sources:
        for name, value in DEFINE.findall(text):
            constants[name] = value
        for name, value in DECLARATION.findall(text):
            constants.setdefault(name, value)
    return constants


class PinResolver:
    def __init__(self, board_id: str, constants: dict[str, str]):
        self.layout = AVR_LAYOUT[board_id]
        self.constants = constants

    def number(self, expression: str, depth: int = 0) -> int | None:
        text = expression.strip().strip('()').strip()
        if re.fullmatch(r'\d+', text):
            return int(text)
        analog = re.fullmatch(r'A(\d+)', text)
        if analog:
            return self.layout['analog_base'] + int(analog.group(1))
        if text == 'LED_BUILTIN':
            return 13
        if text in self.constants and depth < 3:
            return self.number(self.constants[text], depth + 1)
        return None

    def terminal(self, pin: int, analog_channel: bool = False) -> str | None:
        layout = self.layout
        if analog_channel and pin < layout['analog']:
            return f'A{pin}'
        if 0 <= pin < layout['digital']:
            return f'D{pin}'
        if layout['analog_base'] <= pin < layout['analog_base'] + layout['analog']:
            return f'A{pin - layout["analog_base"]}'
        return None


def line_of(text: str, index: int) -> int:
    return text.count('\n', 0, index) + 1


def analyze_sketch(files: list[dict], board_id: str) -> tuple[dict, list[dict], list[dict]]:
    """Return (usage by board terminal, unresolved calls, invalid-pin findings)."""
    code = [(f['name'], strip_noise(f['content'])) for f in files if f['name'].lower().endswith(CODE_SUFFIXES)]
    resolver = PinResolver(board_id, collect_constants([text for _, text in code]))
    usage: dict[str, dict] = {}
    unresolved: list[dict] = []
    invalid: list[dict] = []
    pattern = re.compile(r'\b(' + '|'.join(sorted(CALLS)) + r')\s*\(')
    for name, text in code:
        for match in pattern.finditer(text):
            call = match.group(1)
            args = split_arguments(text, match.end() - 1)
            if not args:
                continue
            first = args[0]
            if call == 'attachInterrupt':
                inner = re.fullmatch(r'digitalPinToInterrupt\s*\((.*)\)', first, re.DOTALL)
                if not inner:
                    continue
                first = inner.group(1).strip()
            line = line_of(text, match.start())
            number = resolver.number(first)
            if number is None:
                unresolved.append({'file': name, 'line': line, 'call': call, 'expression': first[:60]})
                continue
            terminal = resolver.terminal(number, analog_channel=call == 'analogRead')
            if terminal is None or terminal not in BOARDS[board_id]['pins']:
                invalid.append({'file': name, 'line': line, 'call': call, 'pin': number})
                continue
            entry = usage.setdefault(terminal, {'terminal': f'board:{terminal}', 'pin': number, 'roles': set(), 'modes': set(), 'calls': []})
            entry['calls'].append({'file': name, 'line': line, 'call': call})
            if call == 'pinMode':
                mode = args[1].strip() if len(args) > 1 else ''
                if mode in ('OUTPUT', 'INPUT', 'INPUT_PULLUP'):
                    entry['modes'].add(mode)
                    entry['roles'].add('output' if mode == 'OUTPUT' else 'input')
            elif call in ('digitalWrite', 'tone', 'noTone'):
                entry['roles'].add('writes')
            elif call in ('digitalRead', 'pulseIn', 'attachInterrupt'):
                entry['roles'].add('reads')
            elif call == 'analogWrite':
                entry['roles'].add('pwm')
            elif call == 'analogRead':
                entry['roles'].add('analog_read')
    return usage, unresolved, invalid


class Graph:
    """Terminal connectivity: nets join terminals; a resistor joins its two ends only when allowed."""

    def __init__(self, circuit):
        self.net_of: dict[str, set[str]] = {}
        for net in circuit.nets:
            members = set(net.terminals)
            for terminal in members:
                self.net_of[terminal] = members
        self.parts = {p.id: p for p in circuit.parts}

    def connected(self, terminal: str) -> bool:
        return terminal in self.net_of

    def reach(self, start: str, through_resistors: bool) -> set[str]:
        seen, queue = {start}, deque([start])
        while queue:
            current = queue.popleft()
            neighbours = set(self.net_of.get(current, ()))
            owner, _, port = current.partition(':')
            part = self.parts.get(owner)
            if through_resistors and part is not None and part.kind == 'resistor' and port in ('1', '2'):
                neighbours.add(f'{owner}:{"2" if port == "1" else "1"}')
            for neighbour in neighbours - seen:
                seen.add(neighbour); queue.append(neighbour)
        return seen


def finding(code: str, severity: str, message: str, *, terminals: list[str] | None = None, file: str | None = None, line: int | None = None) -> dict:
    result = {'code': code, 'severity': severity, 'message': message, 'terminals': terminals or []}
    if file:
        result['file'] = file
    if line:
        result['line'] = line
    return result


def is_gpio(terminal: str) -> bool:
    return bool(re.fullmatch(r'board:(D\d+|A\d+)', terminal))


def check_wiring(content: ProjectContent) -> dict:
    board_id = content.boardId
    if board_id not in AVR_LAYOUT:
        return {'supported': False, 'boardId': board_id, 'pinUsage': [], 'unresolved': [], 'findings': [],
                'summary': 'Wiring checks cover Arduino C++ sketches for Uno, Nano and Mega. Python GPIO code is not analyzed.'}
    usage, unresolved, invalid = analyze_sketch([f.model_dump() for f in content.files], board_id)
    graph = Graph(content.circuit)
    has_circuit = bool(content.circuit.nets or content.circuit.parts)
    findings: list[dict] = []
    for item in invalid:
        findings.append(finding('invalid-pin', 'error', f'{item["call"]}({item["pin"]}, …) uses a pin that does not exist on {BOARDS[board_id]["name"]}.', file=item['file'], line=item['line']))
    for item in unresolved:
        findings.append(finding('unresolved-pin', 'info', f'{item["call"]}({item["expression"]}, …) uses a pin that is not a literal or simple constant, so it was not checked against the circuit.', file=item['file'], line=item['line']))
    # Pin capability: analogWrite on pins without hardware PWM only writes HIGH or LOW.
    pwm_pins = AVR_LAYOUT[board_id]['pwm']
    for entry in usage.values():
        if 'pwm' in entry['roles'] and entry['pin'] not in pwm_pins and entry['terminal'].startswith('board:D'):
            call = next(c for c in entry['calls'] if c['call'] == 'analogWrite')
            findings.append(finding('no-pwm', 'warning', f'analogWrite on {entry["terminal"][6:]}: this pin has no hardware PWM on {BOARDS[board_id]["name"]}, so it only writes fully HIGH or LOW. PWM pins: {", ".join("D" + str(p) for p in sorted(pwm_pins))}.', terminals=[entry['terminal']], file=call['file'], line=call['line']))
    if not has_circuit:
        pins = ', '.join(sorted(usage, key=lambda t: (t[0], int(t[1:])))) or 'none'
        findings.append(finding('no-circuit', 'info', f'No connections are defined, so the sketch was not compared with a circuit. Pins used by the sketch: {pins}. Add parts and connections in the Circuit panel to enable wiring checks.'))
    else:
        used_terminals = set()
        for terminal, entry in usage.items():
            used_terminals.add(entry['terminal'])
            builtin_led = terminal == 'D13' and bool(entry['roles'] & {'output', 'writes'})
            if not graph.connected(entry['terminal']) and not builtin_led and terminal not in ('D0', 'D1'):
                call = entry['calls'][0]
                findings.append(finding('unconnected-pin', 'warning', f'The sketch uses {terminal} ({call["call"]} at {call["file"]}:{call["line"]}) but nothing is connected to board:{terminal}. A pin that is read while unconnected floats.', terminals=[entry['terminal']], file=call['file'], line=call['line']))
        for terminal in sorted(graph.net_of):
            if is_gpio(terminal) and terminal not in used_terminals:
                pin = terminal[6:]
                findings.append(finding('unused-connection', 'info', f'{terminal} is connected to {", ".join(sorted(t for t in graph.net_of[terminal] if t != terminal))}, but no pinMode/digital/analog call in the sketch references {pin}. Pins managed by libraries such as Servo or LiquidCrystal are not detected.', terminals=[terminal]))
        for terminal, entry in usage.items():
            node = entry['terminal']
            if not graph.connected(node):
                continue
            nearby = graph.reach(node, through_resistors=True)
            buttons = sorted(t for t in nearby if t.split(':')[0] in graph.parts and graph.parts[t.split(':')[0]].kind == 'button')
            leds_anode = sorted(t for t in nearby if t.endswith(':A') and t.split(':')[0] in graph.parts and graph.parts[t.split(':')[0]].kind == 'led')
            if 'output' in entry['roles'] and buttons:
                findings.append(finding('output-on-button', 'warning', f'{terminal} is set as OUTPUT but is wired to {buttons[0].split(":")[0]}. Pressing the button can short the output pin to the other side of the switch. Use INPUT or INPUT_PULLUP for a button.', terminals=[node, buttons[0]], file=entry['calls'][0]['file'], line=entry['calls'][0]['line']))
            if 'input' in entry['roles'] and 'output' not in entry['roles'] and leds_anode:
                findings.append(finding('input-on-led', 'warning', f'{terminal} is configured as an input but is wired to the anode of {leds_anode[0].split(":")[0]}. An input cannot light the LED; use OUTPUT.', terminals=[node, leds_anode[0]], file=entry['calls'][0]['file'], line=entry['calls'][0]['line']))
        for part in content.circuit.parts:
            if part.kind == 'led':
                anode, cathode = f'{part.id}:A', f'{part.id}:K'
                pins = sorted(t for t in graph.reach(anode, False) if is_gpio(t))
                grounded = 'board:GND' in graph.reach(cathode, False)
                if pins and grounded:
                    findings.append(finding('led-no-resistor', 'warning', f'{part.label} ({part.id}) is wired from {pins[0][6:]} to GND with no series resistor. Add a current-limiting resistor (commonly 220 Ω to 1 kΩ at 5 V) to protect the LED and the pin.', terminals=[anode, cathode, pins[0]]))
            elif part.kind == 'button':
                for side, other in ((f'{part.id}:1', f'{part.id}:2'), (f'{part.id}:2', f'{part.id}:1')):
                    pins = sorted(t for t in graph.reach(side, False) if is_gpio(t))
                    if not pins or 'board:GND' not in graph.reach(other, False):
                        continue
                    pin = pins[0]
                    entry = usage.get(pin[6:])
                    if entry is None or 'input_pullup' in entry['modes'] or 'INPUT_PULLUP' in entry['modes']:
                        break
                    if 'output' in entry['roles']:
                        break
                    pulled_up = '5V' in {t[6:] for t in graph.reach(pin, True) if t.startswith('board:')}
                    if not pulled_up:
                        call = entry['calls'][0]
                        findings.append(finding('floating-button', 'warning', f'{part.label} ({part.id}) connects {pin[6:]} to GND but the pin has no pull-up. While the button is open the input floats. Use pinMode({entry["pin"]}, INPUT_PULLUP) or add a resistor from {pin[6:]} to 5V.', terminals=[pin, f'{part.id}:1', f'{part.id}:2'], file=call['file'], line=call['line']))
                    break
    order = {'error': 0, 'warning': 1, 'info': 2}
    findings.sort(key=lambda f: (order[f['severity']], f['code'], f.get('file') or '', f.get('line') or 0))
    counts = defaultdict(int)
    for item in findings:
        counts[item['severity']] += 1
    def plural(n: int, word: str) -> str:
        return f'{n} {word}' + ('' if n == 1 else 's')
    summary = (f'{plural(counts["error"], "error")}, {plural(counts["warning"], "warning")}, {plural(counts["info"], "note")}. ' if findings else 'No wiring issues found. ') + \
        'Static analysis of literal and constant pin arguments; it is not a simulation and does not verify electrical correctness.'
    pin_usage = [{'terminal': e['terminal'], 'pin': e['pin'], 'roles': sorted(e['roles']), 'modes': sorted(e['modes']), 'calls': e['calls'],
                  'connected': graph.connected(e['terminal']), 'builtinLed': t == 'D13'}
                 for t, e in sorted(usage.items(), key=lambda kv: (kv[0][0], int(kv[0][1:])))]
    return {'supported': True, 'boardId': board_id, 'hasCircuit': has_circuit, 'pinUsage': pin_usage, 'unresolved': unresolved, 'findings': findings, 'summary': summary}


def describe(result: dict) -> str:
    """Plain-text form for the assistant: facts first, each finding with its code and location."""
    if not result['supported']:
        return result['summary']
    lines = [result['summary']]
    for item in result['pinUsage']:
        where = ', '.join(f'{c["call"]}@{c["file"]}:{c["line"]}' for c in item['calls'][:4])
        built_in = ' (drives the on-board LED)' if item['builtinLed'] else ''
        lines.append(f'- {item["terminal"]} roles={",".join(item["roles"]) or "none"} connected={item["connected"]}{built_in} ({where})')
    for item in result['findings']:
        place = f' [{item["file"]}:{item["line"]}]' if item.get('file') else ''
        lines.append(f'* {item["severity"].upper()} {item["code"]}{place}: {item["message"]}')
    return '\n'.join(lines)
