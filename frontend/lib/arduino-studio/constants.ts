import { ProjectFile, WiringManifest, ComponentType, RaspberryPiWiringManifest, RaspberryPiComponentType } from './types';

export const INITIAL_MANIFEST: WiringManifest = {
  board: 'Arduino Uno',
  components: [{ id: 'builtin_led', type: ComponentType.LED, pin: 13, label: 'Built-in LED' }],
};
export const INITIAL_SKETCH = "// Arduino Uno, classic Nano or Mega: use the board's built-in LED.\nvoid setup() {\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(1000);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(1000);\n}\n";
export const INITIAL_FILES: ProjectFile[] = [
  { name: 'sketch.ino', content: INITIAL_SKETCH, type: 'code' },
  { name: 'README.md', content: 'Arduino blink example. Compile for your selected AVR board. The wiring preview is illustrative.', type: 'doc' },
];

export const PINS_DIGITAL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const PINS_ANALOG = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
export const PINS_POWER = ['3.3V', '5V', 'GND', 'VIN'];

export const RPI_INITIAL_MANIFEST: RaspberryPiWiringManifest = {
  board: 'Raspberry Pi 4B',
  components: [{ id: 'gpio_led', type: RaspberryPiComponentType.GPIO_LED, pin: 17, label: 'LED via 330 ohm resistor' }],
};
export const RPI_INITIAL_MAIN = "\"\"\"Linux Raspberry Pi: BCM GPIO17 -> 330 ohm resistor -> LED -> GND.\n\nInstall gpiozero on the Pi. Do not connect a GPIO pin directly to an LED.\nThis script controls physical hardware; Studio checks syntax without running it.\n\"\"\"\nfrom signal import pause\nfrom gpiozero import LED\n\n\ndef main():\n    with LED(17) as led:\n        led.blink(on_time=1, off_time=1)\n        pause()\n\n\nif __name__ == \"__main__\":\n    main()\n";
export const RPI_INITIAL_FILES: ProjectFile[] = [
  { name: 'main.py', content: RPI_INITIAL_MAIN, type: 'code' },
  { name: 'README.md', content: 'Linux Raspberry Pi: GPIO17 through 330 ohm resistor to LED anode; cathode to GND. Install gpiozero on the Pi. Studio checks syntax without running GPIO.', type: 'doc' },
];

export const GPIO_PINS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
export const GPIO_POWER = ['3.3V', '5V', 'GND'];
export const GPIO_I2C = { SDA: 2, SCL: 3 };
export const GPIO_SPI = { MOSI: 10, MISO: 9, SCLK: 11, CE0: 8, CE1: 7 };
export const GPIO_UART = { TX: 14, RX: 15 };
export const GPIO_PWM = [12, 13, 18, 19]; // Hardware PWM capable pins
