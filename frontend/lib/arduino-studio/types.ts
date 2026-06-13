export interface ProjectFile {
    name: string;
    content: string;
    type: 'code' | 'config' | 'doc';
    readOnly?: boolean;
}

// ===== DEVICE MODE =====
export type DeviceMode = 'arduino' | 'raspberry-pi';

// ===== RASPBERRY PI BOARD TYPES =====
export type RaspberryPiBoardType =
    | 'Raspberry Pi 5'
    | 'Raspberry Pi 4B'
    | 'Raspberry Pi 3B+'
    | 'Raspberry Pi Zero 2W'
    | 'Raspberry Pi Zero W'
    | 'Raspberry Pi Pico'
    | 'Raspberry Pi Pico W';

export interface RaspberryPiBoardInfo {
    name: RaspberryPiBoardType;
    processor: string;
    ram: string;
    gpioCount: number;
    hasWifi: boolean;
    hasBluetooth: boolean;
    hasEthernet: boolean;
    usbPorts: number;
    formFactor: 'full' | 'zero' | 'pico';
    voltage: string;
    isPico: boolean; // Pico is microcontroller, others are Linux SBC
}

export const RPI_BOARD_SPECS: Record<RaspberryPiBoardType, RaspberryPiBoardInfo> = {
    'Raspberry Pi 5': {
        name: 'Raspberry Pi 5',
        processor: 'Broadcom BCM2712 Quad-Core 2.4GHz',
        ram: '4/8 GB',
        gpioCount: 40,
        hasWifi: true,
        hasBluetooth: true,
        hasEthernet: true,
        usbPorts: 4,
        formFactor: 'full',
        voltage: '5V/3A',
        isPico: false
    },
    'Raspberry Pi 4B': {
        name: 'Raspberry Pi 4B',
        processor: 'Broadcom BCM2711 Quad-Core 1.8GHz',
        ram: '2/4/8 GB',
        gpioCount: 40,
        hasWifi: true,
        hasBluetooth: true,
        hasEthernet: true,
        usbPorts: 4,
        formFactor: 'full',
        voltage: '5V/3A',
        isPico: false
    },
    'Raspberry Pi 3B+': {
        name: 'Raspberry Pi 3B+',
        processor: 'Broadcom BCM2837B0 Quad-Core 1.4GHz',
        ram: '1 GB',
        gpioCount: 40,
        hasWifi: true,
        hasBluetooth: true,
        hasEthernet: true,
        usbPorts: 4,
        formFactor: 'full',
        voltage: '5V/2.5A',
        isPico: false
    },
    'Raspberry Pi Zero 2W': {
        name: 'Raspberry Pi Zero 2W',
        processor: 'Broadcom BCM2710A1 Quad-Core 1GHz',
        ram: '512 MB',
        gpioCount: 40,
        hasWifi: true,
        hasBluetooth: true,
        hasEthernet: false,
        usbPorts: 1,
        formFactor: 'zero',
        voltage: '5V/1A',
        isPico: false
    },
    'Raspberry Pi Zero W': {
        name: 'Raspberry Pi Zero W',
        processor: 'Broadcom BCM2835 Single-Core 1GHz',
        ram: '512 MB',
        gpioCount: 40,
        hasWifi: true,
        hasBluetooth: true,
        hasEthernet: false,
        usbPorts: 1,
        formFactor: 'zero',
        voltage: '5V/1A',
        isPico: false
    },
    'Raspberry Pi Pico': {
        name: 'Raspberry Pi Pico',
        processor: 'RP2040 Dual-Core 133MHz',
        ram: '264 KB SRAM',
        gpioCount: 26,
        hasWifi: false,
        hasBluetooth: false,
        hasEthernet: false,
        usbPorts: 1,
        formFactor: 'pico',
        voltage: '3.3V',
        isPico: true
    },
    'Raspberry Pi Pico W': {
        name: 'Raspberry Pi Pico W',
        processor: 'RP2040 Dual-Core 133MHz',
        ram: '264 KB SRAM',
        gpioCount: 26,
        hasWifi: true,
        hasBluetooth: true,
        hasEthernet: false,
        usbPorts: 1,
        formFactor: 'pico',
        voltage: '3.3V',
        isPico: true
    }
};

