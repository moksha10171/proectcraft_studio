/** Browser preferences hydrate after mount so server and client markup match. */
import { useState, useEffect, useCallback, useRef } from 'react'
import { safeStorage } from '@/lib/utils'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const initialRef = useRef(initialValue)
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = safeStorage.getItem(localStorage, key)
      setStoredValue(item ? JSON.parse(item) : initialRef.current)
    } catch {
      setStoredValue(initialRef.current)
    }
  }, [key])

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(previous => {
      const next = value instanceof Function ? value(previous) : value
      try {
        safeStorage.setItem(localStorage, key, JSON.stringify(next))
      } catch (error) {
        console.warn(`Could not save browser preference "${key}"`, error)
      }
      return next
    })
  }, [key])

  return [storedValue, setValue]
}
