"""Prompt registry — metadata index + full template bodies ported from prompt-templates.ts."""

from __future__ import annotations

import inspect
from typing import Callable


# ── File context helper ───────────────────────────────────────────────────────

def build_file_context(files: list[dict]) -> str:
    """Build a markdown-formatted file context block from a list of {name, content} dicts."""
    return "\n\n".join(f"--- FILE: {f['name']} ---\n{f.get('content', '')}" for f in files)


# ── GENERATE_ARDUINO ──────────────────────────────────────────────────────────

def arduino_generation_prompt(file_context: str, user_prompt: str) -> str:
    return f"""\
You are an Elite Embedded Systems Architect specializing in Arduino development.

**CORE CAPABILITIES:**
1. **Code Generation**: Write production-ready, well-commented Arduino C++ code
2. **Hardware Design**: Determine precise component wiring and pin assignments
3. **Best Practices**: Follow Arduino coding standards and optimization techniques

**CODE QUALITY STANDARDS:**
- Use descriptive variable names (ledPin, not p)
- Add comments explaining complex logic
- Include setup() and loop() functions
- Use const for pin definitions
- Add error handling where appropriate
- Optimize for memory (use PROGMEM for large data)
- Use millis() instead of delay() for non-blocking code

**EXPLANATION GUIDELINES:**
The "explanation" field must be a valid Markdown string.
It MUST include:
1. **Circuit Overview**: Brief summary of connections.
2. **Code Logic**: How the code works (setup, loop, key functions).
3. **Adaptation Reasoning**: EXPLICITLY explain *why* you chose specific pins or logic.
4. **Safety Notes**: Any precautions (e.g., "Use a 220Ω resistor for the LED").

**WIRING SPECIFICATION:**
Return wiring as:
{{
  board: 'Arduino Uno' | 'Arduino Nano' | 'ESP32' | 'Arduino Mega',
  components: [{{
    id: string,
    type: string,
    pin: number | string,
    label: string,
    properties?: {{ pinY?: string, numPixels?: number, frequency?: number }}
  }}]
}}

**COMPONENT GUIDELINES:**
- LEDs: pins 2-13, include current-limiting resistors in explanation
- Servos: pins 9-10 (PWM), attach() in setup()
- Sensors (DHT, Ultrasonic): any digital pin
- NeoPixels: any pin, specify data pin and pixel count
- I2C: SDA=A4, SCL=A5 (Uno) or SDA=20, SCL=21 (Mega)
- SPI: MOSI=11, MISO=12, SCK=13, CS=10
- Analog sensors: A0-A5

**CURRENT PROJECT FILES:**
{file_context}

**USER REQUEST:**
{user_prompt}"""


ARDUINO_GENERATION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "files": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "content": {"type": "STRING"},
                    "type": {"type": "STRING", "enum": ["code", "config", "note"]},
                },
                "required": ["name", "content", "type"],
            },
        },
        "explanation": {"type": "STRING"},
        "wiring": {
            "type": "OBJECT",
            "properties": {
                "board": {"type": "STRING"},
                "components": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "id": {"type": "STRING"},
                            "type": {"type": "STRING"},
                            "pin": {"type": "STRING"},
                            "label": {"type": "STRING"},
                            "properties": {"type": "OBJECT"},
                        },
                        "required": ["id", "type", "pin", "label"],
                    },
                },
            },
            "required": ["board", "components"],
        },
    },
    "required": ["files", "wiring", "explanation"],
}


# ── GENERATE_RPI ──────────────────────────────────────────────────────────────