// ===== RASPBERRY PI COMPONENT TYPES =====
export enum RaspberryPiComponentType {
    // GPIO Basics
    GPIO_LED = 'GPIO_LED',
    GPIO_BUTTON = 'GPIO_BUTTON',
    GPIO_BUZZER = 'GPIO_BUZZER',
    GPIO_RELAY = 'GPIO_RELAY',
    RGB_LED = 'RGB_LED',
    WS2812_NEOPIXEL = 'WS2812_NEOPIXEL',

    // Environmental Sensors
    DHT_SENSOR = 'DHT_SENSOR',
    DS18B20 = 'DS18B20', // 1-Wire temp sensor
    BMP280 = 'BMP280', // Pressure/temp I2C
    BME280 = 'BME280', // Pressure/temp/humidity I2C
    BME680 = 'BME680', // Air quality sensor
    SHT31 = 'SHT31', // High precision temp/humidity
    AHT20 = 'AHT20', // Temperature/humidity
    CCS811 = 'CCS811', // CO2/VOC sensor

    // Motion & Position Sensors
    PIR_SENSOR = 'PIR_SENSOR',
    ULTRASONIC = 'ULTRASONIC',
    MPU6050 = 'MPU6050', // 6-axis accelerometer/gyro
    MPU9250 = 'MPU9250', // 9-axis IMU
    ADXL345 = 'ADXL345', // 3-axis accelerometer
    HMC5883L = 'HMC5883L', // Magnetometer/compass
    VL53L0X = 'VL53L0X', // Time-of-Flight distance
    VL53L1X = 'VL53L1X', // Long range ToF
    APDS9960 = 'APDS9960', // Gesture/proximity/color

    // Analog & ADC
    MCP3008 = 'MCP3008', // 8-channel ADC
    ADS1115 = 'ADS1115', // 16-bit ADC
    LDR = 'LDR', // Light Dependent Resistor
    SOIL_MOISTURE = 'SOIL_MOISTURE',
    IR_SENSOR = 'IR_SENSOR',
    GAS_SENSOR = 'GAS_SENSOR', // MQ series
    WATER_SENSOR = 'WATER_SENSOR',
    PH_SENSOR = 'PH_SENSOR',
    TDS_SENSOR = 'TDS_SENSOR', // Water quality

    // Motors & Actuators
    SERVO = 'SERVO',
    DC_MOTOR = 'DC_MOTOR',
    STEPPER = 'STEPPER',
    L298N = 'L298N', // Motor driver
    TB6612 = 'TB6612', // Motor driver
    PCA9685 = 'PCA9685', // 16-ch PWM servo driver

    // Displays
    SSD1306_OLED = 'SSD1306_OLED', // I2C OLED 128x64
    SH1106_OLED = 'SH1106_OLED', // I2C OLED 128x64
    LCD_I2C = 'LCD_I2C', // 16x2/20x4 LCD
    ST7735_TFT = 'ST7735_TFT', // SPI TFT 1.8"
    ILI9341_TFT = 'ILI9341_TFT', // SPI TFT 2.4"
    MAX7219_MATRIX = 'MAX7219_MATRIX', // LED matrix
    TM1637_7SEG = 'TM1637_7SEG', // 7-segment display
    E_PAPER = 'E_PAPER', // E-ink display

    // Camera & Imaging
    PI_CAMERA = 'PI_CAMERA', // Official Camera Module
    PI_CAMERA_HQ = 'PI_CAMERA_HQ', // HQ Camera
    USB_WEBCAM = 'USB_WEBCAM',
    AMG8833 = 'AMG8833', // Thermal camera 8x8

    // Audio
    MICROPHONE = 'MICROPHONE', // USB/I2S microphone
    I2S_MICROPHONE = 'I2S_MICROPHONE', // INMP441
    SPEAKER = 'SPEAKER', // Audio output
    I2S_AMP = 'I2S_AMP', // MAX98357A

