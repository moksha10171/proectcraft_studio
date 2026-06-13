/**
 * Electronic Components 3D Models and Image Resources
 * 
 * This file contains mappings for:
 * - Image URLs for multiple angle views of electronic components
 * - 3D model references (if available)
 * - Visual learning resources for resistors, capacitors, ICs, etc.
 */

export interface ComponentImages {
  url: string
  angle: string
  alt: string
}

export interface Component3DData {
  sketchfabId?: string
  modelViewerUrl?: string
  threeJsUrl?: string
  images: ComponentImages[]
  modelPlatform?: 'sketchfab' | 'model-viewer' | 'three.js'
}

/**
 * Electronic Component Image URLs
 * 
 * Sources:
 * - Wikimedia Commons (CC licenses with attribution)
 * - Pixabay (Free for commercial use, no attribution required)
 * - Electronics tutorials and documentation
 */
export const COMPONENT_IMAGES: Record<string, ComponentImages[]> = {
  // ==================== RESISTORS ====================
  
  "carbon-film-resistor": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Resistor.jpg",
      angle: "Side View",
      alt: "Carbon Film Resistor - 1/4W with Color Bands"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/7/75/Electronic-Axial-Lead-Resistors-Array.jpg",
      angle: "Array View",
      alt: "Various Resistors - Different Wattage Ratings"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Resistor_symbol_America.svg",
      angle: "Schematic Symbol",
      alt: "Resistor - Circuit Symbol"
    }
  ],
  
  "potentiometer-10k": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Potentiometer.jpg",
      angle: "Front View",
      alt: "10kΩ Potentiometer - Rotary Control"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/0/09/Potentiometer_3362P.jpg",
      angle: "Top View",
      alt: "Trimmer Potentiometer - PCB Mount"
    }
  ],
  
  // ==================== CAPACITORS ====================
  
  "ceramic-capacitor": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Ceramic_Capacitors.jpg",
      angle: "Perspective View",
      alt: "Ceramic Capacitors - Various Values"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Ceramic_disc_capacitor.svg",
      angle: "Side View",
      alt: "Ceramic Disc Capacitor - Diagram"
    }
  ],
  
  "electrolytic-capacitor": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Photo-SMDElectrolyticCapacitors.jpg",
      angle: "Top View",
      alt: "Electrolytic Capacitors - Radial Lead"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/52/Elko_+_-.jpg",
      angle: "Polarity View",
      alt: "Electrolytic Capacitor - Showing Polarity Markings"
    }
  ],
  
  // ==================== TRANSISTORS ====================
  
  "npn-transistor-2n2222": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/50/Transistor_2N2222A.jpg",
      angle: "Front View",
      alt: "2N2222A NPN Transistor - TO-92 Package"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/c/cb/BJT_NPN_symbol_%28case%29.svg",
      angle: "Schematic Symbol",
      alt: "NPN Transistor - Circuit Symbol with Pin Labels"
    }
  ],
  
  "mosfet-n-channel": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/2/21/MOSFET_n-channel_symbol.svg",
      angle: "Schematic Symbol",
      alt: "N-Channel MOSFET - Circuit Symbol"
    }
  ],
  
  // ==================== INTEGRATED CIRCUITS ====================
  
  "555-timer-ic": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/2/21/Signetics_NE555N.JPG",
      angle: "Top View",
      alt: "NE555 Timer IC - DIP-8 Package"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/91/555_Pinout.svg",
      angle: "Pin Layout",
      alt: "555 Timer - Pinout Diagram"
    }
  ],
  
  "lm358-op-amp": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/4/43/Op-Amp_Pinout.svg",
      angle: "Pin Layout",
      alt: "LM358 Operational Amplifier - Pinout"
    }
  ],
  
  "l293d-motor-driver": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/5c/L293D_chip.jpg",
      angle: "Top View",
      alt: "L293D Motor Driver IC - DIP-16 Package"
    }
  ],
  
  "74hc595-shift-register": [
    {
      url: "https://cdn.pixabay.com/photo/2020/07/10/16/30/integrated-circuit-5392126_1280.jpg",
      angle: "Top View",
      alt: "74HC595 Shift Register IC - DIP-16"
    }
  ],
  
  "at89s52-microcontroller": [
    {
      url: "https://cdn.pixabay.com/photo/2019/09/15/18/30/microcontroller-4479553_1280.jpg",
      angle: "Top View",
      alt: "AT89S52 8051 Microcontroller - DIP-40"
    }
  ],
  
  // ==================== DIODES & LEDS ====================
  
  "standard-led-5mm": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/c/cb/RBG-LED.jpg",
      angle: "Front View",
      alt: "5mm LEDs - Various Colors"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/f/f9/LED_symbol.svg",
      angle: "Schematic Symbol",
      alt: "LED - Circuit Symbol"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/91/LED%2C_5mm%2C_green_%28en%29.svg",
      angle: "Anatomy Diagram",
      alt: "LED - Internal Structure and Polarity"
    }
  ],
  
  "rectifier-diode-1n4007": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/94/Diode-1N4007-1N4001.jpg",
      angle: "Side View",
      alt: "1N4007 Rectifier Diode - DO-41 Package"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Diode_symbol.svg",
      angle: "Schematic Symbol",
      alt: "Diode - Circuit Symbol with Polarity"
    }
  ],
  
  "zener-diode": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Zener_diode_symbol.svg",
      angle: "Schematic Symbol",
      alt: "Zener Diode - Circuit Symbol"
    }
  ],
  
  // ==================== GENERAL PLACEHOLDER ====================
  
  "generic-component": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Electronic_component_overview.jpg",
      angle: "Overview",
      alt: "Electronic Components - General Overview"
    }
  ],
}

/**
 * Get 3D model and images for an electronic component
 */
export function getComponent3DData(componentSlug: string): Component3DData {
  return {
    images: COMPONENT_IMAGES[componentSlug] || COMPONENT_IMAGES["generic-component"],
    modelPlatform: undefined, // Most components don't have 3D models, images are sufficient
  }
}

/**
 * Check if component has visualization available
 */
export function hasComponentVisualization(componentSlug: string): boolean {
  return !!(COMPONENT_IMAGES[componentSlug])
}

/**
 * Get placeholder images for components without specific images
 */
export function getComponentPlaceholderImages(componentName: string, category: string): ComponentImages[] {
  const categoryMap: Record<string, ComponentImages[]> = {
    "Resistor": COMPONENT_IMAGES["carbon-film-resistor"],
    "Capacitor": COMPONENT_IMAGES["ceramic-capacitor"],
    "Transistor": COMPONENT_IMAGES["npn-transistor-2n2222"],
    "Integrated Circuit": COMPONENT_IMAGES["555-timer-ic"],
    "Diode & LED": COMPONENT_IMAGES["standard-led-5mm"],
  }
  
  return categoryMap[category] || COMPONENT_IMAGES["generic-component"]
}

/**
 * Statistics
 */
export const COMPONENT_STATS = {
  totalComponents: Object.keys(COMPONENT_IMAGES).length,
  componentsWithImages: Object.keys(COMPONENT_IMAGES).length,
  totalImages: Object.values(COMPONENT_IMAGES).reduce((sum, images) => sum + images.length, 0),
}
