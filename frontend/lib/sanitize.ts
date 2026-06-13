/**
 * Input Sanitization Utilities
 * Sanitizes user inputs to prevent XSS attacks
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML string to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // No HTML tags allowed by default
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize text content (removes HTML)
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

/**
 * Sanitize URL to prevent open redirects
 */
export function sanitizeURL(url: string, allowedDomains: string[] = []): string | null {
  try {
    // If relative URL, check if it's safe
    if (url.startsWith('/')) {
      // Only allow relative paths, no protocol-relative URLs
      if (!url.startsWith('//')) {
        return url
      }
      return null
    }

    const parsed = new URL(url)
    
    // Check if domain is allowed
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`))
      if (!isAllowed) {
        return null
      }
    }

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    const value = sanitized[key]
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value) as T[Extract<keyof T, string>]
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>) as T[Extract<keyof T, string>]
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : 
        typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : 
        item
      ) as T[Extract<keyof T, string>]
    }
  }
  
  return sanitized
}

/**
 * Validate redirect URL against allowlist
 */
const ALLOWED_REDIRECT_PATHS = ['/projects', '/studio', '/categories', '/about', '/']
export function isSafeRedirect(url: string): boolean {
  try {
    // If absolute URL, check domain
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url)
      // Only allow same origin
      return parsed.origin === (typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }
    
    // If relative URL, check against allowlist
    if (url.startsWith('/')) {
      return ALLOWED_REDIRECT_PATHS.some(path => url === path || url.startsWith(path + '/'))
    }
    
    return false
  } catch {
    return false
  }
}
