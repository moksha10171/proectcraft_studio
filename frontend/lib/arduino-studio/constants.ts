import { ProjectFile, WiringManifest, ComponentType, RaspberryPiWiringManifest, RaspberryPiComponentType } from './types';

export const INITIAL_MANIFEST: WiringManifest = {
    board: 'Arduino Uno',
    components: [
        { id: 'ultra_1', type: ComponentType.SENSOR_ULTRASONIC, pin: 9, label: 'Ultrasonic (Trig 9, Echo 10)' },
        { id: 'vib_1', type: ComponentType.VIBRATION_MOTOR, pin: 6, label: 'Haptic Motor' },
        { id: 'buzzer_1', type: ComponentType.BUZZER, pin: 5, label: 'Piezo Buzzer' },
        { id: 'led_status', type: ComponentType.LED, pin: 13, label: 'Status LED', properties: { color: 'blue' } },
        { id: 'water_1', type: ComponentType.SENSOR_WATER, pin: 'A0', label: 'Water Sensor' },
        { id: 'ldr_1', type: ComponentType.LDR, pin: 'A1', label: 'Light Sensor (LDR)' }
    ]
};

export const INITIAL_CONFIG = `#ifndef CONFIG_H
#define CONFIG_H

// Pin Definitions
#define PIN_TRIG 9
#define PIN_ECHO 10
#define PIN_VIB 6
#define PIN_BUZZER 5
#define PIN_LED 13
#define PIN_WATER A0
#define PIN_LDR A1

// Thresholds & Constants
#define THRESHOLD_WATER 400   // Analog reading for water detection
#define THRESHOLD_DARK 600    // LDR reading for dark environment
#define DIST_WARNING 50       // cm
#define DIST_DANGER 20        // cm

#endif`;

export const INITIAL_SKETCH = `/*
 * Arduino Smart Blind Stick
 * 
 * Features:
 * - Ultrasonic Obstacle Detection with Smoothing
 * - Water Puddle Detection
 * - Auto-Light (LDR)
 * - Multi-pattern Haptic & Audio Feedback
 */

#include "config.h"

// State Variables
unsigned long lastUpdate = 0;
unsigned long lastPatternUpdate = 0;
bool patternState = false;

// Sensor Readings
int distance = 0;
int waterLevel = 0;
int lightLevel = 0;

void setup() {
    Serial.begin(9600);
    
    pinMode(PIN_TRIG, OUTPUT);
    pinMode(PIN_ECHO, INPUT);
    pinMode(PIN_VIB, OUTPUT);
    pinMode(PIN_BUZZER, OUTPUT);
    pinMode(PIN_LED, OUTPUT);
    
    // Boot Beep
    tone(PIN_BUZZER, 2000, 100); delay(200);
    tone(PIN_BUZZER, 3000, 100);
    Serial.println(F("Smart Stick Ready"));
}

void loop() {
    // 1. Read Sensors
    readSensors();
    
    // 2. Determine Alert Level
    int alertLevel = 0; // 0=None, 1=Warn, 2=Danger, 3=Water
    
    if (waterLevel > THRESHOLD_WATER) {
        alertLevel = 3;
    } else if (distance > 0 && distance < DIST_DANGER) {
        alertLevel = 2;
    } else if (distance > 0 && distance < DIST_WARNING) {
        alertLevel = 1;
    }
    
    // 3. Handle Auto Light
    if (lightLevel < THRESHOLD_DARK) {
        digitalWrite(PIN_LED, HIGH);
    } else {
        digitalWrite(PIN_LED, LOW);
    }
    
    // 4. Output Feedback
    handleFeedback(alertLevel);
    
    delay(50); // Loop stability
}

void readSensors() {
    waterLevel = analogRead(PIN_WATER);
    lightLevel = analogRead(PIN_LDR);
    distance = getSmoothedDistance();
    
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 1000) {
        Serial.print(F("Dist: ")); Serial.print(distance);
        Serial.print(F("cm | Water: ")); Serial.print(waterLevel);
        Serial.print(F(" | Light: ")); Serial.println(lightLevel);
        lastPrint = millis();
    }
}

int getSmoothedDistance() {
    // Median filter simple implementation (3 samples)
    int samples[3];
    for (int i=0; i<3; i++) {
        digitalWrite(PIN_TRIG, LOW); delayMicroseconds(2);
        digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
        digitalWrite(PIN_TRIG, LOW);
        long duration = pulseIn(PIN_ECHO, HIGH, 25000); // Timeout 25ms (~4m)
        samples[i] = (duration == 0) ? 999 : (duration * 0.034 / 2);
        delay(5);
    }
    // Sort
    if (samples[0] > samples[1]) { int t=samples[0]; samples[0]=samples[1]; samples[1]=t; }
    if (samples[1] > samples[2]) { int t=samples[1]; samples[1]=samples[2]; samples[2]=t; }
    if (samples[0] > samples[1]) { int t=samples[0]; samples[0]=samples[1]; samples[1]=t; }
    
    return samples[1];
}

void handleFeedback(int level) {
    if (level == 0) {
        noTone(PIN_BUZZER);
        digitalWrite(PIN_VIB, LOW);
        return;
    }
    
    unsigned long now = millis();
    int interval = 0;
    
    if (level == 1) interval = 500; // Slow
    if (level == 2) interval = 150; // Fast
    if (level == 3) interval = 50;  // Very Fast/Siren
    
    if (now - lastPatternUpdate > interval) {
        lastPatternUpdate = now;
        patternState = !patternState;
        
        if (patternState) {
            digitalWrite(PIN_VIB, HIGH);
            if (level == 3) tone(PIN_BUZZER, 3000);
            else tone(PIN_BUZZER, 2000);
        } else {
            digitalWrite(PIN_VIB, LOW);
            noTone(PIN_BUZZER);
        }
    }
}`;