    // Communication Modules
    RFID_RC522 = 'RFID_RC522', // SPI RFID reader
    PN532_NFC = 'PN532_NFC', // NFC reader/writer
    NRF24L01 = 'NRF24L01', // 2.4GHz radio
    HC12_RADIO = 'HC12_RADIO', // 433MHz radio
    LORA_SX1276 = 'LORA_SX1276', // LoRa transceiver
    GPS_MODULE = 'GPS_MODULE', // NEO-6M/NEO-M8N GPS
    BLUETOOTH_HC05 = 'BLUETOOTH_HC05', // UART Bluetooth
    ESP_WIFI = 'ESP_WIFI', // ESP8266/ESP32 as WiFi module
    SIM800_GSM = 'SIM800_GSM', // GSM/GPRS module
    A7670_LTE = 'A7670_LTE', // 4G LTE module

    // Input Devices
    KEYPAD = 'KEYPAD', // 4x4 matrix keypad
    ROTARY_ENCODER = 'ROTARY_ENCODER',
    JOYSTICK = 'JOYSTICK',
    TOUCH_SENSOR = 'TOUCH_SENSOR', // Capacitive touch
    LOAD_CELL_HX711 = 'LOAD_CELL_HX711', // Weight sensor

    // HATs & Expansion Boards
    SENSE_HAT = 'SENSE_HAT', // Official Sense HAT
    MOTOR_HAT = 'MOTOR_HAT', // Adafruit Motor HAT
    UNICORN_HAT = 'UNICORN_HAT', // LED matrix HAT
    EXPLORER_HAT = 'EXPLORER_HAT', // Pimoroni Explorer
    POE_HAT = 'POE_HAT', // Power over Ethernet

    // Power & Time
    RTC_DS3231 = 'RTC_DS3231', // Real Time Clock
    RTC_DS1307 = 'RTC_DS1307', // Basic RTC
    INA219 = 'INA219', // Power monitor
    INA226 = 'INA226', // High-side power monitor
    UPS_HAT = 'UPS_HAT', // Uninterruptible power

    // Industrial & Relay
    RELAY_MODULE = 'RELAY_MODULE', // Multi-channel relay
    SSR_RELAY = 'SSR_RELAY', // Solid state relay
    OPTOCOUPLER = 'OPTOCOUPLER', // Opto-isolated input

    // Cooling
    FAN = 'FAN', // Cooling fan
    FAN_PWM = 'FAN_PWM', // PWM controlled fan

    // AI & ML Accelerators (2024)
    AI_CAMERA = 'AI_CAMERA', // Sony IMX500 AI Camera
    AI_HAT_HAILO = 'AI_HAT_HAILO', // Hailo-8L 13/26 TOPS
    CORAL_TPU = 'CORAL_TPU', // Google Coral Edge TPU

    // Camera Module 3 Series
    CAMERA_MODULE_3 = 'CAMERA_MODULE_3', // 12MP HDR autofocus
    CAMERA_MODULE_3_WIDE = 'CAMERA_MODULE_3_WIDE', // Wide-angle
    CAMERA_MODULE_3_NOIR = 'CAMERA_MODULE_3_NOIR', // No IR filter

    // M.2/NVMe HATs (Pi 5)
    NVME_HAT = 'NVME_HAT', // M.2 NVMe SSD HAT
    NVME_HAT_DUAL = 'NVME_HAT_DUAL', // Dual NVMe for NAS

    // Additional Environmental Sensors
    SCD30 = 'SCD30', // CO2 sensor
    SCD40 = 'SCD40', // Compact CO2 sensor
    PMS5003 = 'PMS5003', // PM2.5 air quality
    PMSA003I = 'PMSA003I', // I2C PM2.5 sensor

    // Weather Station Sensors
    RAIN_GAUGE = 'RAIN_GAUGE', // Tipping bucket rain gauge
    ANEMOMETER = 'ANEMOMETER', // Wind speed sensor
    WIND_VANE = 'WIND_VANE', // Wind direction sensor
    UV_SENSOR = 'UV_SENSOR', // UV index sensor