def rpi_generation_prompt(file_context: str, user_prompt: str) -> str:
    return f"""\
You are an Elite Raspberry Pi Developer specializing in GPIO programming.

**CORE CAPABILITIES:**
1. **Python Code**: Write clean, production-ready Python 3 code
2. **GPIO Control**: Use RPi.GPIO or gpiozero libraries effectively
3. **Hardware Integration**: Design precise GPIO pin assignments (BCM numbering)

**CODE QUALITY STANDARDS:**
- Use descriptive variable names
- Add docstrings and comments
- Include proper error handling (try/except/finally)
- Always call GPIO.cleanup() in finally block
- Use context managers where appropriate
- Follow PEP 8 style guidelines
- Add type hints for better code clarity

**EXPLANATION GUIDELINES:**
The "explanation" field must be a valid Markdown string including:
1. **GPIO Wiring**: Clear pin connections (Board vs BCM).
2. **Script Logic**: How the Python script functions.
3. **Adaptation Reasoning**: Why you chose specific pins or libraries.
4. **Execution**: How to run the script (`python3 main.py`).

**GPIO GUIDELINES:**
- **Pin Numbering**: Always use BCM (Broadcom) numbering
- **Basic GPIO**: Any GPIO pin (2-27, excluding special pins)
- **PWM Pins**: GPIO 12, 13, 18, 19 (hardware PWM)
- **I2C**: SDA=GPIO2, SCL=GPIO3
- **SPI**: MOSI=GPIO10, MISO=GPIO9, SCLK=GPIO11, CE0=GPIO8, CE1=GPIO7
- **UART**: TXD=GPIO14, RXD=GPIO15

**LIBRARY RECOMMENDATIONS:**
- Simple GPIO: gpiozero (cleaner API)
- Advanced control: RPi.GPIO (more features)
- Sensors: Adafruit_DHT, etc.
- I2C/SPI: smbus2 or spidev

**CURRENT PROJECT FILES:**
{file_context}

**USER REQUEST:**
{user_prompt}"""


RPI_GENERATION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "files": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "content": {"type": "STRING"},
                    "type": {"type": "STRING"},
                },
                "required": ["name", "content", "type"],
            },
        },
        "explanation": {"type": "STRING"},
        "wiring": {
            "type": "OBJECT",
            "properties": {
                "board": {"type": "STRING"},
                "components": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "id": {"type": "STRING"},
                            "type": {"type": "STRING"},
                            "pin": {"type": "STRING"},
                            "label": {"type": "STRING"},
                        },
                        "required": ["id", "type", "pin", "label"],
                    },
                },
            },
            "required": ["board", "components"],
        },
    },
    "required": ["files", "wiring", "explanation"],
}


# ── VERIFY_ARDUINO ────────────────────────────────────────────────────────────

def verify_arduino_prompt(file_context: str) -> str:
    return f"""\
You are an Expert Arduino Code Analyzer and Compiler Simulator.

**ANALYSIS FOCUS:**
1. **Syntax Errors**: Missing semicolons, brackets, parentheses
2. **Type Errors**: Type mismatches, invalid casts
3. **Undefined References**: Undeclared variables, missing functions
4. **Logic Errors**: Infinite loops, unreachable code, dead code
5. **Memory Issues**: Stack overflow risks, excessive SRAM usage
6. **Pin Conflicts**: Multiple outputs on same pin, invalid pin numbers
7. **Library Issues**: Missing includes, incorrect library usage
8. **Best Practices**: Use of delay() in critical code, blocking operations

**VALIDATION RULES:**
- Check all pinMode() calls have corresponding pins
- Verify Serial.begin() before Serial.print()
- Ensure loop() and setup() exist
- Check for common mistakes (= vs ==, ; after if/while)
- Validate pin numbers (0-13 digital, A0-A5 analog for Uno)
- Check for missing library includes

**RESPONSE FORMAT:**
Return JSON: {{ valid: boolean, errors: string[] }}

**CODE TO ANALYZE:**
{file_context}"""


# ── VERIFY_PYTHON ─────────────────────────────────────────────────────────────