export const INITIAL_FILES: ProjectFile[] = [
    { name: 'sketch.ino', content: INITIAL_SKETCH, type: 'code' },
    { name: 'config.h', content: INITIAL_CONFIG, type: 'code' },
    { name: 'README.md', content: '# Arduino Smart Stick\n\nAI-Generated Project Structure.\n\n- `sketch.ino`: Main logic\n- `config.h`: Pin definitions and constants', type: 'doc' }
];

export const PINS_DIGITAL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const PINS_ANALOG = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
export const PINS_POWER = ['3.3V', '5V', 'GND', 'VIN'];

// ===== RASPBERRY PI CONSTANTS =====

export const RPI_INITIAL_MANIFEST: RaspberryPiWiringManifest = {
    board: 'Raspberry Pi 4B',
    components: [
        { id: 'led_1', type: RaspberryPiComponentType.GPIO_LED, pin: 17, label: 'Status LED (GPIO17)', properties: { color: '#22c55e' } },
        { id: 'led_2', type: RaspberryPiComponentType.GPIO_LED, pin: 27, label: 'Alert LED (GPIO27)', properties: { color: '#ef4444' } },
        { id: 'btn_1', type: RaspberryPiComponentType.GPIO_BUTTON, pin: 22, label: 'Button (GPIO22)' },
        { id: 'bme_1', type: RaspberryPiComponentType.BME280, pin: 'I2C', label: 'BME280 Env Sensor' },
        { id: 'oled_1', type: RaspberryPiComponentType.SSD1306_OLED, pin: 'I2C', label: 'OLED Display 128x64' },
        { id: 'pir_1', type: RaspberryPiComponentType.PIR_SENSOR, pin: 4, label: 'PIR Motion (GPIO4)' },
        { id: 'buzzer_1', type: RaspberryPiComponentType.GPIO_BUZZER, pin: 18, label: 'Buzzer (GPIO18 PWM)' },
        { id: 'servo_1', type: RaspberryPiComponentType.SERVO, pin: 12, label: 'Servo Motor (GPIO12)' }
    ]
};