    // Health/Biometric
    HEART_RATE = 'HEART_RATE', // MAX30102 pulse oximeter
    PULSE_OXIMETER = 'PULSE_OXIMETER', // SpO2 sensor

    // Audio HATs
    HIFI_DAC = 'HIFI_DAC', // HiFi audio DAC HAT
    HIFI_AMP = 'HIFI_AMP', // Amplifier HAT

    // Compute Module
    CM5_IO_BOARD = 'CM5_IO_BOARD', // Compute Module 5 IO

    // Generic
    GENERIC = 'GENERIC'
}


export interface RaspberryPiComponent {
    id: string;
    type: RaspberryPiComponentType;
    pin: number | string; // GPIO pin (BCM numbering)
    label: string;
    properties?: Record<string, unknown>;
}

export interface RaspberryPiWiringManifest {
    board: RaspberryPiBoardType;
    components: RaspberryPiComponent[];
}

// Supported Arduino/ESP Board Types
export type BoardType =
    | 'Arduino Uno'
    | 'Arduino Uno R4 Minima'
    | 'Arduino Uno R4 WiFi'
    | 'Arduino Nano'
    | 'Arduino Mega 2560'
    | 'Arduino Leonardo'
    | 'Arduino Pro Mini'
    | 'ESP32'
    | 'ESP8266'
    | 'Arduino MKR WiFi 1010';

// Board specifications for visualization
export interface BoardInfo {
    name: BoardType;
    microcontroller: string;
    clockSpeed: string;
    flashMemory: string;
    sram: string;
    eeprom?: string;
    digitalPins: number;
    analogPins: number;
    pwmPins: number;
    voltage: string;
    hasWifi: boolean;
    hasBluetooth: boolean;
    hasDAC?: boolean;
    hasCANBus?: boolean;
    hasHID?: boolean; // Human Interface Device (mouse/keyboard emulation)
    usbType?: 'USB-B' | 'USB-C' | 'Micro-USB';
    formFactor: 'standard' | 'nano' | 'mega' | 'esp';
}

