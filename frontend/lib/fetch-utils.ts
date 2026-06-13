// Shared fetch utility with timeout handling
// Use this for all external API calls to prevent hanging requests

/**
 * Fetch with timeout support
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms)
 * @returns Promise<Response>
 * @throws Error if timeout or fetch fails
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 10000
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw error;
    }
}

/**
 * Error logging utility
 * Replace with proper logging service (Sentry, LogRocket, etc.) in production
 */
export function logError(message: string, context?: Record<string, unknown>): void {
    // In production, send to logging service
    // For now, only log in development
    if (process.env.NODE_ENV === 'development') {
        console.error(`[ERROR] ${message}`, context);
    }

    // TODO: Send to Sentry or other error tracking service
    // Sentry.captureException(new Error(message), { extra: context });
}

/**
 * Performance tracking utility
 * Track API response times and other metrics
 */
export function trackMetric(
    name: string,
    value: number,
    tags?: Record<string, string | number | boolean>
): void {
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'development') {
        console.log(`[METRIC] ${name}: ${value}ms`, tags);
    }

    // TODO: Send to monitoring service (Vercel Analytics, DataDog, etc.)
}
