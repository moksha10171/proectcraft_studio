/**
 * Prompt Templates — all system prompts extracted from route.ts into
 * reusable, documented constants. Used by both the Next.js API route
 * and the Python FastAPI backend (which can read these as reference).
 */

import type { ProjectFile } from './types';

// ─── File Context Helper ──────────────────────────────────────────────────────

export function buildFileContext(files: ProjectFile[]): string {
  return files.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join('\n\n');
}

// ─── TOOL: GENERATE_ARDUINO ───────────────────────────────────────────────────

export const ARDUINO_GENERATION_PROMPT = (fileContext: string, userPrompt: string) => `\
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
{
  board: 'Arduino Uno' | 'Arduino Nano' | 'ESP32' | 'Arduino Mega',
  components: [{
    id: string,
    type: string,
    pin: number | string,
    label: string,
    properties?: { pinY?: string, numPixels?: number, frequency?: number }
  }]
}

**COMPONENT GUIDELINES:**
- LEDs: pins 2-13, include current-limiting resistors in explanation
- Servos: pins 9-10 (PWM), attach() in setup()
- Sensors (DHT, Ultrasonic): any digital pin
- NeoPixels: any pin, specify data pin and pixel count
- I2C: SDA=A4, SCL=A5 (Uno) or SDA=20, SCL=21 (Mega)
- SPI: MOSI=11, MISO=12, SCK=13, CS=10
- Analog sensors: A0-A5

**CURRENT PROJECT FILES:**
${fileContext}

**USER REQUEST:**
${userPrompt}`;

export const ARDUINO_GENERATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    files: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          content: { type: 'STRING' },
          type: { type: 'STRING', enum: ['code', 'config', 'note'] },
        },
        required: ['name', 'content', 'type'],
      },
    },
    explanation: { type: 'STRING' },
    wiring: {
      type: 'OBJECT',
      properties: {
        board: { type: 'STRING' },
        components: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
              type: { type: 'STRING' },
              pin: { type: 'STRING' },
              label: { type: 'STRING' },
              properties: { type: 'OBJECT' },
            },
            required: ['id', 'type', 'pin', 'label'],
          },
        },
      },
      required: ['board', 'components'],
    },
  },
  required: ['files', 'wiring', 'explanation'],
};

// ─── TOOL: GENERATE_RPI ───────────────────────────────────────────────────────

export const RPI_GENERATION_PROMPT = (fileContext: string, userPrompt: string) => `\
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
4. **Execution**: How to run the script (\`python3 main.py\`).

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
${fileContext}

**USER REQUEST:**
${userPrompt}`;

export const RPI_GENERATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    files: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          content: { type: 'STRING' },
          type: { type: 'STRING' },
        },
        required: ['name', 'content', 'type'],
      },
    },
    explanation: { type: 'STRING' },
    wiring: {
      type: 'OBJECT',
      properties: {
        board: { type: 'STRING' },
        components: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
              type: { type: 'STRING' },
              pin: { type: 'STRING' },
              label: { type: 'STRING' },
              properties: { type: 'OBJECT' },
            },
            required: ['id', 'type', 'pin', 'label'],
          },
        },
      },
      required: ['board', 'components'],
    },
  },
  required: ['files', 'wiring', 'explanation'],
};

// ─── TOOL: VERIFY_ARDUINO ─────────────────────────────────────────────────────

export const VERIFY_ARDUINO_PROMPT = (fileContext: string) => `\
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
Return JSON: { valid: boolean, errors: string[] }

**CODE TO ANALYZE:**
${fileContext}`;

export const VERIFY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    valid: { type: 'BOOLEAN' },
    errors: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['valid', 'errors'],
};

// ─── TOOL: VERIFY_PYTHON ─────────────────────────────────────────────────────

export const VERIFY_PYTHON_PROMPT = (fileContext: string) => `\
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
Return JSON: { valid: boolean, errors: string[] }

**CODE TO ANALYZE:**
${fileContext}`;

// ─── TOOL: DERIVE_WIRING ─────────────────────────────────────────────────────

export const DERIVE_WIRING_PROMPT = (fileContext: string) => `\
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
Return JSON: { board: string, components: [{ id, type, pin, label, properties? }] }

**CODE TO ANALYZE:**
${fileContext}`;

export const DERIVE_RPI_WIRING_PROMPT = (fileContext: string) => `\
You are an Expert Hardware Analyzer for Raspberry Pi GPIO projects.

**TASK:** Analyze Python GPIO code and derive the complete hardware wiring configuration.

**DETECTION STRATEGY:**
1. **Library Analysis**: RPi.GPIO, gpiozero imports and device classes
2. **Pin Analysis**: GPIO.setup(), OutputDevice, LED, Button, Servo pin assignments
3. **Use BCM numbering** in all pin labels

**COMPONENT TYPES:** LED, BUTTON, BUZZER, RELAY, SERVO, SENSOR_DHT, SENSOR_ULTRASONIC, NEOPIXEL, LCD_I2C, etc.

**RESPONSE FORMAT:**
Return JSON: { board: "Raspberry Pi 4B" | "Raspberry Pi Zero 2W" | etc., components: [{ id, type, pin, label, properties? }] }

**CODE TO ANALYZE:**
${fileContext}`;

export const DERIVE_WIRING_SCHEMA = {
  type: 'OBJECT',
  properties: {
    board: { type: 'STRING' },
    components: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          type: { type: 'STRING' },
          pin: { type: 'STRING' },
          label: { type: 'STRING' },
          properties: { type: 'OBJECT' },
        },
        required: ['id', 'type', 'pin', 'label'],
      },
    },
  },
  required: ['board', 'components'],
};

// ─── TOOL: OPTIMIZE_CODE ─────────────────────────────────────────────────────

export const OPTIMIZE_CODE_PROMPT = (fileContext: string) => `\
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
${fileContext}`;

export const OPTIMIZE_CODE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
    explanation: { type: 'STRING' },
    files: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          content: { type: 'STRING' },
          type: { type: 'STRING' },
        },
        required: ['name', 'content', 'type'],
      },
    },
  },
  required: ['suggestions', 'explanation'],
};

// ─── Prompt Context Summary (for AgentPanel display) ─────────────────────────

export function getPromptPreview(action: string, userPrompt: string): string {
  const maxLen = 200;
  const truncate = (s: string) => s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
  switch (action) {
    case 'GENERATE_ARDUINO': return truncate(`[Arduino Agent] ${userPrompt}`);
    case 'GENERATE_RPI':     return truncate(`[RPi Agent] ${userPrompt}`);
    case 'VERIFY_ARDUINO':   return truncate(`[Verifier] Checking Arduino syntax & logic`);
    case 'VERIFY_PYTHON':    return truncate(`[Verifier] Checking Python syntax & GPIO patterns`);
    case 'DERIVE_WIRING':    return truncate(`[Wiring Agent] Deriving hardware from code`);
    case 'OPTIMIZE_CODE':    return truncate(`[Optimizer] Reviewing code for improvements`);
    default:                 return truncate(userPrompt);
  }
}
