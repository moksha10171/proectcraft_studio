/**
 * Environment variable helpers for self-hosted open-source deployment.
 */

export interface EnvStatus {
  hasGeminiKey: boolean
  hasGroqKey: boolean
  hasAiProvider: boolean
  appUrl: string
  appName: string
  githubUrl: string
  geminiModel: string
  groqModel: string
  nodeEnv: string
}

export function getServerEnvStatus(): EnvStatus {
  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim()
  )
  const hasGroqKey = !!process.env.GROQ_API_KEY?.trim()

  return {
    hasGeminiKey,
    hasGroqKey,
    hasAiProvider: hasGeminiKey || hasGroqKey,
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000',
    appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'ProjectCraft',
    githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL?.trim() || 'https://github.com/projectcraft',
    geminiModel: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite',
    groqModel: process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile',
    nodeEnv: process.env.NODE_ENV || 'development',
  }
}

export const ENV_SETUP_STEPS = [
  { step: 1, title: 'Copy env file', command: 'cp .env.local.example frontend/.env.local' },
  { step: 2, title: 'Add API keys', command: '# edit frontend/.env.local — GEMINI_API_KEY or GROQ_API_KEY' },
  { step: 3, title: 'Install & run', command: 'pnpm install && pnpm dev' },
  { step: 4, title: 'Verify setup', command: 'curl http://localhost:3000/api/health' },
] as const
