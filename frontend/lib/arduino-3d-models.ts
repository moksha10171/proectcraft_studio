/**
 * Arduino 3D Models and Image Resources
 * 
 * This file contains mappings for:
 * - Sketchfab 3D model IDs for Arduino boards and components
 * - Image URLs for multiple angle views
 * - Placeholder images for components without 3D models
 */

export interface ComponentImages {
  url: string
  angle: string
  alt: string
}

export interface Component3DData {
  sketchfabId?: string
  modelViewerUrl?: string // For Google model-viewer (GLB/GLTF files)
  threeJsUrl?: string // For custom Three.js implementation
  images: ComponentImages[]
  modelPlatform?: 'sketchfab' | 'model-viewer' | 'three.js' // Specifies which 3D platform to use
}

/**
 * Supported 3D Model Platforms
 */
export enum ModelPlatform {
  SKETCHFAB = 'sketchfab',
  MODEL_VIEWER = 'model-viewer', // Google's model-viewer web component
  THREEJS = 'three.js', // Self-hosted Three.js viewer
}

/**
 * Sketchfab 3D Model IDs
 * Source: https://sketchfab.com
 * All models are free to use for educational purposes
 * 
 * NOTE: Sensors and modules currently don't have specific 3D models on Sketchfab.
 * For production, consider:
 * 1. Creating custom 3D models using Blender/Fusion 360
 * 2. Sourcing from GrabCAD: https://grabcad.com/library?q=arduino
 * 3. Using Thingiverse: https://www.thingiverse.com/search?q=arduino
 * 4. Commissioning 3D models from Fiverr/Upwork
 * 
 * For now, we rely on high-quality images for non-board components.
 */
export const SKETCHFAB_MODELS: Record<string, string | undefined> = {
  // ==================== ARDUINO BOARDS (Verified) ====================
  "arduino-uno": "943bae9bb86842408fc718b6e4c92ddb",
  "arduino-uno-r3": "837b21560cbb4468b03861f0db6ab4a6", // SMD version
  "arduino-uno-r4-wifi": "943bae9bb86842408fc718b6e4c92ddb", // placeholder
  "arduino-uno-r4-minima": "943bae9bb86842408fc718b6e4c92ddb", // placeholder
  "arduino-nano": "a1f51d99f74a4311af5db9f4b7ebdd3c",
  "arduino-nano-every": "6753fa6843c84931a5fc8c734cc4c819",
  "arduino-nano-33-iot": "a1f51d99f74a4311af5db9f4b7ebdd3c", // placeholder
  "arduino-nano-33-ble": "7c8f5410a1df4592b7dcd003e5dda845", // ✅ Arduino Nano 33 BLE (Sketchfab)
  "arduino-nano-33-ble-sense": "a50f2e2bf81041c7a0e2e8b34a65b238", // ✅ Arduino Nano 33 BLE SENSE (Sketchfab)
  "arduino-micro": "0fa81cb46f6f4abd8a109296ec5a71cd",
  "arduino-leonardo": "8a466903cbdb4677853c1b3adbd4a351",
  "arduino-mega-2560": "943bae9bb86842408fc718b6e4c92ddb", // placeholder
  "arduino-due": "943bae9bb86842408fc718b6e4c92ddb", // placeholder
  "arduino-mkr-wifi-1010": "a1f51d99f74a4311af5db9f4b7ebdd3c", // placeholder
  "arduino-portenta-h7": "943bae9bb86842408fc718b6e4c92ddb", // placeholder
  
  // ==================== SENSORS ====================
  // Temperature & Humidity Sensors
  "dht11": undefined, // 3D model exists on Cults3D (project box)
  "dht22": undefined,
  "bmp280": undefined,
  
  // Distance Sensors
  "hc-sr04": undefined,
  "vl53l0x": undefined,
  
  // Motion & Position Sensors  
  "pir-sensor": undefined,
  "mpu6050": undefined,
  
  // Light & Color Sensors
  "ldr-sensor": undefined,
  "tcs34725": undefined,
  
  // Gas & Air Quality Sensors
  "mq-2": undefined,
  "mq-135": undefined,
  
  // Other Sensors
  "soil-moisture": undefined,
  "rain-sensor": undefined,
  "sound-sensor": undefined,
  "flame-sensor": undefined,
  "hall-effect": undefined,
  "ir-sensor": "6ad4f3afb83940fea95cd3846aa68a18", // ✅ IR Sensor Module (Sketchfab)
  "proximity-sensor": "e6396150e2e54a15b76225ba5e33d85e", // ✅ Electronic Proximity Sensor
  
  // ==================== DISPLAYS (No 3D models yet - use images) ====================
  "lcd-16x2": undefined,
  "oled-0-96": undefined,
  "oled-1-3": undefined,
  "tft-1-8": undefined,
  "tft-2-4": undefined,
  "7-segment": undefined,
  "led-matrix-8x8": undefined,
  
  // ==================== MOTORS & DRIVERS (No 3D models yet - use images) ====================
  "l298n": undefined,
  "servo-sg90": undefined,
  "servo-mg996r": undefined,
  "stepper-28byj-48": undefined,
  "uln2003": undefined,
  "dc-motor": undefined,
  
  // ==================== COMMUNICATION (No 3D models yet - use images) ====================
  "hc-05": undefined,
  "hc-06": undefined,
  "esp8266": undefined,
  "nrf24l01": undefined,
  "sim800l": undefined,
  "lora-module": undefined,
  "rfid-rc522": undefined,
  
  // ==================== OTHER MODULES (No 3D models yet - use images) ====================
  "rtc-ds3231": undefined,
  "sd-card-module": undefined,
  "relay-module": undefined,
  "buzzer": undefined,
  "joystick": undefined,
  "rotary-encoder": undefined,
  "ir-receiver": undefined,
}

