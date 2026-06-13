import { NextRequest, NextResponse } from 'next/server'
import { callAi, hasAiProviderConfigured } from '@/lib/ai-providers'
import { sanitizeText } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  try {
    if (!hasAiProviderConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI not configured. Set GEMINI_API_KEY or GROQ_API_KEY in your .env.local file.',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { message, topicSlug, topicData } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid message' }, { status: 400 })
    }

    const topicTitle = topicData?.title || topicSlug || 'this project'
    const sanitizedMessage = sanitizeText(message)

    const systemInstruction = `You are a helpful coding tutor assistant for ProjectCraft, an open-source learning platform.
You help students understand projects, code, setup instructions, and hardware components.
Be concise, accurate, and educational. If you are unsure, say so.
Topic context: ${topicTitle}${topicSlug ? ` (${topicSlug})` : ''}`

    const result = await callAi(systemInstruction, sanitizedMessage)

    return NextResponse.json({
      success: true,
      message: result.text,
      usage: {
        tokens_used: result.usage?.totalTokenCount,
        model_used: result.provider,
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate response',
      },
      { status: 500 }
    )
  }
}
