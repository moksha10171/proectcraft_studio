/**
 * Local AI provider utilities — uses your own API keys from environment variables.
 * No external proxy or third-party auth service required.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const REQUEST_TIMEOUT = 15000

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!key || key.length < 10) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to your .env.local file.')
  }
  return key
}

export function getGroqApiKey(): string | null {
  const key = process.env.GROQ_API_KEY
  return key && key.length > 10 ? key : null
}

export function hasAiProviderConfigured(): boolean {
  return !!(getGroqApiKey() || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY)
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AiCompletionResult {
  text: string
  provider: 'gemini' | 'groq'
  usage?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
}

export async function callGemini(
  systemInstruction: string,
  prompt: string,
  options?: { responseSchema?: Record<string, unknown>; jsonMode?: boolean }
): Promise<AiCompletionResult> {
  const apiKey = getGeminiApiKey()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const generationConfig: Record<string, unknown> = {
    temperature: 0.7,
    maxOutputTokens: 8192,
  }

  if (options?.jsonMode || options?.responseSchema) {
    generationConfig.responseMimeType = 'application/json'
    if (options.responseSchema) {
      generationConfig.responseSchema = options.responseSchema
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Empty response from Gemini')

    return {
      text,
      provider: 'gemini',
      usage: data.usageMetadata,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function callGroq(systemInstruction: string, prompt: string): Promise<AiCompletionResult> {
  const apiKey = getGroqApiKey()
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Groq API error ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Empty response from Groq')

    return {
      text,
      provider: 'groq',
      usage: {
        promptTokenCount: data.usage?.prompt_tokens,
        candidatesTokenCount: data.usage?.completion_tokens,
        totalTokenCount: data.usage?.total_tokens,
      },
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Try Gemini first, fall back to Groq if configured. */
export async function callAi(
  systemInstruction: string,
  prompt: string,
  options?: { responseSchema?: Record<string, unknown>; jsonMode?: boolean }
): Promise<AiCompletionResult> {
  try {
    return await callGemini(systemInstruction, prompt, options)
  } catch (geminiError) {
    const groqKey = getGroqApiKey()
    if (!groqKey) throw geminiError
    return callGroq(systemInstruction, prompt)
  }
}
