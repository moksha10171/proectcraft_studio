// Shared utility functions for ProjectCraft

/**
 * API Icon to Emoji mapping
 * Maps Font Awesome icon classes to emoji representations
 */
export const iconToEmoji: Record<string, string> = {
    // Web Development
    "fas fa-globe": "🌐",
    "fas fa-code": "💻",
    "fas fa-laptop-code": "👨‍💻",
    "fas fa-html5": "🌐",
    "fas fa-css3": "🎨",
    "fas fa-js": "📜",
    "fas fa-react": "⚛️",
    "fas fa-node": "🟢",
    "fas fa-php": "🐘",
    "fas fa-wordpress": "📝",

    // Mobile Development
    "fas fa-mobile-alt": "📱",
    "fas fa-mobile": "📲",
    "fas fa-tablet": "📱",
    "fas fa-android": "🤖",
    "fas fa-apple": "🍎",

    // Gaming
    "fas fa-gamepad": "🎮",
    "fas fa-dice": "🎲",
    "fas fa-chess": "♟️",
    "fas fa-puzzle-piece": "🧩",
    "fas fa-trophy": "🏆",

    // AI / Machine Learning
    "fas fa-brain": "🧠",
    "fas fa-robot": "🤖",
    "fas fa-magic": "✨",
    "fas fa-chart-line": "📈",
    "fas fa-project-diagram": "🔀",

    // IoT / Embedded / Hardware
    "fas fa-microchip": "🔧",
    "fas fa-memory": "💾",
    "fas fa-plug": "🔌",
    "fas fa-wifi": "📶",
    "fas fa-bluetooth": "📡",
    "fas fa-raspberry-pi": "🍓",
    "fas fa-usb": "🔌",
    "fas fa-temperature-high": "🌡️",
    "fas fa-lightbulb": "💡",
    "fas fa-solar-panel": "☀️",
    "fas fa-car": "🚗",
    "fas fa-drone": "🚁",

    // System / DevOps
    "fas fa-cogs": "⚙️",
    "fas fa-cog": "⚙️",
    "fas fa-tools": "🛠️",
    "fas fa-wrench": "🔧",
    "fas fa-hammer": "🔨",

    // Desktop / Applications
    "fas fa-desktop": "🖥️",
    "fas fa-window-maximize": "🪟",
    "fas fa-terminal": "💻",
    "fas fa-keyboard": "⌨️",

    // Server / Cloud / Infrastructure
    "fas fa-server": "🖥️",
    "fas fa-cloud": "☁️",
    "fas fa-cloud-upload": "⬆️",
    "fas fa-cloud-download": "⬇️",
    "fas fa-network-wired": "🌐",
    "fas fa-sitemap": "🗺️",
    "fas fa-docker": "🐳",

    // Database / Data
    "fas fa-database": "🗄️",
    "fas fa-table": "📊",
    "fas fa-chart-bar": "📊",
    "fas fa-chart-pie": "🥧",
    "fas fa-file-excel": "📗",

    // Security / Cybersecurity
    "fas fa-shield-alt": "🛡️",
    "fas fa-shield": "🛡️",
    "fas fa-lock": "🔒",
    "fas fa-unlock": "🔓",
    "fas fa-key": "🔑",
    "fas fa-user-secret": "🕵️",
    "fas fa-fingerprint": "👆",

    // Networking
    "fas fa-link": "🔗",

    // General
    "fas fa-folder": "📁",
    "fas fa-file": "📄",
}

/**
 * Get emoji icon for a given Font Awesome class
 * @param icon - Font Awesome icon class (e.g., "fas fa-globe")
 * @returns Emoji representation or default folder emoji
 */
export function getEmojiIcon(icon: string): string {
    return iconToEmoji[icon] || "📁"
}

/**
 * Get Tailwind CSS class for difficulty badge color
 * @param difficulty - Difficulty level (Beginner, Intermediate, Advanced)
 * @returns Tailwind CSS background color class
 */
export function getDifficultyColor(difficulty: string): string {
    const d = difficulty.toLowerCase()
    if (d === "beginner") return "bg-emerald-500"
    if (d === "intermediate") return "bg-amber-500"
    if (d === "advanced") return "bg-rose-500"
    return "bg-gray-500"
}

/**
 * Safe localStorage operations with error handling
 */
export const safeLocalStorage = {
    /**
     * Get item from localStorage with error handling
     * @param key - Storage key
     * @returns Stored value or null if error/not found
     */
    getItem(key: string): string | null {
        try {
            return localStorage.getItem(key)
        } catch (error) {
            console.error(`Failed to get item from localStorage: ${key}`, error)
            return null
        }
    },

    /**
     * Set item in localStorage with error handling
     * @param key - Storage key
     * @param value - Value to store
     * @returns true if successful, false otherwise
     */
    setItem(key: string, value: string): boolean {
        try {
            localStorage.setItem(key, value)
            return true
        } catch (error) {
            console.error(`Failed to set item in localStorage: ${key}`, error)
            return false
        }
    },

    /**
     * Remove item from localStorage with error handling
     * @param key - Storage key
     * @returns true if successful, false otherwise
     */
    removeItem(key: string): boolean {
        try {
            localStorage.removeItem(key)
            return true
        } catch (error) {
            console.error(`Failed to remove item from localStorage: ${key}`, error)
            return false
        }
    },

    /**
     * Get and parse JSON from localStorage
     * @param key - Storage key
     * @param defaultValue - Default value if parsing fails
     * @returns Parsed object or default value
     */
    getJSON<T>(key: string, defaultValue: T): T {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch (error) {
            console.error(`Failed to parse JSON from localStorage: ${key}`, error)
            return defaultValue
        }
    },

    /**
     * Stringify and store JSON in localStorage
     * @param key - Storage key
     * @param value - Value to store
     * @returns true if successful, false otherwise
     */
    setJSON<T>(key: string, value: T): boolean {
        try {
            localStorage.setItem(key, JSON.stringify(value))
            return true
        } catch (error) {
            console.error(`Failed to stringify and store JSON in localStorage: ${key}`, error)
            return false
        }
    },
}