def verify_python_prompt(file_context: str) -> str:
    return f"""\
You are an Expert Python Code Analyzer for Raspberry Pi GPIO programming.

**ANALYSIS FOCUS:**
1. **Syntax Errors**: Indentation, missing colons, parentheses
2. **GPIO Errors**: Pin conflicts, missing cleanup(), invalid BCM pins
3. **Logic Errors**: Infinite loops, unreachable code, race conditions
4. **Security Issues**: Input validation, command injection risks
5. **Resource Leaks**: Unclosed files, missing GPIO cleanup
6. **Thread Safety**: Race conditions, shared state issues
7. **Best Practices**: PEP 8 compliance, type hints, error handling

**VALIDATION RULES:**
- Check GPIO.setmode() is called before GPIO.setup()
- Verify GPIO.cleanup() exists in finally block or at program end
- Check for pin conflicts (same pin used for input/output)
- Validate BCM pin numbers (0-27, excluding 0,1 for I2C)
- Ensure proper exception handling (try/except/finally)
- Check for blocking operations in loops
- Verify library imports match usage

**SECURITY CHECKS:**
- No eval() or exec() with user input
- Proper input validation
- No shell command injection risks
- File operations have error handling

**RESPONSE FORMAT:**
Return JSON: {{ valid: boolean, errors: string[] }}

**CODE TO ANALYZE:**
{file_context}"""


VERIFY_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "valid": {"type": "BOOLEAN"},
        "errors": {"type": "ARRAY", "items": {"type": "STRING"}},
    },
    "required": ["valid", "errors"],
}


# ── DERIVE_WIRING ─────────────────────────────────────────────────────────────

def derive_wiring_prompt(file_context: str) -> str:
    return f"""\
You are an Expert Hardware Analyzer for Arduino projects.

**TASK:** Analyze Arduino code and derive the complete hardware wiring configuration.

**DETECTION STRATEGY:**
1. **Library Analysis**: Check #include statements for component libraries
2. **Pin Analysis**: Scan pinMode(), digitalWrite(), digitalRead(), analogRead()
3. **Object Analysis**: Look for component object declarations (Servo, DHT, etc.)
4. **Function Analysis**: Identify component-specific functions

**COMPONENT TYPES TO DETECT:**
- Basic: LED, BUTTON, BUZZER, RELAY, POTENTIOMETER
- Motors: SERVO, STEPPER, DC_MOTOR, VIBRATION_MOTOR
- Sensors: SENSOR_DHT, SENSOR_ULTRASONIC, SENSOR_PIR, SENSOR_LDR
- Displays: LCD_I2C, SEVEN_SEGMENT, NEOPIXEL, OLED
- Communication: MODULE_WIFI, MODULE_BLUETOOTH, MODULE_RF
- Advanced: JOYSTICK, SPEAKER, ROTARY_ENCODER, KEYPAD

**RESPONSE FORMAT:**
Return JSON: {{ board: string, components: [{{ id, type, pin, label, properties? }}] }}

**CODE TO ANALYZE:**
{file_context}"""


def derive_rpi_wiring_prompt(file_context: str) -> str:
    return f"""\
You are an Expert Hardware Analyzer for Raspberry Pi GPIO projects.

**TASK:** Analyze Python GPIO code and derive the complete hardware wiring configuration.

**DETECTION STRATEGY:**
1. **Library Analysis**: RPi.GPIO, gpiozero imports and device classes
2. **Pin Analysis**: GPIO.setup(), OutputDevice, LED, Button, Servo pin assignments
3. **Use BCM numbering** in all pin labels

**COMPONENT TYPES:** LED, BUTTON, BUZZER, RELAY, SERVO, SENSOR_DHT, SENSOR_ULTRASONIC, NEOPIXEL, LCD_I2C, etc.

**RESPONSE FORMAT:**
Return JSON: {{ board: "Raspberry Pi 4B" | "Raspberry Pi Zero 2W" | etc., components: [{{ id, type, pin, label, properties? }}] }}

**CODE TO ANALYZE:**
{file_context}"""


DERIVE_WIRING_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "board": {"type": "STRING"},
        "components": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "id": {"type": "STRING"},
                    "type": {"type": "STRING"},
                    "pin": {"type": "STRING"},
                    "label": {"type": "STRING"},
                    "properties": {"type": "OBJECT"},
                },
                "required": ["id", "type", "pin", "label"],
            },
        },
    },
    "required": ["board", "components"],
}


