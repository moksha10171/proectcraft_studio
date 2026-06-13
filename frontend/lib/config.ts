/**
 * Centralized configuration for the open-source, self-hosted ProjectCraft instance.
 * All AI features use your own API keys from environment variables.
 */

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'ProjectCraft',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/projectcraft',
} as const

export const AI_CONFIG = {
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
} as const

export { getServerEnvStatus, ENV_SETUP_STEPS } from './env'
export type { EnvStatus } from './env'

export const API_ENDPOINTS = {
  projects: {
    base: '/api/projects',
    list: '/api/projects/list',
    get: '/api/projects/get',
    categories: '/api/projects/categories',
    download: '/api/projects/download',
  },
} as const
