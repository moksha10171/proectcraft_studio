/**
 * ESP32 3D Models and Image Resources
 * 
 * This file contains mappings for:
 * - Sketchfab 3D model IDs for ESP32/ESP8266 boards and modules
 * - Image URLs for multiple angle views
 * - Support for multiple 3D platforms
 */

export interface ComponentImages {
  url: string
  angle: string
  alt: string
}

export interface ESP323DData {
  sketchfabId?: string
  modelViewerUrl?: string
  threeJsUrl?: string
  images: ComponentImages[]
  modelPlatform?: 'sketchfab' | 'model-viewer' | 'three.js'
}

/**
 * Sketchfab 3D Model IDs for ESP32/ESP8266 Components
 * Source: https://sketchfab.com
 * All models are free to use for educational purposes
 * 
 * Models found from web search on January 12, 2026:
 * - ESP32 WROOM-32: af0851c326ef4cbaa42439f801acbe98
 * - ESP32-CAM: 7d7a983f89734c3dbf4bd7ceb06be00f
 * - ESP32 HikeBuddy: 4069f62a5cc84da8bccbfa1ace8c41c7
 * - ESP32 Handheld: 28dae4d59ab94c3898bda0075ed2dab0
 */
export const ESP32_SKETCHFAB_MODELS: Record<string, string | undefined> = {
  // ==================== ESP32 BOARDS ====================
  
  // ESP32 Development Boards
  "esp32-devkit-v1": "af0851c326ef4cbaa42439f801acbe98", // ✅ ESP32 WROOM-32 (Sketchfab)
  "esp32-c3-supermini": undefined, // Too new/compact
  "esp32-s3-devkit": undefined,
  "esp32-c6-devkit": undefined,
  
  // ESP32 Camera Boards
  "esp32-cam": "7d7a983f89734c3dbf4bd7ceb06be00f", // ✅ ESP32-CAM (Sketchfab)
  "esp32-cam-mb": undefined, // Camera with MB programmer
  
  // ESP32 Specialized
  "esp32-pico-kit": undefined,
  "esp32-wrover-kit": undefined,
  
  // ESP8266 Boards
  "nodemcu-esp8266": undefined,
  "wemos-d1-mini": undefined,
  "esp-01": undefined,
  "esp-12e": undefined,
  "esp-12f": undefined,
  
  // ==================== ESP32 MODULES ====================
  "esp32-wroom-32": "af0851c326ef4cbaa42439f801acbe98", // ✅ WROOM-32 Module (Sketchfab)
  "esp32-wrover": undefined,
  "esp32-s3-wroom": undefined,
  "esp32-c3-mini": undefined,
  "esp8266-12e-module": undefined,
}

/**
 * ESP32 Component Image URLs
 * 
 * Sources:
 * - Wikimedia Commons (CC licenses with attribution)
 * - Pixabay (Free for commercial use, no attribution required)
 * - ESP32 Official Documentation
 */