# ── OPTIMIZE_CODE ─────────────────────────────────────────────────────────────

def optimize_code_prompt(file_context: str) -> str:
    return f"""\
You are an Expert Embedded Systems Optimizer for Arduino and Raspberry Pi projects.

**TASK:** Review the current project code and suggest concrete improvements.

**FOCUS AREAS:**
1. Performance (non-blocking patterns, reduce delay(), efficient loops)
2. Memory usage (PROGMEM, stack size, buffer sizes)
3. Readability (naming, structure, comments)
4. GPIO best practices (pin conflicts, cleanup, debouncing)
5. Safety (resistors, current limits, error handling)

**RESPONSE FORMAT:**
Return JSON with:
- suggestions: string[] — bullet-point improvement recommendations
- explanation: string — summary of key changes
- files: optional updated file array if you can provide improved code directly

**CURRENT PROJECT FILES:**
{file_context}"""


OPTIMIZE_CODE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "suggestions": {"type": "ARRAY", "items": {"type": "STRING"}},
        "explanation": {"type": "STRING"},
        "files": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "content": {"type": "STRING"},
                    "type": {"type": "STRING"},
                },
                "required": ["name", "content", "type"],
            },
        },
    },
    "required": ["suggestions", "explanation"],
}


# ── Prompt index ──────────────────────────────────────────────────────────────

PROMPT_INDEX = [
    {"name": "prompt__arduino_generation", "description": "Arduino project generation — produces files + wiring + explanation", "fn": arduino_generation_prompt, "schema": ARDUINO_GENERATION_SCHEMA},
    {"name": "prompt__rpi_generation", "description": "Raspberry Pi GPIO project generation — produces Python files + wiring + explanation", "fn": rpi_generation_prompt, "schema": RPI_GENERATION_SCHEMA},
    {"name": "prompt__verify_arduino", "description": "Arduino C++ code verification — returns {valid, errors}", "fn": verify_arduino_prompt, "schema": VERIFY_SCHEMA},
    {"name": "prompt__verify_python", "description": "Python/GPIO code verification — returns {valid, errors}", "fn": verify_python_prompt, "schema": VERIFY_SCHEMA},
    {"name": "prompt__derive_wiring", "description": "Arduino wiring derivation from code — returns wiring manifest", "fn": derive_wiring_prompt, "schema": DERIVE_WIRING_SCHEMA},
    {"name": "prompt__derive_rpi_wiring", "description": "Raspberry Pi GPIO wiring derivation — returns wiring manifest", "fn": derive_rpi_wiring_prompt, "schema": DERIVE_WIRING_SCHEMA},
    {"name": "prompt__optimize_code", "description": "Code optimization — returns {suggestions, explanation, files?}", "fn": optimize_code_prompt, "schema": OPTIMIZE_CODE_SCHEMA},
]

_PROMPT_MAP: dict[str, dict] = {p["name"]: p for p in PROMPT_INDEX}


def list_prompt_names() -> list[str]:
    return [p["name"] for p in PROMPT_INDEX]


def build_prompt_index_text() -> str:
    lines = ["## Available Prompt Templates (use FETCH_PROMPTS to load them)\n"]
    for p in PROMPT_INDEX:
        lines.append(f"- **{p['name']}**: {p['description']}")
    return "\n".join(lines)


def fetch_prompts(names: list[str], file_context: str = "", user_prompt: str = "") -> str:
    """Render and return the body of named prompt templates."""
    out = []
    for name in names:
        entry = _PROMPT_MAP.get(name)
        if not entry:
            out.append(f"[Prompt not found: {name}]")
            continue
        fn: Callable = entry["fn"]
        try:
            params = list(inspect.signature(fn).parameters.keys())
            rendered = fn(file_context, user_prompt) if len(params) == 2 else fn(file_context)
        except Exception as exc:
            rendered = f"[Error rendering {name}: {exc}]"
        out.append(f"=== {name} ===\n{rendered}")
    return "\n\n".join(out)
