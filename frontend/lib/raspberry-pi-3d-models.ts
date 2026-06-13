/**
 * Raspberry Pi 3D Models and Image Resources
 * 
 * This file contains mappings for:
 * - Sketchfab 3D model IDs for Raspberry Pi boards and accessories
 * - Image URLs for multiple angle views
 * - Support for multiple 3D platforms
 */

export interface ComponentImages {
  url: string
  angle: string
  alt: string
}

export interface RaspberryPi3DData {
  sketchfabId?: string
  modelViewerUrl?: string // For Google model-viewer (GLB/GLTF files)
  threeJsUrl?: string // For custom Three.js implementation
  images: ComponentImages[]
  modelPlatform?: 'sketchfab' | 'model-viewer' | 'three.js'
}

/**
 * Sketchfab 3D Model IDs for Raspberry Pi Components
 * Source: https://sketchfab.com
 * All models are free to use for educational purposes
 * 
 * Models found from web search on January 12, 2026:
 * - Raspberry Pi 4 Model B: db9ee9f6841345b6ad4b8b39b93b903d
 * - Raspberry Pi 3 Model B+: 642e608c219e4f39bde232fd572505fb
 * - Raspberry Pi 3 Model B: 78fede6fe71142dcb5b8dcc170845431
 * - Raspberry Pi 3 Model A+: 3bd7cbdffbe84819822ecd883503adbf
 */
export const RASPBERRY_PI_SKETCHFAB_MODELS: Record<string, string | undefined> = {
  // ==================== RASPBERRY PI BOARDS ====================
  
  // Raspberry Pi 5 (Latest)
  "raspberry-pi-5": undefined, // No 3D model yet (too new)
  
  // Raspberry Pi 4 Series
  "raspberry-pi-4": "db9ee9f6841345b6ad4b8b39b93b903d", // ✅ Pi 4 Model B (Sketchfab)
  
  // Raspberry Pi 3 Series
  "raspberry-pi-3-b-plus": "642e608c219e4f39bde232fd572505fb", // ✅ Pi 3 Model B+ (Sketchfab)
  "raspberry-pi-3": "78fede6fe71142dcb5b8dcc170845431", // ✅ Pi 3 Model B (Sketchfab)
  "raspberry-pi-3-a-plus": "3bd7cbdffbe84819822ecd883503adbf", // ✅ Pi 3 Model A+ (Sketchfab)
  
  // Raspberry Pi Zero Series
  "raspberry-pi-zero-2-w": undefined, // Add when found
  "raspberry-pi-zero-w": undefined, // Add when found
  
  // Raspberry Pi Pico
  "raspberry-pi-pico": undefined, // Add when found
  "raspberry-pi-pico-w": undefined, // Add when found
  
  // ==================== HATs & ADD-ONS ====================
  "sense-hat": undefined, // Add when found
  "camera-module-3": undefined, // Add when found
  "display-touchscreen": undefined, // Add when found
  "m2-hat-plus": undefined, // Add when found
  "active-cooler": undefined, // Add when found
  "poe-plus-hat": undefined, // Add when found
  
  // ==================== ACCESSORIES ====================
  "official-case": undefined,
  "power-supply": undefined,
}

/**
 * Raspberry Pi Component Image URLs
 * 
 * Sources:
 * - Wikimedia Commons (CC licenses with attribution)
 * - Pixabay (Free for commercial use, no attribution required)
 * - Raspberry Pi Official Documentation
 * 
 * All images comply with usage rights for educational/commercial purposes.
 */
