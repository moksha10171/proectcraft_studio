"""Wiring check: static sketch-vs-circuit analysis. No compiler or model involved."""
from app.domain.project import ProjectContent
from app.services.wiring import check_wiring, describe, strip_noise, split_arguments


def project(code: str, parts=None, nets=None, board='uno', name='sketch.ino') -> ProjectContent:
    return ProjectContent(name='t', boardId=board, files=[{'name': name, 'content': code}], circuit={'parts': parts or [], 'nets': nets or []})


def net(id, *terminals):
    return {'id': id, 'label': id, 'terminals': list(terminals)}


def codes(result):
    return sorted(f['code'] for f in result['findings'])


LED = {'id': 'led1', 'kind': 'led', 'label': 'LED'}
RESISTOR = {'id': 'r1', 'kind': 'resistor', 'label': 'Resistor', 'value': '330 Ω'}
BUTTON = {'id': 'btn1', 'kind': 'button', 'label': 'Push button'}
DRIVE_D8 = 'void setup(){ pinMode(8, OUTPUT); }\nvoid loop(){ digitalWrite(8, HIGH); }\n'


def test_default_blink_has_no_circuit_note_and_uses_builtin_led():
    result = check_wiring(project('void setup(){ pinMode(LED_BUILTIN, OUTPUT); }\nvoid loop(){ digitalWrite(LED_BUILTIN, HIGH); }'))
    assert result['supported'] and not result['hasCircuit']
    assert codes(result) == ['no-circuit']
    assert result['summary'].startswith('0 errors, 0 warnings, 1 note. ')
    assert [(u['terminal'], u['builtinLed']) for u in result['pinUsage']] == [('board:D13', True)]


def test_shipped_button_example_is_clean():
    code = 'void setup(){ pinMode(2, INPUT_PULLUP); pinMode(LED_BUILTIN, OUTPUT); }\nvoid loop(){ digitalWrite(LED_BUILTIN, digitalRead(2)==LOW); }'
    result = check_wiring(project(code, [BUTTON], [net('in', 'board:D2', 'btn1:1'), net('gnd', 'board:GND', 'btn1:2')]))
    assert result['findings'] == []
    assert 'No wiring issues' in result['summary']


def test_led_without_series_resistor_is_flagged_and_resistor_fixes_it():
    bare = check_wiring(project(DRIVE_D8, [LED], [net('a', 'board:D8', 'led1:A'), net('k', 'led1:K', 'board:GND')]))
    assert codes(bare) == ['led-no-resistor']
    assert bare['findings'][0]['terminals'][-1] == 'board:D8'
    fixed = check_wiring(project(DRIVE_D8, [LED, RESISTOR], [net('a', 'board:D8', 'r1:1'), net('b', 'r1:2', 'led1:A'), net('k', 'led1:K', 'board:GND')]))
    assert fixed['findings'] == []
    # A resistor on the cathode side protects the LED just as well.
    low_side = check_wiring(project(DRIVE_D8, [LED, RESISTOR], [net('a', 'board:D8', 'led1:A'), net('b', 'led1:K', 'r1:1'), net('c', 'r1:2', 'board:GND')]))
    assert low_side['findings'] == []


def test_button_without_pull_up_is_flagged():
    code = 'void setup(){ pinMode(2, INPUT); }\nvoid loop(){ digitalRead(2); }'
    nets = [net('in', 'board:D2', 'btn1:1'), net('gnd', 'board:GND', 'btn1:2')]
    result = check_wiring(project(code, [BUTTON], nets))
    assert codes(result) == ['floating-button']
    assert result['findings'][0]['line'] == 1
    assert 'INPUT_PULLUP' in result['findings'][0]['message']
    # An external resistor from the pin to 5 V is a valid pull-up.
    pulled = check_wiring(project(code, [BUTTON, RESISTOR], [net('in', 'board:D2', 'btn1:1', 'r1:1'), net('gnd', 'board:GND', 'btn1:2'), net('rail', 'r1:2', 'board:5V')]))
    assert pulled['findings'] == []
    # Default pinMode (none) also leaves the pin floating.
    assert codes(check_wiring(project('void loop(){ digitalRead(2); }', [BUTTON], nets))) == ['floating-button']


def test_used_but_unconnected_and_connected_but_unused_pins():
    code = 'void setup(){ pinMode(7, OUTPUT); }\nvoid loop(){ digitalWrite(7, HIGH); }'
    result = check_wiring(project(code, [LED, RESISTOR], [net('a', 'board:D8', 'r1:1'), net('b', 'r1:2', 'led1:A'), net('k', 'led1:K', 'board:GND')]))
    assert codes(result) == ['unconnected-pin', 'unused-connection']
    assert {f['code']: f['severity'] for f in result['findings']} == {'unconnected-pin': 'warning', 'unused-connection': 'info'}


