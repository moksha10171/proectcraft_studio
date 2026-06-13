export type Region = 'global' | 'us' | 'eu' | 'india';
export type Complexity = 'basic' | 'advanced' | 'prototype';

export interface Component {
    id: string;
    name: string;
    category: 'controller' | 'sensor' | 'actuator' | 'power' | 'connectivity' | 'accessory' | 'tool';
    platform: 'arduino' | 'raspberry-pi' | 'both';
    prices: {
        low: number;
        avg: number;
        high: number;
    };
    officialSource?: string;
    description: string;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    platform: 'arduino' | 'raspberry-pi';
    components: { id: string; quantity: number }[];
}

export const REGION_MODIFIERS: Record<Region, number> = {
    global: 1.0,
    us: 1.15, // Sales tax + local shipping
    eu: 1.25, // VAT + high international shipping
    india: 1.10 // Customs duties for imports
};

export const COMPLEXITY_BUFFERS: Record<Complexity, number> = {
    basic: 1.10,   // 10% for basic wires/consumables
    advanced: 1.25, // 25% for intermediate mistakes
    prototype: 1.45 // 45% for heavy R&D and burned chips
};

export const COMPONENTS: Component[] = [
    // --- Controllers: Arduino ---
    {
        id: 'uno-r3',
        name: 'Arduino Uno R3',
        category: 'controller',
        platform: 'arduino',
        prices: { low: 22, avg: 27, high: 32 },
        description: 'The classic entry-level board for beginners.',
        officialSource: 'https://store.arduino.cc/products/arduino-uno-rev3'
    },
    {
        id: 'uno-r4-minima',
        name: 'Arduino Uno R4 Minima',
        category: 'controller',
        platform: 'arduino',
        prices: { low: 18, avg: 20, high: 24 },
        description: 'Upgraded 32-bit architecture in the classic Uno shape.',
        officialSource: 'https://store.arduino.cc/products/uno-r4-minima'
    },
    {
        id: 'nano-v3',
        name: 'Arduino Nano V3',
        category: 'controller',
        platform: 'arduino',
        prices: { low: 12, avg: 25, high: 30 },
        description: 'Compact board for breadboard-friendly projects.',
        officialSource: 'https://store.arduino.cc/products/arduino-nano'
    },
    {
        id: 'mega-2560',
        name: 'Arduino Mega 2560',
        category: 'controller',
        platform: 'arduino',
        prices: { low: 35, avg: 49, high: 58 },
        description: 'High I/O board for complex projects with many sensors.',
        officialSource: 'https://store.arduino.cc/products/arduino-mega-2560-rev3'
    },
    {
        id: 'esp32-wroom',
        name: 'ESP32 WROOM (WiFi/BT)',
        category: 'controller',
        platform: 'arduino',
        prices: { low: 4, avg: 6, high: 9 },
        description: 'Powerful dual-core chip with WiFi and Bluetooth. Ideal for IoT.',
        officialSource: 'https://www.espressif.com/en/products/modules/esp32'
    },
    {
        id: 'esp8266-nodemcu',
        name: 'NodeMCU ESP8266',
        category: 'controller',
        platform: 'arduino',
        prices: { low: 2, avg: 4, high: 6 },
        description: 'Affordable WiFi-enabled board for simple IoT sensors.',
        officialSource: 'https://www.espressif.com/en/products/socs/esp8266'
    },

    // --- Controllers: Raspberry Pi ---
    {
        id: 'pi-5-4gb',
        name: 'Raspberry Pi 5 (4GB)',
        category: 'controller',
        platform: 'raspberry-pi',
        prices: { low: 65, avg: 70, high: 80 },
        description: 'Flagship performance for desktop computing and high-end projects.',
        officialSource: 'https://www.raspberrypi.com/products/raspberry-pi-5/'
    },
    {
        id: 'pi-5-8gb',
        name: 'Raspberry Pi 5 (8GB)',
        category: 'controller',
        platform: 'raspberry-pi',
        prices: { low: 90, avg: 95, high: 110 },
        description: 'High-memory flagship for AI and heavy workloads.',
        officialSource: 'https://www.raspberrypi.com/products/raspberry-pi-5/'
    },
    {
        id: 'pi-4-4gb',
        name: 'Raspberry Pi 4 (4GB)',
        category: 'controller',
        platform: 'raspberry-pi',
        prices: { low: 55, avg: 60, high: 70 },
        description: 'Reliable and widely supported predecessor to Pi 5.',
        officialSource: 'https://www.raspberrypi.com/products/raspberry-pi-4-model-b/'
    },
    {
        id: 'pi-zero-2w',
        name: 'Raspberry Pi Zero 2 W',
        category: 'controller',
        platform: 'raspberry-pi',
        prices: { low: 15, avg: 16, high: 20 },
        description: 'Tiny, powerful computer with WiFi for embedded IoT.',
        officialSource: 'https://www.raspberrypi.com/products/raspberry-pi-zero-2-w/'
    },
    {
        id: 'pico-2-w',
        name: 'Raspberry Pi Pico 2 W',
        category: 'controller',
        platform: 'raspberry-pi',
        prices: { low: 5, avg: 7, high: 10 },
        description: 'Newest Pico with dual cores and wireless capabilities.',
        officialSource: 'https://www.raspberrypi.com/products/raspberry-pi-pico-2/'
    },
    {
        id: 'pico-w',
        name: 'Raspberry Pi Pico W',
        category: 'controller',
        platform: 'raspberry-pi',
        prices: { low: 4, avg: 6, high: 8 },
        description: 'Breadboard-friendly microcontroller with WiFi.',
        officialSource: 'https://www.raspberrypi.com/products/raspberry-pi-pico-w/'
    },

    // --- Sensors ---
    {
        id: 'dht11',
        name: 'DHT11 Temp/Humidity',
        category: 'sensor',
        platform: 'both',
        prices: { low: 1.5, avg: 3, high: 5 },
        description: 'Basic temperature and humidity monitoring.'
    },
    {
        id: 'ultrasonic',
        name: 'HC-SR04 Ultrasonic',
        category: 'sensor',
        platform: 'both',
        prices: { low: 2, avg: 4, high: 6 },
        description: 'Distance measurement using ultrasound.'
    },
    {
        id: 'pir-motion',
        name: 'PIR Motion Sensor',
        category: 'sensor',
        platform: 'both',
        prices: { low: 2, avg: 4, high: 7 },
        description: 'Infrared motion detection.'
    },
    {
        id: 'mpu6050',
        name: 'MPU-6050 Gyro/Accel',
        category: 'sensor',
        platform: 'both',
        prices: { low: 4, avg: 7, high: 12 },
        description: '6-axis motion tracking.'
    },

    // --- Actuators ---
    {
        id: 'sg90-servo',
        name: 'SG90 Micro Servo',
        category: 'actuator',
        platform: 'both',
        prices: { low: 3, avg: 5, high: 8 },
        description: 'Small motor for precise 180-degree rotation.'
    },
    {
        id: 'l298n-driver',
        name: 'L298N Motor Driver',
        category: 'actuator',
        platform: 'both',
        prices: { low: 5, avg: 8, high: 12 },
        description: 'Dual-channel motor controller for DC motors.'
    },
    {
        id: 'ssd1306-oled',
        name: 'SSD1306 0.96" OLED',
        category: 'actuator',
        platform: 'both',
        prices: { low: 5, avg: 10, high: 15 },
        description: 'High-contrast small display for status and text.'
    },

    // --- Accessories & Connectivity ---
    {
        id: 'breadboard-set',
        name: 'Breadboard + Jumpers',
        category: 'accessory',
        platform: 'both',
        prices: { low: 5, avg: 10, high: 15 },
        description: 'Essential for prototyping without soldering.'
    },
    {
        id: 'micro-sd-32gb',
        name: '32GB Micro SD Card',
        category: 'accessory',
        platform: 'raspberry-pi',
        prices: { low: 8, avg: 12, high: 18 },
        description: 'Required storage for Raspberry Pi OS.'
    },
    {
        id: 'official-power-pi5',
        name: 'Pi 5 Power Supply (27W)',
        category: 'power',
        platform: 'raspberry-pi',
        prices: { low: 12, avg: 15, high: 20 },
        description: 'USB-C PD power for Raspberry Pi 5.'
    },
    {
        id: 'usb-cable-uno',
        name: 'USB AB Cable (Uno)',
        category: 'power',
        platform: 'arduino',
        prices: { low: 2, avg: 5, high: 8 },
        description: 'Communication and power for Arduino Uno/Mega.'
    },

    // --- Tools ---
    {
        id: 'soldering-kit',
        name: 'Basic Soldering Kit',
        category: 'tool',
        platform: 'both',
        prices: { low: 15, avg: 30, high: 50 },
        description: 'Iron, solder, and stand for permanent connections.'
    },
    {
        id: 'multimeter',
        name: 'Digital Multimeter',
        category: 'tool',
        platform: 'both',
        prices: { low: 10, avg: 25, high: 60 },
        description: 'Measuring voltage, current, and resistance.'
    }
];