export const ESP32_IMAGES: Record<string, ComponentImages[]> = {
  // ==================== ESP32 BOARDS ====================
  
  // ESP32 DevKit V1 (has 3D model)
  "esp32-devkit-v1": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/4/44/ESP32_Dev_Board.jpg",
      angle: "Top View",
      alt: "ESP32 DevKit V1 - Top View with Pinout"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/2/20/ESP-WROOM-32_Dev_Board.jpg",
      angle: "Perspective View",
      alt: "ESP32 WROOM-32 Development Board"
    },
    {
      url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/_images/esp32-devkitC-v4-pinout.png",
      angle: "Pin Layout",
      alt: "ESP32 DevKit - Complete Pinout Diagram"
    }
  ],
  
  // ESP32-C3 SuperMini
  "esp32-c3-supermini": [
    {
      url: "https://cdn.pixabay.com/photo/2023/09/15/12/30/esp32-c3-8255123_1280.jpg",
      angle: "Top View",
      alt: "ESP32-C3 SuperMini - Ultra-compact Board"
    }
  ],
  
  // ESP32-S3 DevKit
  "esp32-s3-devkit": [
    {
      url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/_images/ESP32-S3_DevKitC-1_pinlayout.jpg",
      angle: "Pin Layout",
      alt: "ESP32-S3 DevKitC-1 - Pinout Diagram"
    }
  ],
  
  // ESP32-CAM (has 3D model)
  "esp32-cam": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/e9/ESP32-CAM.jpg",
      angle: "Front View",
      alt: "ESP32-CAM - With OV2640 Camera"
    },
    {
      url: "https://cdn.pixabay.com/photo/2020/08/20/14/45/esp32-cam-5503049_1280.jpg",
      angle: "Perspective View",
      alt: "ESP32-CAM Module - Camera Side"
    }
  ],
  
  // ESP32 Pico Kit
  "esp32-pico-kit": [
    {
      url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/_images/esp32-pico-kit-v4.1.jpg",
      angle: "Top View",
      alt: "ESP32-PICO-KIT V4.1 Development Board"
    }
  ],
  
  // ==================== ESP8266 BOARDS ====================
  
  // NodeMCU ESP8266
  "nodemcu-esp8266": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/7/7e/NodeMCU_DEVKIT_1.0.jpg",
      angle: "Top View",
      alt: "NodeMCU ESP8266 Development Board"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/1/1a/NodeMCU_Pinout.png",
      angle: "Pin Layout",
      alt: "NodeMCU ESP8266 - Pinout Diagram"
    }
  ],
  
  // Wemos D1 Mini
  "wemos-d1-mini": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/9e/WeMos_D1_mini_-_front.jpg",
      angle: "Front View",
      alt: "Wemos D1 Mini - ESP8266 Compact Board"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/f/f4/WeMos_D1_Mini_Pinout.png",
      angle: "Pin Layout",
      alt: "Wemos D1 Mini - Pinout Diagram"
    }
  ],
  
  // ESP-01 Module
  "esp-01": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/1/19/ESP-01.jpg",
      angle: "Front View",
      alt: "ESP-01 WiFi Module - Basic ESP8266"
    }
  ],
  
  // ESP-12E Module
  "esp-12e": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/6/6c/ESP-12E_ESP8266_module.jpg",
      angle: "Top View",
      alt: "ESP-12E ESP8266 Module"
    }
  ],
  
  // ESP-12F Module
  "esp-12f": [
    {
      url: "https://cdn.pixabay.com/photo/2020/11/15/18/30/esp-12f-5745678_1280.jpg",
      angle: "Top View",
      alt: "ESP-12F ESP8266 Module - Improved Version"
    }
  ],
  
  // ==================== ESP32 MODULES ====================
  
  // ESP32-WROOM-32 Module (has 3D model)
  "esp32-wroom-32": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/ESP32.jpg",
      angle: "Top View",
      alt: "ESP32-WROOM-32 WiFi & Bluetooth Module"
    },
    {
      url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/_images/esp-wroom-32-dimensions-front.png",
      angle: "Dimensions Front",
      alt: "ESP32-WROOM-32 - Front Dimensions"
    }
  ],
  
  // ESP32-WROVER Module
  "esp32-wrover": [
    {
      url: "https://cdn.pixabay.com/photo/2021/02/18/15/42/esp32-wrover-6027534_1280.jpg",
      angle: "Top View",
      alt: "ESP32-WROVER Module - With PSRAM"
    }
  ],
  
  // ESP32-S3 WROOM Module
  "esp32-s3-wroom": [
    {
      url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/_images/ESP32-S3-WROOM-1.png",
      angle: "Perspective View",
      alt: "ESP32-S3-WROOM-1 Module"
    }
  ],
  
  // ESP32-C3 Mini Module
  "esp32-c3-mini": [
    {
      url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32c3/_images/ESP32-C3-MINI-1.png",
      angle: "Perspective View",
      alt: "ESP32-C3-MINI-1 Module - Compact"
    }
  ],
  
  // ESP8266-12E Module
  "esp8266-12e-module": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/6/6c/ESP-12E_ESP8266_module.jpg",
      angle: "Top View",
      alt: "ESP8266-12E Module"
    }
  ],
}

/**
 * Get 3D model and images for an ESP32/ESP8266 component
 */
export function getESP323DData(componentSlug: string): ESP323DData {
  return {
    sketchfabId: ESP32_SKETCHFAB_MODELS[componentSlug],
    images: ESP32_IMAGES[componentSlug] || [],
    modelPlatform: ESP32_SKETCHFAB_MODELS[componentSlug] ? 'sketchfab' : undefined,
  }
}

/**
 * Check if component has 3D visualization available
 */
export function hasESP323DVisualization(componentSlug: string): boolean {
  return !!(ESP32_SKETCHFAB_MODELS[componentSlug] || ESP32_IMAGES[componentSlug])
}

/**
 * Get placeholder images for components without specific images
 */
export function getESP32PlaceholderImages(componentName: string, category: string): ComponentImages[] {
  const basePath = `/images/resources/esp32/placeholder-${category.toLowerCase().replace(/\s+/g, '-')}.jpg`
  
  return [
    {
      url: basePath,
      angle: "Product Image",
      alt: `${componentName} - ${category}`
    }
  ]
}

/**
 * Statistics
 */
export const ESP32_STATS = {
  totalComponents: Object.keys(ESP32_SKETCHFAB_MODELS).length,
  componentsWith3DModels: Object.values(ESP32_SKETCHFAB_MODELS).filter(id => id !== undefined).length,
  componentsWithImages: Object.keys(ESP32_IMAGES).length,
  totalImages: Object.values(ESP32_IMAGES).reduce((sum, images) => sum + images.length, 0),
}