export const RASPBERRY_PI_IMAGES: Record<string, ComponentImages[]> = {
  // ==================== RASPBERRY PI BOARDS ====================
  
  // Raspberry Pi 5 (Latest - 2023)
  "raspberry-pi-5": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Raspberry_Pi_5.jpg",
      angle: "Top View",
      alt: "Raspberry Pi 5 - Top View with Components"
    },
    {
      url: "https://www.raspberrypi.com/documentation/computers/images/pi5-labelled.png",
      angle: "Labeled Diagram",
      alt: "Raspberry Pi 5 - Component Labels"
    }
  ],
  
  // Raspberry Pi 4 Model B (has 3D model)
  "raspberry-pi-4": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Raspberry_Pi_4_Model_B_-_Side.jpg",
      angle: "Side View",
      alt: "Raspberry Pi 4 Model B - Side View"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Raspberry_Pi_4_Model_B_-_Top.jpg",
      angle: "Top View",
      alt: "Raspberry Pi 4 Model B - Top View"
    },
    {
      url: "https://www.raspberrypi.com/documentation/computers/images/pi4-labelled.png",
      angle: "Labeled Diagram",
      alt: "Raspberry Pi 4 - Pin Layout and Components"
    }
  ],
  
  // Raspberry Pi 3 Model B+ (has 3D model)
  "raspberry-pi-3-b-plus": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/97/Raspberry_Pi_3_B%2B_%2839906369025%29.png",
      angle: "Top View",
      alt: "Raspberry Pi 3 Model B+ - Top View"
    },
    {
      url: "https://www.raspberrypi.com/documentation/computers/images/GPIO-Pinout-Diagram-2.png",
      angle: "GPIO Pinout",
      alt: "Raspberry Pi - 40-pin GPIO Header Pinout"
    }
  ],
  
  // Raspberry Pi 3 Model B (has 3D model)
  "raspberry-pi-3": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Raspberry-Pi-3-Flat-Top.jpg",
      angle: "Top View",
      alt: "Raspberry Pi 3 Model B - Top View"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Raspberry_Pi_3_Model_B.png",
      angle: "Perspective View",
      alt: "Raspberry Pi 3 Model B - Perspective"
    }
  ],
  
  // Raspberry Pi 3 Model A+ (has 3D model)
  "raspberry-pi-3-a-plus": [
    {
      url: "https://cdn.pixabay.com/photo/2019/01/22/18/46/raspberry-pi-3947508_1280.jpg",
      angle: "Top View",
      alt: "Raspberry Pi 3 Model A+ - Compact Board"
    }
  ],
  
  // Raspberry Pi Zero 2 W
  "raspberry-pi-zero-2-w": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/0/00/Raspberry_Pi_Zero_2_W.jpg",
      angle: "Top View",
      alt: "Raspberry Pi Zero 2 W - Ultra-compact"
    }
  ],
  
  // Raspberry Pi Zero W
  "raspberry-pi-zero-w": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raspberry-Pi-Zero-FL.jpg",
      angle: "Front View",
      alt: "Raspberry Pi Zero W - Tiny Form Factor"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/7/71/Raspberry-Pi-Zero-W.jpg",
      angle: "Top View",
      alt: "Raspberry Pi Zero W - Complete View"
    }
  ],
  
  // Raspberry Pi Pico
  "raspberry-pi-pico": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/0/00/Raspberry_Pi_Pico.jpg",
      angle: "Top View",
      alt: "Raspberry Pi Pico - Microcontroller Board"
    },
    {
      url: "https://www.raspberrypi.com/documentation/microcontrollers/images/pico-pinout.svg",
      angle: "Pinout Diagram",
      alt: "Raspberry Pi Pico - Complete Pinout"
    }
  ],
  
  // Raspberry Pi Pico W
  "raspberry-pi-pico-w": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Raspberry_Pi_Pico_W.jpg",
      angle: "Top View",
      alt: "Raspberry Pi Pico W - With WiFi/Bluetooth"
    }
  ],
  
  // ==================== HATs & ADD-ONS ====================
  
  // Sense HAT
  "sense-hat": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Raspberry_Pi_Sense_HAT.jpg",
      angle: "Top View",
      alt: "Sense HAT - LED Matrix and Sensors"
    },
    {
      url: "https://cdn.pixabay.com/photo/2017/11/25/11/11/sense-hat-2976726_1280.jpg",
      angle: "Mounted View",
      alt: "Sense HAT mounted on Raspberry Pi"
    }
  ],
  
  // Camera Module 3
  "camera-module-3": [
    {
      url: "https://www.raspberrypi.com/documentation/accessories/images/camera_module_3.jpg",
      angle: "Front View",
      alt: "Raspberry Pi Camera Module 3"
    }
  ],
  
  // Official Touchscreen Display
  "display-touchscreen": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Raspberry_Pi_7_inch_touchscreen_display.jpg",
      angle: "Front View",
      alt: "Raspberry Pi 7-inch Touchscreen Display"
    }
  ],
  
  // M.2 HAT+ for Pi 5
  "m2-hat-plus": [
    {
      url: "https://www.raspberrypi.com/documentation/computers/images/m2-hat-plus.jpg",
      angle: "Top View",
      alt: "M.2 HAT+ for NVMe SSD - Raspberry Pi 5"
    }
  ],
  
  // Active Cooler for Pi 5
  "active-cooler": [
    {
      url: "https://www.raspberrypi.com/documentation/computers/images/active-cooler.jpg",
      angle: "Perspective View",
      alt: "Active Cooler Fan for Raspberry Pi 5"
    }
  ],
  
  // PoE+ HAT
  "poe-plus-hat": [
    {
      url: "https://cdn.pixabay.com/photo/2020/03/15/12/30/raspberry-pi-4928963_1280.jpg",
      angle: "Top View",
      alt: "PoE+ HAT - Power over Ethernet"
    }
  ],
  
  // ==================== ACCESSORIES ====================
  
  // Official Raspberry Pi Case
  "official-case": [
    {
      url: "https://cdn.pixabay.com/photo/2019/04/14/14/31/raspberry-pi-4126009_1280.jpg",
      angle: "Complete View",
      alt: "Official Raspberry Pi Case - Red and White"
    }
  ],
  
  // Official Power Supply
  "power-supply": [
    {
      url: "https://cdn.pixabay.com/photo/2020/11/24/11/18/power-supply-5772280_1280.jpg",
      angle: "Front View",
      alt: "Raspberry Pi Official Power Supply"
    }
  ],
}