export const CALCULATOR_META = {
    lastUpdated: 'Jan 2026',
    sourceName: 'Market Price Statistics (Official Distributors)',
    currency: 'USD'
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'arduino-basic-iot',
        name: 'IoT Sensor Node',
        description: 'Basic WiFi-enabled node with temperature and motion sensing.',
        platform: 'arduino',
        components: [
            { id: 'esp32-wroom', quantity: 1 },
            { id: 'dht11', quantity: 1 },
            { id: 'pir-motion', quantity: 1 },
            { id: 'breadboard-set', quantity: 1 }
        ]
    },
    {
        id: 'pi-media-center',
        name: 'Home Media Server',
        description: 'A powerful Pi 5 setup for streaming and storage.',
        platform: 'raspberry-pi',
        components: [
            { id: 'pi-5-4gb', quantity: 1 },
            { id: 'official-power-pi5', quantity: 1 },
            { id: 'micro-sd-32gb', quantity: 1 },
            { id: 'ssd1306-oled', quantity: 1 }
        ]
    },
    {
        id: 'pico-robot-brain',
        name: 'Compact Robot',
        description: 'Mobile robot brain using Pico and motor drivers.',
        platform: 'raspberry-pi',
        components: [
            { id: 'pico-2-w', quantity: 1 },
            { id: 'sg90-servo', quantity: 2 },
            { id: 'l298n-driver', quantity: 1 },
            { id: 'ultrasonic', quantity: 1 }
        ]
    }
];