def test_direction_mismatches():
    out = check_wiring(project('void setup(){ pinMode(2, OUTPUT); }', [BUTTON], [net('in', 'board:D2', 'btn1:1'), net('gnd', 'board:GND', 'btn1:2')]))
    assert 'output-on-button' in codes(out)
    inp = check_wiring(project('void setup(){ pinMode(8, INPUT); }', [LED, RESISTOR], [net('a', 'board:D8', 'r1:1'), net('b', 'r1:2', 'led1:A'), net('k', 'led1:K', 'board:GND')]))
    assert 'input-on-led' in codes(inp)


def test_constants_resolve_and_computed_pins_are_unresolved_with_line_numbers():
    code = '#define LED 9\nconst int BTN = 2; // button\nint pin = 4;\nvoid setup(){ pinMode(LED, OUTPUT); pinMode(BTN, INPUT_PULLUP); }\nvoid blink(int p){\n  digitalWrite(p, HIGH);\n}\n'
    result = check_wiring(project(code))
    assert [u['terminal'] for u in result['pinUsage']] == ['board:D2', 'board:D9']
    assert result['unresolved'] == [{'file': 'sketch.ino', 'line': 6, 'call': 'digitalWrite', 'expression': 'p'}]
    assert any(f['code'] == 'unresolved-pin' and f['line'] == 6 for f in result['findings'])


def test_comments_and_strings_are_ignored_but_line_numbers_survive():
    code = '// pinMode(5, OUTPUT);\n/* digitalWrite(6, HIGH);\n   pinMode(7, OUTPUT); */\nconst char* s = "digitalWrite(4, HIGH)";\nvoid setup(){ pinMode(3, OUTPUT); }\n'
    assert strip_noise(code).count('\n') == code.count('\n')
    result = check_wiring(project(code))
    assert [u['terminal'] for u in result['pinUsage']] == ['board:D3']
    assert result['pinUsage'][0]['calls'][0]['line'] == 5


def test_pwm_capability_and_pin_validity_depend_on_the_board():
    code = 'void loop(){ analogWrite(9, 128); analogWrite(8, 128); }'
    assert [f['code'] for f in check_wiring(project(code))['findings'] if f['code'] == 'no-pwm'] == ['no-pwm']
    assert 'D8' in [f for f in check_wiring(project(code))['findings'] if f['code'] == 'no-pwm'][0]['message']
    assert 'invalid-pin' in codes(check_wiring(project('void setup(){ pinMode(30, OUTPUT); }')))
    assert 'invalid-pin' not in codes(check_wiring(project('void setup(){ pinMode(30, OUTPUT); }', board='mega')))
    # A6/A7 exist on the classic Nano but not on an Uno.
    assert 'invalid-pin' in codes(check_wiring(project('int v = analogRead(A6);')))
    assert 'invalid-pin' not in codes(check_wiring(project('int v = analogRead(A6);', board='nano')))


def test_analog_pins_map_from_channels_and_names():
    result = check_wiring(project('int a = analogRead(0); int b = analogRead(A1); void setup(){ pinMode(A2, OUTPUT); pinMode(16, OUTPUT); }'))
    assert [u['terminal'] for u in result['pinUsage']] == ['board:A0', 'board:A1', 'board:A2']
    assert {u['terminal']: u['pin'] for u in result['pinUsage']}['board:A2'] == 16, 'A2 is pin 16; the numeric and named uses merge'


def test_interrupt_pins_and_nested_calls_parse():
    result = check_wiring(project('void setup(){ attachInterrupt(digitalPinToInterrupt(2), isr, FALLING); digitalWrite(constrain(3, 0, 5), HIGH); }'))
    assert [u['terminal'] for u in result['pinUsage']] == ['board:D2']
    assert any(item['call'] == 'digitalWrite' for item in result['unresolved'])
    assert split_arguments('f(a, g(b, c), d)', 1) == ['a', 'g(b, c)', 'd']
    assert split_arguments('f()', 1) == []
    assert split_arguments('f(a', 1) is None


def test_python_projects_are_not_analyzed_and_description_is_plain_text():
    pi = ProjectContent(name='p', boardId='pi4', files=[{'name': 'main.py', 'content': 'from gpiozero import LED'}])
    assert check_wiring(pi)['supported'] is False
    text = describe(check_wiring(project(DRIVE_D8, [LED], [net('a', 'board:D8', 'led1:A'), net('k', 'led1:K', 'board:GND')])))
    assert 'WARNING led-no-resistor' in text and 'board:D8' in text and 'not a simulation' in text