export const BOARD_SPECS: Record<BoardType, BoardInfo> = {
    'Arduino Uno': {
        name: 'Arduino Uno',
        microcontroller: 'ATmega328P',
        clockSpeed: '16 MHz',
        flashMemory: '32 KB',
        sram: '2 KB',
        eeprom: '1 KB',
        digitalPins: 14,
        analogPins: 6,
        pwmPins: 6,
        voltage: '5V',
        hasWifi: false,
        hasBluetooth: false,
        hasDAC: false,
        hasCANBus: false,
        hasHID: false,
        usbType: 'USB-B',
        formFactor: 'standard'
    },
    'Arduino Uno R4 Minima': {
        name: 'Arduino Uno R4 Minima',
        microcontroller: 'Renesas RA4M1 (ARM Cortex-M4)',
        clockSpeed: '48 MHz',
        flashMemory: '256 KB',
        sram: '32 KB',
        eeprom: '8 KB',
        digitalPins: 14,
        analogPins: 6,
        pwmPins: 6,
        voltage: '5V',
        hasWifi: false,
        hasBluetooth: false,
        hasDAC: true, // 12-bit DAC on A0
        hasCANBus: true, // Requires external transceiver
        hasHID: true,
        usbType: 'USB-C',
        formFactor: 'standard'
    },
    'Arduino Uno R4 WiFi': {
        name: 'Arduino Uno R4 WiFi',
        microcontroller: 'Renesas RA4M1 + ESP32-S3',
        clockSpeed: '48 MHz',
        flashMemory: '256 KB',
        sram: '32 KB',
        eeprom: '8 KB',
        digitalPins: 14,
        analogPins: 6,
        pwmPins: 6,
        voltage: '5V',
        hasWifi: true,
        hasBluetooth: true, // Via ESP32-S3
        hasDAC: true,
        hasCANBus: true,
        hasHID: true,
        usbType: 'USB-C',
        formFactor: 'standard'
    },
    'Arduino Nano': {
        name: 'Arduino Nano',
        microcontroller: 'ATmega328P',
        clockSpeed: '16 MHz',
        flashMemory: '32 KB',
        sram: '2 KB',
        digitalPins: 14,
        analogPins: 8,
        pwmPins: 6,
        voltage: '5V',
        hasWifi: false,
        hasBluetooth: false,
        formFactor: 'nano'
    },
    'Arduino Mega 2560': {
        name: 'Arduino Mega 2560',
        microcontroller: 'ATmega2560',
        clockSpeed: '16 MHz',
        flashMemory: '256 KB',
        sram: '8 KB',
        digitalPins: 54,
        analogPins: 16,
        pwmPins: 15,
        voltage: '5V',
        hasWifi: false,
        hasBluetooth: false,
        formFactor: 'mega'
    },
    'Arduino Leonardo': {
        name: 'Arduino Leonardo',
        microcontroller: 'ATmega32U4',
        clockSpeed: '16 MHz',
        flashMemory: '32 KB',
        sram: '2.5 KB',
        digitalPins: 20,
        analogPins: 12,
        pwmPins: 7,
        voltage: '5V',
        hasWifi: false,
        hasBluetooth: false,
        formFactor: 'standard'
    },
    'Arduino Pro Mini': {
        name: 'Arduino Pro Mini',
        microcontroller: 'ATmega328P',
        clockSpeed: '8/16 MHz',
        flashMemory: '32 KB',
        sram: '2 KB',
        digitalPins: 14,
        analogPins: 6,
        pwmPins: 6,
        voltage: '3.3V/5V',
        hasWifi: false,
        hasBluetooth: false,
        formFactor: 'nano'
    },
    'ESP32': {
        name: 'ESP32',
        microcontroller: 'Tensilica LX6 Dual-Core',
        clockSpeed: '240 MHz',
        flashMemory: '4-16 MB',
        sram: '520 KB',
        digitalPins: 34,
        analogPins: 18,
        pwmPins: 16,
        voltage: '3.3V',
        hasWifi: true,
        hasBluetooth: true,
        formFactor: 'esp'
    },
    'ESP8266': {
        name: 'ESP8266',
        microcontroller: 'Tensilica L106',
        clockSpeed: '80/160 MHz',
        flashMemory: '4 MB',
        sram: '80 KB',
        digitalPins: 17,
        analogPins: 1,
        pwmPins: 4,
        voltage: '3.3V',
        hasWifi: true,
        hasBluetooth: false,
        formFactor: 'esp'
    },
    'Arduino MKR WiFi 1010': {
        name: 'Arduino MKR WiFi 1010',
        microcontroller: 'SAMD21 Cortex-M0+',
        clockSpeed: '48 MHz',
        flashMemory: '256 KB',
        sram: '32 KB',
        digitalPins: 8,
        analogPins: 7,
        pwmPins: 13,
        voltage: '3.3V',
        hasWifi: true,
        hasBluetooth: false,
        formFactor: 'nano'
    }
};

export enum ComponentType {
    // Basics
    LED = 'LED',
    RGB_LED = 'RGB_LED',
    BUTTON = 'BUTTON',
    POTENTIOMETER = 'POTENTIOMETER',
    BUZZER = 'BUZZER',
    SPEAKER = 'SPEAKER',
    RELAY = 'RELAY',

    // Sensors
    SENSOR_ULTRASONIC = 'SENSOR_ULTRASONIC',
    SENSOR_TEMP = 'SENSOR_TEMP', // DS18B20 etc
    SENSOR_DHT = 'SENSOR_DHT',
    SENSOR_WATER = 'SENSOR_WATER',
    SENSOR_PH = 'SENSOR_PH',
    SENSOR_HEART = 'SENSOR_HEART',
    SENSOR_GAS = 'SENSOR_GAS',
    LDR = 'LDR',
    JOYSTICK = 'JOYSTICK',
    PIR = 'PIR', // Motion sensor
    IR_SENSOR = 'IR_SENSOR', // IR receiver/transmitter