export const RPI_INITIAL_CONFIG = `# Raspberry Pi GPIO Configuration
# BCM Pin Numbering

# LED & Output Pins
LED_GREEN_PIN = 17  # Status LED
LED_RED_PIN = 27    # Alert LED
BUZZER_PIN = 18     # PWM capable
SERVO_PIN = 12      # PWM capable

# Input Pins
BUTTON_PIN = 22
PIR_PIN = 4

# I2C Configuration (Default I2C bus)
I2C_BUS = 1  # /dev/i2c-1
BME280_ADDR = 0x76  # BME280 I2C address
OLED_ADDR = 0x3C    # SSD1306 I2C address
OLED_WIDTH = 128
OLED_HEIGHT = 64

# Timing Constants
DEBOUNCE_TIME = 0.2  # seconds
READ_INTERVAL = 2.0  # seconds between sensor reads
SERVO_MIN = 2.5      # 0 degrees
SERVO_MAX = 12.5     # 180 degrees
`;


export const RPI_INITIAL_MAIN = `#!/usr/bin/env python3
"""
Raspberry Pi GPIO Demo
- LED control with button
- DHT22 temperature/humidity reading
- PIR motion detection with buzzer alert

Requires: RPi.GPIO, Adafruit_DHT
Install: pip install RPi.GPIO Adafruit_DHT
"""

import RPi.GPIO as GPIO
import Adafruit_DHT
import time
from config import *

# Setup
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# Configure pins
GPIO.setup(LED_PIN, GPIO.OUT)
GPIO.setup(BUZZER_PIN, GPIO.OUT)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(PIR_PIN, GPIO.IN)

# PWM for buzzer
buzzer_pwm = GPIO.PWM(BUZZER_PIN, 1000)

def read_dht():
    """Read temperature and humidity from DHT22"""
    humidity, temperature = Adafruit_DHT.read_retry(DHT_TYPE, DHT_PIN)
    if humidity is not None and temperature is not None:
        return temperature, humidity
    return None, None

def beep(duration=0.1, freq=1000):
    """Sound the buzzer"""
    buzzer_pwm.ChangeFrequency(freq)
    buzzer_pwm.start(50)
    time.sleep(duration)
    buzzer_pwm.stop()

def main():
    print("Raspberry Pi GPIO Demo Started")
    print("Press Ctrl+C to exit")
    
    last_read = 0
    led_state = False
    
    try:
        while True:
            # Button toggle LED
            if GPIO.input(BUTTON_PIN) == GPIO.LOW:
                led_state = not led_state
                GPIO.output(LED_PIN, led_state)
                print(f"LED: {'ON' if led_state else 'OFF'}")
                time.sleep(DEBOUNCE_TIME)
            
            # PIR Motion Detection
            if GPIO.input(PIR_PIN):
                print("Motion detected!")
                beep(0.2, 2000)
            
            # Periodic sensor reading
            current_time = time.time()
            if current_time - last_read > READ_INTERVAL:
                temp, hum = read_dht()
                if temp is not None:
                    print(f"Temp: {temp:.1f}C | Humidity: {hum:.1f}%")
                last_read = current_time
            
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("Goodbye!")
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    main()
`;

export const RPI_INITIAL_FILES: ProjectFile[] = [
    { name: 'main.py', content: RPI_INITIAL_MAIN, type: 'code' },
    { name: 'config.py', content: RPI_INITIAL_CONFIG, type: 'code' },
    { name: 'README.md', content: '# Raspberry Pi GPIO Demo\n\nAI-Generated Project Structure.\n\n- `main.py`: Main GPIO control logic\n- `config.py`: Pin definitions and constants\n\n## Requirements\n```bash\npip install RPi.GPIO Adafruit_DHT\n```\n\n## Run\n```bash\nsudo python3 main.py\n```', type: 'doc' }
];

// Raspberry Pi GPIO Pins (BCM numbering)
export const GPIO_PINS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
export const GPIO_POWER = ['3.3V', '5V', 'GND'];
export const GPIO_I2C = { SDA: 2, SCL: 3 };
export const GPIO_SPI = { MOSI: 10, MISO: 9, SCLK: 11, CE0: 8, CE1: 7 };
export const GPIO_UART = { TX: 14, RX: 15 };
export const GPIO_PWM = [12, 13, 18, 19]; // Hardware PWM capable pins
