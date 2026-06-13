import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe storage utilities with error handling
export const safeStorage = {
  getItem: (storage: Storage, key: string): string | null => {
    try {
      return storage.getItem(key)
    } catch (error) {
      console.warn(`Failed to read from ${storage === localStorage ? 'localStorage' : 'sessionStorage'}:`, error)
      return null
    }
  },
  setItem: (storage: Storage, key: string, value: string): boolean => {
    try {
      storage.setItem(key, value)
      return true
    } catch (error) {
      console.warn(`Failed to write to ${storage === localStorage ? 'localStorage' : 'sessionStorage'}:`, error)
      return false
    }
  },
  removeItem: (storage: Storage, key: string): boolean => {
    try {
      storage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove from ${storage === localStorage ? 'localStorage' : 'sessionStorage'}:`, error)
      return false
    }
  },
  clear: (storage: Storage): boolean => {
    try {
      storage.clear()
      return true
    } catch (error) {
      console.warn(`Failed to clear ${storage === localStorage ? 'localStorage' : 'sessionStorage'}:`, error)
      return false
    }
  }
}