    // Modules
    MODULE_WIFI = 'MODULE_WIFI', // ESP8266/ESP32
    MODULE_SD = 'MODULE_SD',

    // Motors
    SERVO = 'SERVO',
    STEPPER = 'STEPPER',
    VIBRATION_MOTOR = 'VIBRATION_MOTOR',
    MOTOR_DRIVER = 'MOTOR_DRIVER', // L298N, L293D
    DC_MOTOR = 'DC_MOTOR', // Simple DC motor

    // Displays
    LCD = 'LCD',
    OLED = 'OLED', // SSD1306 etc
    SEVEN_SEGMENT = 'SEVEN_SEGMENT',
    LED_MATRIX = 'LED_MATRIX',
    NEOPIXEL = 'NEOPIXEL',

    // Input
    KEYPAD = 'KEYPAD', // 4x4 keypad
    ROTARY_ENCODER = 'ROTARY_ENCODER',
    TOUCH_SENSOR = 'TOUCH_SENSOR', // Capacitive touch

    // Advanced Sensors
    SENSOR_SOUND = 'SENSOR_SOUND', // Sound/microphone sensor
    SENSOR_SOIL = 'SENSOR_SOIL', // Soil moisture sensor
    SENSOR_PRESSURE = 'SENSOR_PRESSURE', // BMP180/BME280 pressure sensor
    ACCELEROMETER = 'ACCELEROMETER', // MPU6050, ADXL345
    SENSOR_COLOR = 'SENSOR_COLOR', // TCS3200 color sensor
    SENSOR_FLAME = 'SENSOR_FLAME', // Flame detector
    SENSOR_VIBRATION = 'SENSOR_VIBRATION', // SW-420 vibration sensor
    SENSOR_RAIN = 'SENSOR_RAIN', // Rain detection sensor
    SENSOR_CURRENT = 'SENSOR_CURRENT', // ACS712 current sensor
    SENSOR_VOLTAGE = 'SENSOR_VOLTAGE', // Voltage divider sensor
    SENSOR_TILT = 'SENSOR_TILT', // Tilt/mercury switch

    // Advanced Modules
    MODULE_GPS = 'MODULE_GPS', // NEO-6M GPS
    MODULE_RFID = 'MODULE_RFID', // MFRC522 RFID reader
    MODULE_BLUETOOTH = 'MODULE_BLUETOOTH', // HC-05/HC-06
    MODULE_RTC = 'MODULE_RTC', // DS3231 Real Time Clock
    MODULE_FINGERPRINT = 'MODULE_FINGERPRINT', // FPM10A fingerprint
    MODULE_GSM = 'MODULE_GSM', // SIM800L/SIM900 GSM
    MODULE_LORA = 'MODULE_LORA', // LoRa transceiver
    MODULE_NRF24 = 'MODULE_NRF24', // nRF24L01 2.4GHz radio
    MODULE_ETHERNET = 'MODULE_ETHERNET', // W5100/W5500 Ethernet
    MODULE_CAN = 'MODULE_CAN', // MCP2515 CAN bus
    MODULE_MP3 = 'MODULE_MP3', // DFPlayer Mini MP3

    // 2024/2025 Trending Components
    ESP32_CAM = 'ESP32_CAM', // ESP32 Camera module OV2640
    THERMAL_CAMERA = 'THERMAL_CAMERA', // MLX90640 thermal imaging
    AI_MODULE = 'AI_MODULE', // Edge AI accelerator (Coral, K210)
    SENSOR_AIR_QUALITY = 'SENSOR_AIR_QUALITY', // BME680/CCS811 air quality
    SENSOR_CO2 = 'SENSOR_CO2', // MH-Z19 CO2 sensor
    SENSOR_LIDAR = 'SENSOR_LIDAR', // TFMini/RPLIDAR distance
    SENSOR_TOF = 'SENSOR_TOF', // VL53L0X Time-of-Flight
    LOAD_CELL = 'LOAD_CELL', // HX711 weight sensor
    IMU_9DOF = 'IMU_9DOF', // 9-axis IMU (BNO055)
    GESTURE_SENSOR = 'GESTURE_SENSOR', // APDS-9960 gesture/proximity
    UV_SENSOR = 'UV_SENSOR', // UV light sensor
    ENCODER_MOTOR = 'ENCODER_MOTOR', // DC motor with encoder

