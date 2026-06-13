"use client";

import { ProjectFile, WiringManifest, ComponentType, SimulationResult, SimulationFrame, ArduinoComponent, RaspberryPiWiringManifest, RaspberryPiComponentType, DeviceMode } from "../types";

// === ERROR TYPES ===
export class AIError extends Error {
    constructor(
        message: string,
        public readonly code: 'API_KEY_FAILED' | 'GENERATION_FAILED' | 'VALIDATION_FAILED' | 'PARSE_FAILED' | 'TIMEOUT' | 'RATE_LIMITED' | 'NETWORK_ERROR',
        public readonly retryable: boolean = false,
        public readonly details?: string
    ) {
        super(message);
        this.name = 'AIError';
    }
}

// === LOCAL SYNTAX VERIFICATION ===
// Fast, accurate local checks before using AI

interface SyntaxError {
    line: number;
    message: string;
    severity: 'error' | 'warning';
}

// Python syntax verification for Raspberry Pi mode
const localVerifyPythonSyntax = (code: string): { valid: boolean; errors: string[] } => {
    const errors: SyntaxError[] = [];
    const lines = code.split('\n');

    // Track indentation
    let expectedIndent = 0;
    let inMultilineString = false;

    // Check for common Python patterns
    const hasMain = /if\s+__name__\s*==\s*["']__main__["']/.test(code) || /def\s+main\s*\(/.test(code);
    const hasGPIOImport = /import\s+RPi\.GPIO|from\s+RPi/.test(code) || /import\s+gpiozero/.test(code);

    if (!hasGPIOImport && !code.includes('machine.Pin')) {
        errors.push({ line: 1, message: 'Consider importing RPi.GPIO or gpiozero for GPIO control', severity: 'warning' });
    }

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Check for multiline strings
        const tripleQuoteCount = (line.match(/"""/g) || []).length + (line.match(/'''/g) || []).length;
        if (tripleQuoteCount % 2 !== 0) {
            inMultilineString = !inMultilineString;
        }
        if (inMultilineString) continue;

        // Check for common Python syntax errors
        if (trimmed.endsWith('{') || trimmed.endsWith('}')) {
            errors.push({ line: lineNum, message: 'Python uses indentation, not braces {}', severity: 'error' });
        }

        if (trimmed.includes('&&') || trimmed.includes('||')) {
            errors.push({ line: lineNum, message: 'Use "and" / "or" instead of "&&" / "||"', severity: 'error' });
        }

        if (/;\s*$/.test(trimmed) && !trimmed.includes("'") && !trimmed.includes('"')) {
            errors.push({ line: lineNum, message: 'Semicolons are not needed in Python', severity: 'warning' });
        }

        // Check for missing colons after control structures
        if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(trimmed)) {
            if (!trimmed.endsWith(':') && !trimmed.includes(':')) {
                errors.push({ line: lineNum, message: 'Missing colon ":" after control structure', severity: 'error' });
            }
        }

        // Check for unmatched parentheses
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        if (openParens > closeParens + 2) { // Allow some tolerance for multi-line
            errors.push({ line: lineNum, message: 'Possibly unmatched parenthesis (', severity: 'warning' });
        }

        // Check for common GPIO mistakes
        if (/GPIO\.setup/.test(line) && !/GPIO\.IN|GPIO\.OUT/.test(line)) {
            errors.push({ line: lineNum, message: 'GPIO.setup needs GPIO.IN or GPIO.OUT', severity: 'warning' });
        }
    }

    // Format errors for return
    const formattedErrors = errors.map(e => `Line ${e.line}: ${e.message}`);
    const hasRealErrors = errors.some(e => e.severity === 'error');

    return {
        valid: !hasRealErrors,
        errors: formattedErrors
    };
};

const localVerifyArduinoSyntax = (code: string): { valid: boolean; errors: string[] } => {
    const errors: SyntaxError[] = [];
    const lines = code.split('\n');

    // Track state
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;
    let inMultiLineComment = false;
    let inString = false;
    let stringChar = '';

    // Check for required functions
    const hasSetup = /void\s+setup\s*\(\s*\)/.test(code);
    const hasLoop = /void\s+loop\s*\(\s*\)/.test(code);

    if (!hasSetup) {
        errors.push({ line: 1, message: 'Missing required function: void setup()', severity: 'error' });
    }
    if (!hasLoop) {
        errors.push({ line: 1, message: 'Missing required function: void loop()', severity: 'error' });
    }

    // Line-by-line analysis
    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) continue;

        // Handle multi-line comments
        if (inMultiLineComment) {
            if (trimmed.includes('*/')) {
                inMultiLineComment = false;
            }
            continue;
        }

        if (trimmed.startsWith('/*')) {
            if (!trimmed.includes('*/')) {
                inMultiLineComment = true;
            }
            continue;
        }

        // Skip single-line comments and preprocessor directives
        if (trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

        // Remove string literals for bracket analysis
        let codeOnly = line;
        codeOnly = codeOnly.replace(/"[^"\\]*(\\.[^"\\]*)*"/g, '""');
        codeOnly = codeOnly.replace(/'[^'\\]*(\\.[^'\\]*)*'/g, "''");

        // Count brackets
        for (const char of codeOnly) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
            if (char === '[') bracketCount++;
            if (char === ']') bracketCount--;
        }

        // Check for negative counts (closing before opening)
        if (braceCount < 0) {
            errors.push({ line: lineNum, message: 'Unexpected closing brace }', severity: 'error' });
            braceCount = 0;
        }
        if (parenCount < 0) {
            errors.push({ line: lineNum, message: 'Unexpected closing parenthesis )', severity: 'error' });
            parenCount = 0;
        }
        if (bracketCount < 0) {
            errors.push({ line: lineNum, message: 'Unexpected closing bracket ]', severity: 'error' });
            bracketCount = 0;
        }

        // Check for missing semicolons (heuristic)
        if (!trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
            !trimmed.endsWith(':') && !trimmed.endsWith(',') && !trimmed.startsWith('#') &&
            !trimmed.startsWith('//') && !trimmed.endsWith('*/') &&
            !/^(if|else|for|while|switch|do|class|struct|enum|namespace)\b/.test(trimmed) &&
            !/\)\s*$/.test(trimmed) && // function declarations
            trimmed.length > 0) {

            // Check if it looks like a statement
            if (/[a-zA-Z0-9_]\s*$/.test(trimmed) && !trimmed.includes('(')) {
                errors.push({ line: lineNum, message: 'Possible missing semicolon', severity: 'warning' });
            }
        }

        // Check for common Arduino function typos
        const commonFunctions = ['pinMode', 'digitalWrite', 'digitalRead', 'analogWrite', 'analogRead', 'delay', 'Serial'];
        const typoPatterns = [
            { wrong: /pinmode\s*\(/i, correct: 'pinMode' },
            { wrong: /digitalwrite\s*\(/i, correct: 'digitalWrite' },
            { wrong: /digitalread\s*\(/i, correct: 'digitalRead' },
            { wrong: /analogwrite\s*\(/i, correct: 'analogWrite' },
            { wrong: /analogread\s*\(/i, correct: 'analogRead' },
            { wrong: /serial\./i, correct: 'Serial' },
        ];

        for (const { wrong, correct } of typoPatterns) {
            if (wrong.test(trimmed) && !trimmed.includes(correct)) {
                errors.push({ line: lineNum, message: `Possible typo: should be '${correct}'`, severity: 'warning' });
            }
        }

        // Check for unmatched quotes in line
        const quoteCount = (line.match(/(?<!\\)"/g) || []).length;
        const singleQuoteCount = (line.match(/(?<!\\)'/g) || []).length;
        if (quoteCount % 2 !== 0) {
            errors.push({ line: lineNum, message: 'Unmatched double quote "', severity: 'error' });
        }
        if (singleQuoteCount % 2 !== 0 && !/'.'/g.test(line)) { // Allow char literals
            errors.push({ line: lineNum, message: 'Unmatched single quote \'', severity: 'warning' });
        }

        // Check for empty function bodies (warning)
        if (/\{\s*\}/.test(trimmed) && (trimmed.includes('setup') || trimmed.includes('loop'))) {
            errors.push({ line: lineNum, message: 'Empty function body detected', severity: 'warning' });
        }
    }

    // Final bracket check
    if (braceCount > 0) {
        errors.push({ line: lines.length, message: `Missing ${braceCount} closing brace(s) }`, severity: 'error' });
    }
    if (parenCount > 0) {
        errors.push({ line: lines.length, message: `Missing ${parenCount} closing parenthesis(es) )`, severity: 'error' });
    }
    if (bracketCount > 0) {
        errors.push({ line: lines.length, message: `Missing ${bracketCount} closing bracket(s) ]`, severity: 'error' });
    }

    // Format errors for return
    const formattedErrors = errors.map(e => `Line ${e.line}: ${e.message}`);
    const hasRealErrors = errors.some(e => e.severity === 'error');

    return {
        valid: !hasRealErrors,
        errors: formattedErrors
    };
};

// Helper to format file context
const getFileContext = (files: ProjectFile[]) =>
    files.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join('\n\n');

// --- LOCAL PHYSICS ENGINE ---

const generateLocalSimulation = (wiring: WiringManifest, code: string): SimulationResult => {
    const frames: SimulationFrame[] = [];
    const duration = 15000; // 15 seconds
    const step = 50; // 50ms ticks
    const totalSteps = duration / step;

    // --- 1. HEURISTIC ANALYSIS ---
    const hasTalkie = code.includes('Talkie.h');
    const hasDHT = code.includes('DHT.h') || code.includes('dht.');
    const hasServo = code.includes('Servo.h');
    const hasStepper = code.includes('Stepper.h') || code.includes('AccelStepper');
    const hasNeoPixel = code.includes('Adafruit_NeoPixel') || code.includes('FastLED');
    const hasSevSeg = code.includes('SevSeg') || code.includes('SevenSegment');
    const hasUltrasonic = code.includes('pulseIn') || code.includes('NewPing');
    const hasWiFi = code.includes('WiFi') || code.includes('ESP8266');
    const hasHeart = code.includes('PulseSensor') || code.includes('heart');

    // Continuous Simulation State
    let dhtTemp = 24.0;
    let dhtHum = 60.0;
    let stepperPos = 0;
    let sevSegCount = 0;
    let neoPixelOffset = 0;
    let phValue = 7.0;
    let heartRate = 72;
    let wifiStatus = 0; // 0=idle, 1=connecting, 2=connected

    for (let i = 0; i < totalSteps; i++) {
        const timestamp = i * step;
        const pinStates: Record<string, number> = {};
        let serialOutput: string | null = null;

        // --- 2. GENERATE INPUTS (Sensors) ---

        // Sine wave for distances (0-150cm)
        const distVal = Math.round(75 + 70 * Math.sin(timestamp / 2000));

        // Cosine wave for Light/Potentiometers (0-1023)
        const analogVal = Math.round(512 + 512 * Math.cos(timestamp / 3000));

        // Joystick X/Y Movement (Lissajous figure)
        const joyX = Math.round(512 + 512 * Math.sin(timestamp / 1500));
        const joyY = Math.round(512 + 512 * Math.cos(timestamp / 1500));

        // Physics Drift
        if (i % 20 === 0) {
            dhtTemp += (Math.random() - 0.5) * 0.5;
            dhtHum += (Math.random() - 0.5) * 0.5;
            phValue = Math.max(0, Math.min(14, 7.0 + 2 * Math.sin(timestamp / 5000) + (Math.random() * 0.2)));
            heartRate = Math.round(75 + 15 * Math.sin(timestamp / 3000));
        }

        // SevSeg Counter (Increments every second)
        if (i % 20 === 0) sevSegCount = (sevSegCount + 1) % 10;

        // WiFi Sim
        if (hasWiFi && i === 40) wifiStatus = 1;
        if (hasWiFi && i === 80) wifiStatus = 2;

        // NeoPixel Rainbow Offset
        neoPixelOffset = (neoPixelOffset + 5) % 255;

        // --- 3. CALCULATE OUTPUTS (Components) ---

        wiring.components.forEach(comp => {
            const pin = String(comp.pin);

            switch (comp.type) {
                // --- SENSORS (Inputs to Arduino) ---
                case ComponentType.SENSOR_ULTRASONIC:
                    pinStates[pin] = distVal;
                    break;
                case ComponentType.POTENTIOMETER:
                case ComponentType.LDR:
                case ComponentType.SENSOR_WATER:
                case ComponentType.SENSOR_GAS:
                    pinStates[pin] = analogVal;
                    break;
                case ComponentType.SENSOR_PH:
                    pinStates[pin] = Math.round(phValue * 100); // Send as analog-ish value
                    break;
                case ComponentType.SENSOR_HEART: {
                    // Pulse Logic: High for 100ms every beat
                    const beatInterval = 60000 / heartRate;
                    pinStates[pin] = (timestamp % beatInterval < 100) ? 1023 : 0;
                    break;
                }
                case ComponentType.JOYSTICK:
                    pinStates[pin] = joyX;
                    if (comp.properties?.pinY) pinStates[String(comp.properties.pinY)] = joyY;
                    break;
                case ComponentType.SENSOR_DHT:
                case ComponentType.SENSOR_TEMP:
                    pinStates[pin] = 1;
                    break;
                case ComponentType.BUTTON:
                    pinStates[pin] = (timestamp % 4000 < 200) ? 1 : 0;
                    break;

                case ComponentType.MODULE_WIFI:
                    pinStates[pin] = wifiStatus;
                    break;

                // New sensors
                case ComponentType.PIR:
                    // Random motion detection every 3-8 seconds
                    pinStates[pin] = (timestamp % 5000 < 1000) ? 1 : 0;
                    break;
                case ComponentType.IR_SENSOR:
                    // Simulate IR receiving signals
                    pinStates[pin] = (timestamp % 3000 < 100) ? 1 : 0;
                    break;
                case ComponentType.KEYPAD:
                    // Simulate key presses cycling through keys
                    pinStates[pin] = Math.floor((timestamp / 500) % 16);
                    break;
                case ComponentType.ROTARY_ENCODER:
                    // Continuous rotation
                    pinStates[pin] = (timestamp / 10) % 360;
                    break;

                // New outputs
                case ComponentType.MOTOR_DRIVER:
                    // Motor speed based on analog value
                    pinStates[pin] = analogVal > 400 ? analogVal : 0;
                    if (comp.properties?.motor2Pin) {
                        pinStates[String(comp.properties.motor2Pin)] = analogVal > 600 ? analogVal : 0;
                    }
                    break;
                case ComponentType.OLED:
                    pinStates[pin] = analogVal;
                    break;
                case ComponentType.LED_MATRIX:
                    // Pattern offset for animation
                    pinStates[pin] = Math.floor(timestamp / 200) % 8;
                    break;

                // Advanced Sensors
                case ComponentType.SENSOR_SOUND:
                    // Sound with random spikes
                    pinStates[pin] = Math.round(200 + 400 * Math.random() + 300 * Math.sin(timestamp / 100));
                    break;
                case ComponentType.SENSOR_SOIL:
                    // Gradually decreasing then refilling
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 5000));
                    break;
                case ComponentType.SENSOR_PRESSURE:
                    // Atmospheric pressure simulation
                    pinStates[pin] = Math.round(1013 + 25 * Math.sin(timestamp / 10000));
                    break;
                case ComponentType.ACCELEROMETER:
                    // 3-axis acceleration with movement
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 800));
                    break;

                // Advanced Modules
                case ComponentType.MODULE_GPS:
                    // GPS fix signal
                    pinStates[pin] = (timestamp % 3000 < 2500) ? 1 : 0;
                    break;
                case ComponentType.MODULE_RFID:
                    // Card detection every 4 seconds
                    pinStates[pin] = (timestamp % 4000 < 1500) ? 700 : 300;
                    break;
                case ComponentType.MODULE_BLUETOOTH:
                    // Connection state
                    pinStates[pin] = (timestamp % 10000 > 2000) ? 1 : 0;
                    break;
                case ComponentType.MODULE_RTC:
                    // Always active
                    pinStates[pin] = 1;
                    break;
                case ComponentType.MODULE_FINGERPRINT:
                    // Scan simulation
                    pinStates[pin] = (timestamp % 5000 < 2000) ? (timestamp % 100) : 0;
                    break;
                case ComponentType.TFT_DISPLAY:
                    // Color cycling
                    pinStates[pin] = Math.floor(timestamp / 50) % 360;
                    break;

                // Communication Modules
                case ComponentType.MODULE_GSM:
                    // Signal strength simulation
                    pinStates[pin] = Math.round(300 + 600 * Math.sin(timestamp / 8000) + 100 * Math.random());
                    break;
                case ComponentType.MODULE_LORA:
                    // Transmission bursts
                    pinStates[pin] = (timestamp % 3000 < 500) ? 1 : 0;
                    break;
                case ComponentType.MODULE_ETHERNET:
                case ComponentType.SHIELD_ETHERNET:
                    // Connected state
                    pinStates[pin] = (timestamp % 8000 > 1500) ? 700 : 300;
                    break;
                case ComponentType.MODULE_NRF24:
                    // Radio transmission
                    pinStates[pin] = (timestamp % 2000 < 300) ? 1 : 0;
                    break;
                case ComponentType.MODULE_CAN:
                    // CAN bus activity
                    pinStates[pin] = (timestamp % 500 < 100) ? 1 : 0;
                    break;

                // Motor/Power Components
                case ComponentType.SHIELD_MOTOR:
                    pinStates[pin] = analogVal;
                    break;
                case ComponentType.DC_MOTOR:
                    pinStates[pin] = analogVal > 200 ? analogVal : 0;
                    break;

                // Additional Sensors
                case ComponentType.TOUCH_SENSOR:
                    // Random touch events
                    pinStates[pin] = (timestamp % 4000 < 1000) ? 700 : 200;
                    break;
                case ComponentType.SENSOR_FLAME:
                    // Flame detection
                    pinStates[pin] = (timestamp % 10000 < 2000) ? 800 : 100;
                    break;
                case ComponentType.SENSOR_RAIN:
                    // Rain level varying
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 6000));
                    break;
                case ComponentType.SENSOR_TILT:
                case ComponentType.SENSOR_VIBRATION:
                    // Random triggers
                    pinStates[pin] = (timestamp % 3000 < 500) ? 1 : 0;
                    break;
                case ComponentType.SENSOR_COLOR:
                    // RGB color cycling
                    pinStates[pin] = Math.floor(timestamp / 100) % 256;
                    break;
                case ComponentType.SENSOR_CURRENT:
                case ComponentType.SENSOR_VOLTAGE:
                    // Power measurements
                    pinStates[pin] = Math.round(512 + 200 * Math.sin(timestamp / 2000));
                    break;

                // Power Components
                case ComponentType.BATTERY:
                    // Slowly draining battery
                    pinStates[pin] = Math.max(0, 1023 - Math.floor(timestamp / 100));
                    break;
                case ComponentType.SOLAR_PANEL:
                    // Power output varying with simulated light
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 5000));
                    break;
                case ComponentType.VOLTAGE_REGULATOR:
                    pinStates[pin] = 512; // Stable output
                    break;

                // 2024/2025 Trending Components
                case ComponentType.ESP32_CAM:
                    // Camera capture timing
                    pinStates[pin] = (timestamp % 2000 < 100) ? 1 : 0;
                    break;
                case ComponentType.THERMAL_CAMERA:
                    // Heat pattern simulation
                    pinStates[pin] = Math.round(128 + 100 * Math.sin(timestamp / 500));
                    break;
                case ComponentType.AI_MODULE:
                    // AI inference active
                    pinStates[pin] = 1;
                    break;
                case ComponentType.SENSOR_AIR_QUALITY:
                    // AQI varying over time
                    pinStates[pin] = Math.round(200 + 600 * Math.sin(timestamp / 10000) + 100 * Math.random());
                    break;
                case ComponentType.SENSOR_CO2:
                    // CO2 levels
                    pinStates[pin] = Math.round(400 + 500 * Math.sin(timestamp / 8000) + 100 * Math.random());
                    break;
                case ComponentType.SENSOR_LIDAR:
                    // LiDAR scanning distance
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 300));
                    break;
                case ComponentType.SENSOR_TOF:
                    // ToF distance measurement
                    pinStates[pin] = Math.round(200 + 300 * Math.sin(timestamp / 1000));
                    break;
                case ComponentType.LOAD_CELL:
                    // Weight varying
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 3000));
                    break;
                case ComponentType.IMU_9DOF:
                    // Orientation changing
                    pinStates[pin] = Math.floor(timestamp / 20) % 180;
                    break;
                case ComponentType.GESTURE_SENSOR:
                    // Gesture detection
                    pinStates[pin] = Math.floor(timestamp / 1000) % 5 * 200;
                    break;
                case ComponentType.UV_SENSOR:
                    // UV index varying
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 6000));
                    break;
                case ComponentType.ENCODER_MOTOR:
                    // Motor speed with encoder
                    pinStates[pin] = analogVal > 200 ? analogVal : 0;
                    break;

                // ========== 50 NEW COMPONENTS PHYSICS ==========

                // Actuators (Output controlled)
                case ComponentType.SOLENOID:
                case ComponentType.ELECTROMAGNET:
                case ComponentType.MAGNETIC_LOCK:
                case ComponentType.LASER_MODULE:
                case ComponentType.ALARM_SIREN:
                case ComponentType.SSR_RELAY:
                case ComponentType.CONTACTOR:
                case ComponentType.CIRCUIT_BREAKER:
                    pinStates[pin] = analogVal > 500 ? 1023 : 0;
                    break;

                case ComponentType.PUMP:
                case ComponentType.FAN:
                case ComponentType.AIR_COMPRESSOR:
                    pinStates[pin] = analogVal > 100 ? (timestamp * 3) % 360 : 0;
                    break;

                case ComponentType.HEATER:
                    pinStates[pin] = analogVal; // Temperature based on PWM
                    break;

                case ComponentType.LINEAR_ACTUATOR:
                    pinStates[pin] = analogVal; // Position 0-1023
                    break;

                case ComponentType.PELTIER:
                    pinStates[pin] = analogVal > 500 ? 1 : 0;
                    break;

                case ComponentType.FOG_MACHINE:
                    pinStates[pin] = analogVal > 700 ? 1 : 0;
                    break;

                // LED Variants
                case ComponentType.LED_STRIP:
                case ComponentType.LED_RING:
                    pinStates[pin] = Math.floor(timestamp / 30) % 1023;
                    break;

                case ComponentType.LED_BAR:
                    pinStates[pin] = analogVal;
                    break;

                case ComponentType.LED_FILAMENT:
                case ComponentType.LASER_CROSSHAIR:
                    pinStates[pin] = analogVal > 500 ? 1 : 0;
                    break;

                // Sensors (Input simulation)
                case ComponentType.FLEX_SENSOR:
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 3000));
                    break;

                case ComponentType.FORCE_SENSOR:
                    pinStates[pin] = (timestamp % 5000 < 1000) ? Math.round(800 + 200 * Math.random()) : Math.round(100 * Math.random());
                    break;

                case ComponentType.THERMISTOR:
                    pinStates[pin] = Math.round(512 + 300 * Math.sin(timestamp / 10000));
                    break;

                case ComponentType.HALL_SENSOR:
                case ComponentType.MAGNETIC_SENSOR:
                    pinStates[pin] = (timestamp % 3000 < 1000) ? 1023 : 0;
                    break;

                case ComponentType.ENCODER_OPTICAL:
                    pinStates[pin] = Math.floor(timestamp / 10) % 1023;
                    break;

                case ComponentType.PROXIMITY_SENSOR:
                case ComponentType.LASER_SENSOR:
                    pinStates[pin] = (timestamp % 4000 < 800) ? 1023 : 0;
                    break;

                case ComponentType.BARCODE_SCANNER:
                    pinStates[pin] = (timestamp % 5000 < 200) ? 1 : 0;
                    break;

                case ComponentType.TDS_SENSOR:
                case ComponentType.TURBIDITY_SENSOR:
                    pinStates[pin] = Math.round(300 + 400 * Math.sin(timestamp / 8000) + 100 * Math.random());
                    break;

                case ComponentType.FLOW_SENSOR:
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 2000));
                    break;

                case ComponentType.LEVEL_SENSOR:
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 15000));
                    break;

                case ComponentType.LOAD_SENSOR:
                case ComponentType.SHOCK_SENSOR:
                    pinStates[pin] = (timestamp % 6000 < 500) ? Math.round(700 + 300 * Math.random()) : Math.round(200 * Math.random());
                    break;

                case ComponentType.ALCOHOL_SENSOR:
                case ComponentType.SMOKE_SENSOR:
                    pinStates[pin] = Math.round(200 + 600 * Math.sin(timestamp / 12000) + 150 * Math.random());
                    break;

                // Communication Modules
                case ComponentType.ZIGBEE:
                case ComponentType.ZWAVE:
                case ComponentType.THREAD:
                    pinStates[pin] = (timestamp % 6000 > 1000) ? 800 : 200;
                    break;

                case ComponentType.RS485:
                case ComponentType.RS232:
                    pinStates[pin] = (timestamp % 200 < 50) ? 1 : 0;
                    break;

                // Audio Modules
                case ComponentType.I2S_AUDIO:
                case ComponentType.DAC_AUDIO:
                    pinStates[pin] = Math.round(512 + 400 * Math.sin(timestamp / 100));
                    break;

                case ComponentType.VOICE_MODULE:
                    pinStates[pin] = (timestamp % 3000 < 1500) ? 1 : 0;
                    break;

                // Display Variants
                case ComponentType.VFD_DISPLAY:
                case ComponentType.NIXIE_TUBE:
                case ComponentType.HUD_DISPLAY:
                case ComponentType.MATRIX_PANEL:
                case ComponentType.SEGMENT_DISPLAY:
                    pinStates[pin] = Math.floor(timestamp / 50) % 1023;
                    break;

                // Industrial
                case ComponentType.PLC_MODULE:
                    pinStates[pin] = analogVal > 0 ? (1 << (Math.floor(timestamp / 500) % 4)) : 0;
                    break;

                case ComponentType.FUSE:
                    pinStates[pin] = 1023; // Healthy fuse
                    break;

                case ComponentType.TERMINAL_BLOCK:
                    pinStates[pin] = 512; // Connection status
                    break;

                // --- ACTUATORS (Outputs from Arduino) ---
                case ComponentType.LED:
                case ComponentType.RELAY:
                    if (analogVal > 800) pinStates[pin] = 1;
                    else if (hasUltrasonic && distVal < 20) pinStates[pin] = 1;
                    else pinStates[pin] = (Math.floor(timestamp / 1000) % 2);
                    break;

                case ComponentType.RGB_LED: {
                    // RGB color cycling
                    const phase = timestamp / 2000;
                    pinStates[pin] = Math.round(127 + 127 * Math.sin(phase)); // R
                    if (comp.properties?.pinG) pinStates[String(comp.properties.pinG)] = Math.round(127 + 127 * Math.sin(phase + 2.1)); // G
                    if (comp.properties?.pinB) pinStates[String(comp.properties.pinB)] = Math.round(127 + 127 * Math.sin(phase + 4.2)); // B
                    break;
                }

                case ComponentType.LCD:
                    pinStates[pin] = analogVal; // Use analog value for display
                    break;

                case ComponentType.BUZZER:
                case ComponentType.VIBRATION_MOTOR:
                    if (hasUltrasonic && distVal < 30) {
                        const rate = Math.max(50, distVal * 10);
                        pinStates[pin] = (timestamp % rate < (rate / 2)) ? 1 : 0;
                    } else if (hasHeart && pinStates[String(comp.pin)] > 500) {
                        pinStates[pin] = 1; // Beep on heart beat
                    } else {
                        pinStates[pin] = 0;
                    }
                    break;

                case ComponentType.SERVO:
                    // Smooth sweep from 0 to 180 degrees
                    pinStates[pin] = Math.round(90 + 90 * Math.sin(timestamp / 1500));
                    break;

                case ComponentType.STEPPER:
                    if (hasStepper) {
                        stepperPos = (stepperPos + 5) % 360;
                        pinStates[pin] = stepperPos;
                    }
                    break;

                case ComponentType.SEVEN_SEGMENT:
                    if (hasSevSeg) pinStates[pin] = sevSegCount;
                    break;

                case ComponentType.NEOPIXEL:
                    if (hasNeoPixel) pinStates[pin] = neoPixelOffset;
                    break;

                case ComponentType.SPEAKER:
                    if (hasTalkie && (timestamp % 5000 < 2000)) pinStates[pin] = Math.random();
                    else pinStates[pin] = 0;
                    break;

                case ComponentType.GENERIC:
                    pinStates[pin] = 1;
                    break;

                default:
                    pinStates[pin] = 0;
            }
        });

        // --- 4. GENERATE SERIAL LOGS ---
        if (timestamp % 1000 === 0) {
            let logMsg = `[${(timestamp / 1000).toFixed(1)}s]`;
            if (hasUltrasonic) logMsg += ` Dist:${distVal}cm`;
            if (hasDHT) logMsg += ` Temp:${dhtTemp.toFixed(1)}C`;
            if (hasHeart) logMsg += ` BPM:${heartRate}`;
            if (code.includes('pH')) logMsg += ` pH:${phValue.toFixed(2)}`;
            if (hasWiFi && timestamp === 1000) logMsg += ` WiFi: Connecting...`;
            if (hasWiFi && timestamp === 4000) logMsg += ` WiFi: IP 192.168.1.105`;

            serialOutput = logMsg + "\n";
        }

        frames.push({
            timestamp,
            pinStates,
            serialOutput,
            log: null
        });
    }

    return { success: true, frames };
};

// --- WIRING DERIVATION (Regex Fallback) ---
const basicRegexWiring = (files: ProjectFile[]): WiringManifest => {
    const code = files.map(f => f.content).join('\n');
    const components: ArduinoComponent[] = [];
    let idCounter = 1;

    // 1. Library & Keyword Detection

    // Talkie -> Speaker
    if (code.includes('Talkie')) components.push({ id: `spk_${idCounter++}`, type: ComponentType.SPEAKER, pin: 3, label: 'Talkie Speaker' });

    // Servo
    if (code.includes('Servo.h')) {
        const match = code.match(/\.attach\s*\(\s*(\d+)\s*\)/);
        components.push({ id: `servo_${idCounter++}`, type: ComponentType.SERVO, pin: match ? match[1] : 9, label: 'Servo' });
    }

    // WiFi
    if (code.includes('WiFi') || code.includes('ESP8266')) {
        components.push({ id: `wifi_${idCounter++}`, type: ComponentType.MODULE_WIFI, pin: 'RX/TX', label: 'ESP8266 WiFi' });
    }

    // NeoPixel / FastLED
    if (code.includes('Adafruit_NeoPixel') || code.includes('FastLED')) {
        const pinMatch = code.match(/PIN\s+(\d+)/) || code.match(/(\d+)\s*,\s*NUM_LEDS/);
        components.push({ id: `neo_${idCounter++}`, type: ComponentType.NEOPIXEL, pin: pinMatch ? pinMatch[1] : 6, label: 'NeoPixel Strip' });
    }

    // Stepper
    if (code.includes('Stepper.h')) {
        const pinMatch = code.match(/Stepper\s+\w+\s*\(\s*\w+\s*,\s*(\d+)/);
        components.push({ id: `step_${idCounter++}`, type: ComponentType.STEPPER, pin: pinMatch ? pinMatch[1] : 8, label: 'Stepper Motor' });
    }

    // 7-Segment (SevSeg)
    if (code.includes('SevSeg')) {
        components.push({ id: `seg_${idCounter++}`, type: ComponentType.SEVEN_SEGMENT, pin: 2, label: '7-Segment Display' });
    }

    // DHT
    if (code.includes('DHT.h')) {
        const pinMatch = code.match(/DHT\s+\w+\s*\(\s*(\w+)/);
        let pin = '2';
        if (pinMatch) {
            const def = code.match(new RegExp(`#define\\s+${pinMatch[1]}\\s+(\\w+)`));
            pin = def ? def[1] : (pinMatch[1].match(/\d+/) ? pinMatch[1] : '2');
        }
        components.push({ id: `dht_${idCounter++}`, type: ComponentType.SENSOR_DHT, pin, label: 'DHT11' });
    }

    // 2. Generic IO Detection
    const pinModeMatches = code.matchAll(/pinMode\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)/g);
    for (const match of pinModeMatches) {
        const pinName = match[1];
        const mode = match[2];
        let pinVal = pinName;

        const defineMatch = code.match(new RegExp(`#define\\s+${pinName}\\s+(\\w+)`));
        if (defineMatch) pinVal = defineMatch[1];
        if (pinName === 'LED_BUILTIN') pinVal = '13';

        if (components.some(c => String(c.pin) === String(pinVal))) continue;

        const nameLower = pinName.toLowerCase();
        let type = ComponentType.GENERIC;
        let label = 'Module';

        if (mode === 'OUTPUT') {
            if (nameLower.includes('led')) { type = ComponentType.LED; label = 'LED'; }
            else if (nameLower.includes('relay')) { type = ComponentType.RELAY; label = 'Relay'; }
            else if (nameLower.includes('buzzer')) { type = ComponentType.BUZZER; label = 'Buzzer'; }
            else if (nameLower.includes('trig')) { type = ComponentType.SENSOR_ULTRASONIC; label = 'Ultrasonic'; }
            else { type = ComponentType.GENERIC; label = 'Output Module'; }
        } else {
            if (nameLower.includes('echo')) continue;
            if (nameLower.includes('btn') || nameLower.includes('button')) { type = ComponentType.BUTTON; label = 'Button'; }
            else if (nameLower.includes('pir') || nameLower.includes('motion')) { type = ComponentType.GENERIC; label = 'PIR Sensor'; }
            else { type = ComponentType.GENERIC; label = 'Input Sensor'; }
        }

        components.push({ id: `io_${idCounter++}`, type, pin: pinVal, label });
    }

    // Analog Read Detection
    const analogMatches = code.matchAll(/analogRead\s*\(\s*([a-zA-Z0-9_]+)\s*\)/g);
    for (const match of analogMatches) {
        let pinVal = match[1];
        const defineMatch = code.match(new RegExp(`#define\\s+${pinVal}\\s+(\\w+)`));
        if (defineMatch) pinVal = defineMatch[1];

        if (components.some(c => String(c.pin) === String(pinVal))) continue;

        const nameLower = pinVal.toLowerCase();
        let type = ComponentType.POTENTIOMETER;
        let label = 'Potentiometer';

        if (nameLower.includes('x') || nameLower.includes('y')) { type = ComponentType.JOYSTICK; label = 'Joystick'; }
        else if (nameLower.includes('ldr')) { type = ComponentType.LDR; label = 'LDR'; }
        else if (nameLower.includes('temp')) { type = ComponentType.SENSOR_TEMP; label = 'Temp Sensor'; }
        else if (nameLower.includes('gas') || nameLower.includes('mq')) { type = ComponentType.SENSOR_GAS; label = 'Gas Sensor'; }
        else if (nameLower.includes('ph')) { type = ComponentType.SENSOR_PH; label = 'pH Sensor'; }
        else if (nameLower.includes('pulse') || nameLower.includes('heart')) { type = ComponentType.SENSOR_HEART; label = 'Heart Rate'; }

        components.push({ id: `ana_${idCounter++}`, type, pin: pinVal, label });
    }

    if (components.length === 0) components.push({ id: 'def_led', type: ComponentType.LED, pin: 13, label: 'Built-in LED' });

    return { board: 'Arduino Uno', components };
};

// === API PROXY HELPER ===
// Calls the server-side API which handles prompts, schemas, and AI providers

interface ModelConfigPayload {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

function getActiveModelConfigFromStorage(): ModelConfigPayload | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('studio-model-sections');
    if (!raw) return undefined;
    const sections = JSON.parse(raw) as Array<{
      isActive?: boolean;
      provider?: string;
      apiKey?: string;
      model?: string;
      baseUrl?: string;
      temperature?: number;
      maxTokens?: number;
    }>;
    const active = sections.find(s => s.isActive && s.apiKey && s.apiKey.length > 10);
    if (!active?.apiKey) return undefined;
    return {
      provider: active.provider || 'gemini',
      apiKey: active.apiKey,
      model: active.model || 'gemini-2.5-flash-lite',
      baseUrl: active.baseUrl,
      temperature: active.temperature,
      maxTokens: active.maxTokens,
    };
  } catch {
    return undefined;
  }
}

const callAPI = async (payload: {
  action: string;
  files?: ProjectFile[];
  prompt?: string;
  token?: string;
  modelConfig?: ModelConfigPayload;
}): Promise<{ data: any; tokenUsage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }> => {
    const modelConfig = payload.modelConfig ?? getActiveModelConfigFromStorage();
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(payload.token ? { 'Authorization': `Bearer ${payload.token}` } : {})
        },
        body: JSON.stringify({ ...payload, modelConfig })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new AIError(
            errorData.error || `API Error ${response.status}`,
            response.status === 503 ? 'NETWORK_ERROR' : 'GENERATION_FAILED',
            true,
            errorData.details
        );
    }

    const result = await response.json();
    // Provider logged for debugging if needed
    // if (result.provider) console.log(`AI response from: ${result.provider}`);
    return {
        data: result.data,
        tokenUsage: result.tokenUsage
    };
};

// --- API EXPORTS ---

export const generateArduinoProject = async (prompt: string, currentFiles: ProjectFile[], token?: string): Promise<{
    files: ProjectFile[];
    explanation: string;
    wiring: WiringManifest;
    tokenUsage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}> => {
    try {
        const apiResult = await callAPI({
            action: 'GENERATE_ARDUINO',
            prompt,
            files: currentFiles,
            token
        });

        const result = apiResult.data;

        // Ensure safe defaults
        if (!result.wiring) result.wiring = { board: 'Arduino Uno', components: [] };
        if (!result.files) result.files = [];

        return {
            ...result,
            tokenUsage: apiResult.tokenUsage
        };
    } catch (error) {
        console.error("Arduino Gen Error:", error);
        if (error instanceof AIError) throw error;
        throw new AIError(error instanceof Error ? error.message : "Generation failed", 'GENERATION_FAILED', true);
    }
};

export const verifyArduinoCode = async (files: ProjectFile[]): Promise<{ valid: boolean; errors: string[] }> => {
    const allCode = files.filter(f => f.type === 'code').map(f => f.content).join('\n');

    // STEP 1: Fast local syntax verification
    const localResult = localVerifyArduinoSyntax(allCode);
    if (!localResult.valid) {
        return { valid: false, errors: [...localResult.errors, '⚡ (Local syntax check - instant)'] };
    }

    const warnings = localResult.errors.filter(e => e.includes('warning') || e.includes('Possible'));

    // STEP 2: Server-side AI analysis
    try {
        const apiResult = await callAPI({ action: 'VERIFY_ARDUINO', files });
        const parsed = apiResult.data;

        return {
            valid: Boolean(parsed.valid) && warnings.filter(w => !w.includes('Possible')).length === 0,
            errors: [...warnings, ...(parsed.errors || []).map((e: string) => `🤖 ${e}`)]
        };
    } catch (error) {
        console.warn('AI verification failed, using local result:', error);
        return {
            valid: true,
            errors: warnings.length > 0 ? [...warnings, '⚠️ AI unavailable, local check passed'] : ['✅ Syntax verified locally']
        };
    }
};

// ===== RASPBERRY PI MODE FUNCTIONS =====

export const generateRaspberryPiProject = async (prompt: string, currentFiles: ProjectFile[], token?: string): Promise<{
    files: ProjectFile[];
    explanation: string;
    wiring: RaspberryPiWiringManifest;
    tokenUsage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}> => {
    try {
        const apiResult = await callAPI({
            action: 'GENERATE_RPI',
            prompt,
            files: currentFiles,
            token
        });

        const result = apiResult.data;

        if (!result.wiring) result.wiring = { board: 'Raspberry Pi 4B', components: [] };
        return {
            ...result,
            tokenUsage: apiResult.tokenUsage
        };
    } catch (error) {
        console.error("RPi Gen Error:", error);
        if (error instanceof AIError) throw error;
        throw new AIError(error instanceof Error ? error.message : "Generation failed", 'GENERATION_FAILED', true);
    }
};

export const verifyPythonCode = async (files: ProjectFile[]): Promise<{ valid: boolean; errors: string[] }> => {
    const allCode = files.filter(f => f.name.endsWith('.py')).map(f => f.content).join('\n');

    // STEP 1: Local check
    const localResult = localVerifyPythonSyntax(allCode);
    if (!localResult.valid) {
        return { valid: false, errors: [...localResult.errors, '⚡ (Local Python check - instant)'] };
    }

    const warnings = localResult.errors.filter(e => e.includes('warning') || e.includes('Consider'));

    // STEP 2: Server-side AI analysis
    try {
        const apiResult = await callAPI({ action: 'VERIFY_PYTHON', files });
        const parsed = apiResult.data;

        return {
            valid: Boolean(parsed.valid) && warnings.filter(w => !w.includes('Consider')).length === 0,
            errors: [...warnings, ...(parsed.errors || []).map((e: string) => `🤖 ${e}`)]
        };
    } catch (error) {
        console.warn('AI verification failed, using local result:', error);
        return {
            valid: true,
            errors: warnings.length > 0 ? [...warnings, '⚠️ AI unavailable, local check passed'] : ['✅ Python syntax verified locally']
        };
    }
};

export const deriveWiringFromCode = async (files: ProjectFile[]): Promise<WiringManifest> => {
    try {
        // Try server-side AI (which also has a regex fallback on server! But we can keep local fallback too)
        const apiResult = await callAPI({ action: 'DERIVE_WIRING', files });
        return apiResult.data;
    } catch (error) {
        console.warn("Wiring API failed, using client-side fallback", error);
        return basicRegexWiring(files);
    }
}

export const simulateExecution = async (files: ProjectFile[], wiring: WiringManifest): Promise<SimulationResult> => {
    const code = files.map(f => f.content).join('\n');
    return generateLocalSimulation(wiring, code);
};