/**
 * Get 3D model and images for a Raspberry Pi component
 * Supports multiple 3D platforms: Sketchfab, Google model-viewer, Three.js
 */
export function getRaspberryPi3DData(componentSlug: string): RaspberryPi3DData {
  return {
    sketchfabId: RASPBERRY_PI_SKETCHFAB_MODELS[componentSlug],
    images: RASPBERRY_PI_IMAGES[componentSlug] || [],
    modelPlatform: RASPBERRY_PI_SKETCHFAB_MODELS[componentSlug] ? 'sketchfab' : undefined,
    // Future: Add support for other platforms
    // modelViewerUrl: MODEL_VIEWER_URLS[componentSlug],
    // threeJsUrl: THREEJS_URLS[componentSlug],
  }
}

/**
 * Check if component has 3D visualization available
 */
export function hasRaspberryPi3DVisualization(componentSlug: string): boolean {
  return !!(RASPBERRY_PI_SKETCHFAB_MODELS[componentSlug] || RASPBERRY_PI_IMAGES[componentSlug])
}

/**
 * Get placeholder images for components without specific images
 */
export function getRaspberryPiPlaceholderImages(componentName: string, category: string): ComponentImages[] {
  const basePath = `/images/resources/raspberry-pi/placeholder-${category.toLowerCase().replace(/\s+/g, '-')}.jpg`
  
  return [
    {
      url: basePath,
      angle: "Product Image",
      alt: `${componentName} - ${category}`
    }
  ]
}

/**
 * Get all components with 3D models
 */
export function getRaspberryPiComponentsWith3DModels(): string[] {
  return Object.entries(RASPBERRY_PI_SKETCHFAB_MODELS)
    .filter(([_, modelId]) => modelId !== undefined)
    .map(([slug]) => slug)
}

/**
 * Get all components with images
 */
export function getRaspberryPiComponentsWithImages(): string[] {
  return Object.keys(RASPBERRY_PI_IMAGES)
}

/**
 * Statistics
 */
export const RASPBERRY_PI_STATS = {
  totalComponents: Object.keys(RASPBERRY_PI_SKETCHFAB_MODELS).length,
  componentsWith3DModels: Object.values(RASPBERRY_PI_SKETCHFAB_MODELS).filter(id => id !== undefined).length,
  componentsWithImages: Object.keys(RASPBERRY_PI_IMAGES).length,
  totalImages: Object.values(RASPBERRY_PI_IMAGES).reduce((sum, images) => sum + images.length, 0),
}