    // Advanced Displays
    TFT_DISPLAY = 'TFT_DISPLAY', // TFT LCD color display
    E_PAPER = 'E_PAPER', // E-ink display
    TOUCH_DISPLAY = 'TOUCH_DISPLAY', // Touch TFT

    // Shields (Stacked Modules)
    SHIELD_MOTOR = 'SHIELD_MOTOR', // L293D/L298 motor shield
    SHIELD_ETHERNET = 'SHIELD_ETHERNET', // Ethernet W5100 shield
    SHIELD_RELAY = 'SHIELD_RELAY', // Multi-relay shield
    SHIELD_SENSOR = 'SHIELD_SENSOR', // Sensor expansion shield
    SHIELD_LCD = 'SHIELD_LCD', // LCD Keypad shield

    // Power Components
    BATTERY = 'BATTERY', // Li-Po, Li-ion, AA etc
    SOLAR_PANEL = 'SOLAR_PANEL', // Solar cell
    VOLTAGE_REGULATOR = 'VOLTAGE_REGULATOR', // Buck/Boost converter

    // ========== 50 NEW COMPONENTS ==========

    // Actuators & Output Devices
    SOLENOID = 'SOLENOID', // Solenoid valve/lock
    PUMP = 'PUMP', // Water/liquid pump
    FAN = 'FAN', // Cooling fan
    HEATER = 'HEATER', // Heating element
    LINEAR_ACTUATOR = 'LINEAR_ACTUATOR', // Linear motion actuator
    ELECTROMAGNET = 'ELECTROMAGNET', // Magnetic actuator
    PELTIER = 'PELTIER', // TEC thermoelectric cooler
    AIR_COMPRESSOR = 'AIR_COMPRESSOR', // Pneumatic compressor
    LASER_MODULE = 'LASER_MODULE', // Laser diode
    FOG_MACHINE = 'FOG_MACHINE', // Fog/smoke generator
    ALARM_SIREN = 'ALARM_SIREN', // Alarm horn/siren
    MAGNETIC_LOCK = 'MAGNETIC_LOCK', // Electromagnetic door lock

    // LED Variants
    LED_STRIP = 'LED_STRIP', // WS2812B/RGB strip
    LED_RING = 'LED_RING', // NeoPixel ring
    LED_BAR = 'LED_BAR', // LED bar graph
    LED_FILAMENT = 'LED_FILAMENT', // Retro filament LED
    LASER_CROSSHAIR = 'LASER_CROSSHAIR', // Laser pointer/crosshair

    // Additional Sensors
    FLEX_SENSOR = 'FLEX_SENSOR', // Flex/bend sensor
    FORCE_SENSOR = 'FORCE_SENSOR', // FSR force sensitive resistor
    THERMISTOR = 'THERMISTOR', // NTC/PTC thermistor
    HALL_SENSOR = 'HALL_SENSOR', // Hall effect sensor
    MAGNETIC_SENSOR = 'MAGNETIC_SENSOR', // Reed switch
    ENCODER_OPTICAL = 'ENCODER_OPTICAL', // Optical encoder
    PROXIMITY_SENSOR = 'PROXIMITY_SENSOR', // Inductive proximity
    LASER_SENSOR = 'LASER_SENSOR', // Laser break beam
    BARCODE_SCANNER = 'BARCODE_SCANNER', // Barcode/QR reader
    TDS_SENSOR = 'TDS_SENSOR', // Total dissolved solids
    TURBIDITY_SENSOR = 'TURBIDITY_SENSOR', // Water clarity
    FLOW_SENSOR = 'FLOW_SENSOR', // Water/gas flow meter
    LEVEL_SENSOR = 'LEVEL_SENSOR', // Float/level sensor
    LOAD_SENSOR = 'LOAD_SENSOR', // Strain gauge
    SHOCK_SENSOR = 'SHOCK_SENSOR', // Impact/shock detector
    ALCOHOL_SENSOR = 'ALCOHOL_SENSOR', // MQ-3 breathalyzer
    SMOKE_SENSOR = 'SMOKE_SENSOR', // MQ-2 smoke detector