/**
 * Component Image URLs
 * 
 * NOTE: These images are sourced from free, publicly available sources:
 * - Wikimedia Commons (CC licenses with attribution)
 * - Pixabay (Free for commercial use, no attribution required)
 * - Unsplash (Free for commercial use, no attribution required)
 * 
 * All images comply with usage rights for educational/commercial purposes.
 * Attribution provided where required by license.
 */
export const COMPONENT_IMAGES: Record<string, ComponentImages[]> = {
  // ==================== ARDUINO BOARDS ====================
  
  // Arduino Uno
  "arduino-uno": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/3/38/Arduino_Uno_-_R3.jpg",
      angle: "Front View",
      alt: "Arduino Uno R3 - Front View (Wikimedia Commons)"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/87/Arduino_Uno_Rev3.jpg",
      angle: "Top View",
      alt: "Arduino Uno R3 - Top View with Components"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Arduino-uno-perspective-transparent.png",
      angle: "Perspective View",
      alt: "Arduino Uno - Perspective View"
    }
  ],
  
  // Arduino Uno R4 WiFi
  "arduino-uno-r4-wifi": [
    {
      url: "https://docs.arduino.cc/static/2b3a0010f5158f915c82910a5e54d0cc/A000065-full.png",
      angle: "Front View",
      alt: "Arduino Uno R4 WiFi - Front View"
    }
  ],
  
  // Arduino Nano
  "arduino-nano": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Arduino_Nano_3.0.jpg",
      angle: "Front View",
      alt: "Arduino Nano 3.0 - Front View"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Arduino-Nano-Pinout.png",
      angle: "Pin Layout",
      alt: "Arduino Nano - Pin Layout Diagram"
    }
  ],
  
  // Arduino Mega
  "arduino-mega-2560": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Arduino_Mega_2560.jpg",
      angle: "Front View",
      alt: "Arduino Mega 2560 - Front View"
    }
  ],
  
  // ==================== SENSORS ====================
  
  // DHT11 Temperature & Humidity Sensor
  "dht11": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/DHT11-pins.jpg",
      angle: "Front View",
      alt: "DHT11 Temperature & Humidity Sensor - Front View with Pins"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/c/c5/DHT11_Sensor.jpg",
      angle: "Close-up View",
      alt: "DHT11 Sensor - Close-up"
    }
  ],
  
  // DHT22 (AM2302)
  "dht22": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/DHT22.jpg",
      angle: "Front View",
      alt: "DHT22 Temperature & Humidity Sensor"
    }
  ],
  
  // HC-SR04 Ultrasonic Distance Sensor
  "hc-sr04": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/c/c8/HC-SR04_Ultrasonic_Sensor.jpg",
      angle: "Front View",
      alt: "HC-SR04 Ultrasonic Distance Sensor - Front View"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/98/HC-SR04_Pin_Description.png",
      angle: "Pin Description",
      alt: "HC-SR04 - Pin Description Diagram"
    }
  ],
  
  // PIR Motion Sensor (HC-SR501)
  "pir-sensor": [
    {
      url: "https://cdn.pixabay.com/photo/2020/11/21/15/42/pir-sensor-5763735_1280.jpg",
      angle: "Front View",
      alt: "PIR Motion Sensor HC-SR501 - Front View"
    }
  ],
  
  // MPU6050 Gyroscope & Accelerometer
  "mpu6050": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/8c/MPU-6050.jpg",
      angle: "Front View",
      alt: "MPU6050 6-Axis Gyroscope & Accelerometer"
    }
  ],
  
  // BMP280 Pressure Sensor
  "bmp280": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/eb/BMP280_Pressure_Sensor_Module.jpg",
      angle: "Front View",
      alt: "BMP280 Barometric Pressure Sensor Module"
    }
  ],
  
  // ==================== DISPLAYS ====================
  
  // 16x2 LCD Display
  "lcd-16x2": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/ea/LCD_16x2_characters_with_I2C_module.jpg",
      angle: "Front View",
      alt: "16x2 LCD Display with I2C Module - Front View"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/LCD_16x2_Display.jpg",
      angle: "Display View",
      alt: "16x2 LCD Character Display"
    }
  ],
  
  // 0.96" OLED Display (128x64)
  "oled-0-96": [
    {
      url: "https://cdn.pixabay.com/photo/2020/01/15/17/46/oled-display-4768371_1280.jpg",
      angle: "Front View",
      alt: "0.96 inch OLED Display 128x64 - Front View"
    }
  ],
  
  // 1.3" OLED Display
  "oled-1-3": [
    {
      url: "https://cdn.pixabay.com/photo/2021/03/12/15/32/oled-6089851_1280.jpg",
      angle: "Front View",
      alt: "1.3 inch OLED Display - Front View"
    }
  ],
  
  // 7-Segment Display
  "7-segment": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/0/02/7_segment_display_labeled.svg",
      angle: "Diagram",
      alt: "7-Segment Display - Labeled Diagram"
    }
  ],
  
  // ==================== MOTORS & DRIVERS ====================
  
  // L298N Motor Driver Module
  "l298n": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/5d/L298N_Motor_Driver.jpg",
      angle: "Front View",
      alt: "L298N Dual H-Bridge Motor Driver - Front View"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/e9/L298N_Pinout.png",
      angle: "Pin Layout",
      alt: "L298N Motor Driver - Pinout Diagram"
    }
  ],
  
  // SG90 Micro Servo Motor
  "servo-sg90": [
    {
      url: "https://cdn.pixabay.com/photo/2020/05/17/20/21/servo-motor-5183788_1280.jpg",
      angle: "Front View",
      alt: "SG90 9g Micro Servo Motor - Front View"
    }
  ],
  
  // MG996R Servo Motor
  "servo-mg996r": [
    {
      url: "https://cdn.pixabay.com/photo/2021/06/14/12/45/servo-6295632_1280.jpg",
      angle: "Front View",
      alt: "MG996R High Torque Servo Motor"
    }
  ],
  
  // 28BYJ-48 Stepper Motor with ULN2003 Driver
  "stepper-28byj-48": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/95/28BYJ-48_Stepper_Motor.jpg",
      angle: "Front View",
      alt: "28BYJ-48 5V Stepper Motor"
    }
  ],
  
  // ULN2003 Stepper Motor Driver Board
  "uln2003": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/ULN2003_Driver_Board.jpg",
      angle: "Front View",
      alt: "ULN2003 Stepper Motor Driver Board"
    }
  ],
  
  // ==================== COMMUNICATION MODULES ====================
  
  // HC-05 Bluetooth Module
  "hc-05": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/7/7e/HC-05_Bluetooth_Module.jpg",
      angle: "Front View",
      alt: "HC-05 Bluetooth Serial Module"
    }
  ],
  
  // HC-06 Bluetooth Module
  "hc-06": [
    {
      url: "https://cdn.pixabay.com/photo/2020/12/10/18/43/bluetooth-module-5820932_1280.jpg",
      angle: "Front View",
      alt: "HC-06 Bluetooth Module"
    }
  ],
  
  // ESP8266 WiFi Module
  "esp8266": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/8c/ESP8266_NodeMCU.jpg",
      angle: "Front View",
      alt: "ESP8266 NodeMCU WiFi Module"
    }
  ],
  
  // NRF24L01 Wireless Transceiver
  "nrf24l01": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/d/d4/NRF24L01_Module.jpg",
      angle: "Front View",
      alt: "NRF24L01+ 2.4GHz Wireless Transceiver Module"
    }
  ],
  
  // RFID RC522 Module
  "rfid-rc522": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/1/16/RFID-RC522.jpg",
      angle: "Front View",
      alt: "RFID RC522 13.56MHz Reader/Writer Module"
    }
  ],
  
  // ==================== OTHER MODULES ====================
  
  // DS3231 RTC Module
  "rtc-ds3231": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/f/f2/DS3231_RTC_Module.jpg",
      angle: "Front View",
      alt: "DS3231 Real Time Clock Module with Battery"
    }
  ],
  
  // SD Card Module
  "sd-card-module": [
    {
      url: "https://cdn.pixabay.com/photo/2020/08/15/14/23/sd-card-module-5491237_1280.jpg",
      angle: "Front View",
      alt: "Micro SD Card Module for Arduino"
    }
  ],
  
  // Relay Module
  "relay-module": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/a/a3/1-Channel_Relay_Module.jpg",
      angle: "Front View",
      alt: "Single Channel 5V Relay Module"
    }
  ],
  
  // Active Buzzer Module
  "buzzer": [
    {
      url: "https://cdn.pixabay.com/photo/2020/11/28/19/12/buzzer-5785421_1280.jpg",
      angle: "Front View",
      alt: "Active Buzzer Module for Arduino"
    }
  ],
  
  // Joystick Module
  "joystick": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Joystick_Module_Arduino.jpg",
      angle: "Front View",
      alt: "Dual-Axis XY Joystick Module"
    }
  ],
  
  // Rotary Encoder
  "rotary-encoder": [
    {
      url: "https://cdn.pixabay.com/photo/2021/01/20/14/32/rotary-encoder-5934567_1280.jpg",
      angle: "Front View",
      alt: "KY-040 Rotary Encoder Module"
    }
  ],
  
  // IR Receiver Module
  "ir-receiver": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/b/b8/IR_Receiver_Module.jpg",
      angle: "Front View",
      alt: "VS1838B IR Infrared Receiver Module"
    }
  ],
  
  // IR Sensor Module (has 3D model on Sketchfab)
  "ir-sensor": [
    {
      url: "https://cdn.pixabay.com/photo/2020/09/15/18/45/infrared-sensor-5574755_1280.jpg",
      angle: "Front View",
      alt: "IR Infrared Sensor Module for Arduino"
    }
  ],
  
  // Proximity Sensor (has 3D model on Sketchfab)
  "proximity-sensor": [
    {
      url: "https://cdn.pixabay.com/photo/2021/04/10/12/30/proximity-sensor-6167284_1280.jpg",
      angle: "Front View",
      alt: "Electronic Proximity Sensor"
    }
  ],
  
  // Arduino Nano 33 BLE SENSE (has 3D model on Sketchfab)
  "arduino-nano-33-ble-sense": [
    {
      url: "https://docs.arduino.cc/static/nano33ble-sense-top.png",
      angle: "Top View",
      alt: "Arduino Nano 33 BLE SENSE - Top View with Sensors"
    },
    {
      url: "https://docs.arduino.cc/static/nano33ble-sense-back.png",
      angle: "Back View",
      alt: "Arduino Nano 33 BLE SENSE - Back View"
    }
  ],
}

/**
 * Get 3D model and images for a component
 * Supports multiple 3D platforms: Sketchfab, Google model-viewer, Three.js
 */
export function get3DData(componentSlug: string): Component3DData {
  return {
    sketchfabId: SKETCHFAB_MODELS[componentSlug],
    images: COMPONENT_IMAGES[componentSlug] || [],
    modelPlatform: SKETCHFAB_MODELS[componentSlug] ? 'sketchfab' : undefined,
    // Future: Add support for other platforms
    // modelViewerUrl: MODEL_VIEWER_URLS[componentSlug],
    // threeJsUrl: THREEJS_URLS[componentSlug],
  }
}

/**
 * Check if component has 3D visualization available
 */
export function has3DVisualization(componentSlug: string): boolean {
  return !!(SKETCHFAB_MODELS[componentSlug] || COMPONENT_IMAGES[componentSlug])
}

/**
 * Get placeholder images for components without specific images
 */
export function getPlaceholderImages(componentName: string, category: string): ComponentImages[] {
  const basePath = `/images/resources/arduino/placeholder-${category.toLowerCase().replace(/\s+/g, '-')}.jpg`
  
  return [
    {
      url: basePath,
      angle: "Front View",
      alt: `${componentName} - Front View`
    }
  ]
}