    // Communication Modules
    ZIGBEE = 'ZIGBEE', // Zigbee transceiver (XBee)
    ZWAVE = 'ZWAVE', // Z-Wave module
    THREAD = 'THREAD', // Thread/Matter module
    RS485 = 'RS485', // RS485 transceiver
    RS232 = 'RS232', // RS232 serial
    I2S_AUDIO = 'I2S_AUDIO', // I2S audio interface
    DAC_AUDIO = 'DAC_AUDIO', // Digital to analog audio
    VOICE_MODULE = 'VOICE_MODULE', // Voice recognition

    // Display Variants
    VFD_DISPLAY = 'VFD_DISPLAY', // Vacuum fluorescent display
    NIXIE_TUBE = 'NIXIE_TUBE', // Retro nixie tube
    HUD_DISPLAY = 'HUD_DISPLAY', // Heads-up display
    MATRIX_PANEL = 'MATRIX_PANEL', // Large LED panel (P10)
    SEGMENT_DISPLAY = 'SEGMENT_DISPLAY', // Multi-digit 7-segment

    // Industrial/Professional
    PLC_MODULE = 'PLC_MODULE', // PLC expansion
    SSR_RELAY = 'SSR_RELAY', // Solid state relay
    CONTACTOR = 'CONTACTOR', // High power contactor
    CIRCUIT_BREAKER = 'CIRCUIT_BREAKER', // Resettable breaker
    FUSE = 'FUSE', // Fuse holder
    TERMINAL_BLOCK = 'TERMINAL_BLOCK', // Screw terminal

    // Fallback
    GENERIC = 'GENERIC'
}

export interface ArduinoComponent {
    id: string;
    type: ComponentType;
    pin: number | string; // Primary pin. For complex comps, others are in properties.
    label: string;
    properties?: Record<string, unknown>; // e.g., { secondaryPins: [10,11], color: 'red' }
}

export interface WiringManifest {
    board: BoardType;
    components: ArduinoComponent[];
}

export interface SimulationFrame {
    timestamp: number; // in ms
    pinStates: Record<string, number>; // e.g., { "13": 1, "A0": 450 }
    serialOutput: string | null; // Text to append to console
    log: string | null; // System debug log
}

export interface SimulationResult {
    frames: SimulationFrame[];
    success: boolean;
    error?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    isError?: boolean;
    hasChanges?: boolean; // Indicates if this message has associated code changes
}

/**
 * Enhanced component specifications for physics and visual simulation
 */
export interface ComponentSpecs {
    voltage?: string;
    current?: string;
    maxCurrent?: string;
    interface?: string[];
    i2cAddress?: string | string[];
    resolution?: string;
    visualColor?: string;
    physicsModel?: 'LED' | 'MOTOR' | 'SENSOR' | 'DISPLAY' | 'ACTUATOR' | 'PASSIVE';
    forwardVoltage?: number;
    frequency?: string;
    range?: string;
    accuracy?: string;
    description?: string;
}

export const COMPONENT_SPECS: Partial<Record<ComponentType, ComponentSpecs>> = {
    [ComponentType.LED]: { voltage: '2.0-3.3V', current: '20mA', forwardVoltage: 2.0, visualColor: '#ef4444', physicsModel: 'LED' },
    [ComponentType.OLED]: { voltage: '3.3-5V', current: '20mA', interface: ['I2C'], i2cAddress: ['0x3C', '0x3D'], resolution: '128x64', physicsModel: 'DISPLAY' },
    [ComponentType.SERVO]: { voltage: '4.8-6V', current: '500mA', maxCurrent: '1A', physicsModel: 'MOTOR' }

};
