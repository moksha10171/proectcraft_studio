import { NextRequest, NextResponse } from 'next/server';
import { ComponentType, ProjectFile, ArduinoComponent } from '@/lib/arduino-studio/types';
import { sanitizeText } from '@/lib/sanitize';
import { getGeminiApiKey, getGroqApiKey } from '@/lib/ai-providers';
import {
    buildFileContext,
    ARDUINO_GENERATION_PROMPT,
    ARDUINO_GENERATION_SCHEMA,
    RPI_GENERATION_PROMPT,
    RPI_GENERATION_SCHEMA,
    VERIFY_ARDUINO_PROMPT,
    VERIFY_PYTHON_PROMPT,
    VERIFY_SCHEMA,
    DERIVE_WIRING_PROMPT,
    DERIVE_RPI_WIRING_PROMPT,
    DERIVE_WIRING_SCHEMA,
    OPTIMIZE_CODE_PROMPT,
    OPTIMIZE_CODE_SCHEMA,
} from '@/lib/arduino-studio/prompt-templates';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = getGroqApiKey();
if (!GROQ_API_KEY) {
    console.warn('GROQ_API_KEY environment variable not set - Groq fallback will be unavailable');
}

// Request timeout (15 seconds for better reliability)
const REQUEST_TIMEOUT = 15000;

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Cache for API keys (in-memory, resets on server restart)
let cachedGeminiKey: { key: string; timestamp: number } | null = null;
const API_KEY_CACHE_DURATION = 3600000; // 1 hour

// --- TYPES ---

type GenerateAction =
    | 'GENERATE_ARDUINO'
    | 'GENERATE_RPI'
    | 'VERIFY_ARDUINO'
    | 'VERIFY_PYTHON'
    | 'DERIVE_WIRING'
    | 'OPTIMIZE_CODE';

/** Optional per-request model configuration — supplied by ModelManager */
interface ModelConfig {
    provider: 'gemini' | 'groq' | 'openai' | 'anthropic' | 'custom';
    apiKey: string;
    model: string;
    baseUrl?: string;         // For custom/local providers
    temperature?: number;
    maxTokens?: number;
    systemPromptOverride?: string;
}

interface GenerateRequest {
    action?: GenerateAction;
    files?: ProjectFile[];
    prompt?: string;
    modelConfig?: ModelConfig;
    deviceMode?: 'arduino' | 'raspberry-pi';

    // Legacy support
    systemInstruction?: string;
    responseSchema?: Record<string, unknown>;
}

// --- HELPER: File Context ---
const getFileContext = (files: ProjectFile[] = []) => buildFileContext(files);

// --- HELPER: WIRING REGEX FALLBACK ---
const basicRegexWiring = (files: ProjectFile[] = []) => {
    const code = files.map(f => f.content).join('\n');
    const components: ArduinoComponent[] = [];
    let idCounter = 1;

    // 1. Library & Keyword Detection
    if (code.includes('Talkie')) components.push({ id: `spk_${idCounter++}`, type: ComponentType.SPEAKER, pin: 3, label: 'Talkie Speaker' });
    if (code.includes('Servo.h')) {
        const match = code.match(/\.attach\s*\(\s*(\d+)\s*\)/);
        components.push({ id: `servo_${idCounter++}`, type: ComponentType.SERVO, pin: match ? match[1] : 9, label: 'Servo' });
    }
    if (code.includes('WiFi') || code.includes('ESP8266')) {
        components.push({ id: `wifi_${idCounter++}`, type: ComponentType.MODULE_WIFI, pin: 'RX/TX', label: 'ESP8266 WiFi' });
    }
    if (code.includes('Adafruit_NeoPixel') || code.includes('FastLED')) {
        const pinMatch = code.match(/PIN\s+(\d+)/) || code.match(/(\d+)\s*,\s*NUM_LEDS/);
        components.push({ id: `neo_${idCounter++}`, type: ComponentType.NEOPIXEL, pin: pinMatch ? pinMatch[1] : 6, label: 'NeoPixel Strip' });
    }
    if (code.includes('Stepper.h')) {
        const pinMatch = code.match(/Stepper\s+\w+\s*\(\s*\w+\s*,\s*(\d+)/);
        components.push({ id: `step_${idCounter++}`, type: ComponentType.STEPPER, pin: pinMatch ? pinMatch[1] : 8, label: 'Stepper Motor' });
    }
    if (code.includes('SevSeg')) {
        components.push({ id: `seg_${idCounter++}`, type: ComponentType.SEVEN_SEGMENT, pin: 2, label: '7-Segment Display' });
    }
    if (code.includes('DHT.h')) {
        const pinMatch = code.match(/DHT\s+\w+\s*\(\s*(\w+)/);
        let pin = '2';
        if (pinMatch) {
            const def = code.match(new RegExp(`#define\\s+${pinMatch[1]}\\s+(\\w+)`));
            pin = def ? def[1] : (pinMatch[1].match(/\d+/) ? pinMatch[1] : '2');
        }
        components.push({ id: `dht_${idCounter++}`, type: ComponentType.SENSOR_DHT, pin, label: 'DHT11' });
    }

    // 2. Generic IO Detection
    const pinModeMatches = code.matchAll(/pinMode\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)/g);
    for (const match of pinModeMatches) {
        const pinName = match[1];
        const mode = match[2];
        let pinVal = pinName;

        const defineMatch = code.match(new RegExp(`#define\\s+${pinName}\\s+(\\w+)`));
        if (defineMatch) pinVal = defineMatch[1];
        if (pinName === 'LED_BUILTIN') pinVal = '13';

        if (components.some(c => String(c.pin) === String(pinVal))) continue;

        const nameLower = pinName.toLowerCase();
        let type = ComponentType.GENERIC;
        let label = 'Module';

        if (mode === 'OUTPUT') {
            if (nameLower.includes('led')) { type = ComponentType.LED; label = 'LED'; }
            else if (nameLower.includes('relay')) { type = ComponentType.RELAY; label = 'Relay'; }
            else if (nameLower.includes('buzzer')) { type = ComponentType.BUZZER; label = 'Buzzer'; }
            else if (nameLower.includes('trig')) { type = ComponentType.SENSOR_ULTRASONIC; label = 'Ultrasonic'; }
            else { type = ComponentType.GENERIC; label = 'Output Module'; }
        } else {
            if (nameLower.includes('echo')) continue;
            if (nameLower.includes('btn') || nameLower.includes('button')) { type = ComponentType.BUTTON; label = 'Button'; }
            else if (nameLower.includes('pir') || nameLower.includes('motion')) { type = ComponentType.GENERIC; label = 'PIR Sensor'; }
            else { type = ComponentType.GENERIC; label = 'Input Sensor'; }
        }
        components.push({ id: `io_${idCounter++}`, type, pin: pinVal, label });
    }

    if (components.length === 0) components.push({ id: 'def_led', type: ComponentType.LED, pin: 13, label: 'Built-in LED' });

    return { board: 'Arduino Uno', components };
};

// --- API FETCH LOGIC ---

async function fetchGeminiApiKey(): Promise<string> {
    return getGeminiApiKey();
}

interface GeminiResponse {
    text: string;
    usage?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
    };
}

async function callGemini(apiKey: string, systemInstruction: string, prompt: string, responseSchema?: Record<string, unknown>): Promise<GeminiResponse> {
    const url = `${GEMINI_API_URL}?key=${apiKey}`;
    const body: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.7 } } }]
    };
    if (responseSchema) {
        (body.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
        (body.generationConfig as Record<string, unknown>).responseSchema = responseSchema;
        // Search is generally not compatible with strict JSON schema mode in some versions, but we'll try or disable if schema is present
        // If schema is present, we might want to disable search to ensure valid JSON, OR rely on the model to use search then format.
        // For now, let's keep search enabled globally but be aware.
    }

    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Gemini API Error ${response.status}: ${await response.text()}`);
        const data = await response.json();
        if (data.promptFeedback?.blockReason) throw new Error(`Request blocked: ${data.promptFeedback.blockReason}`);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response from Gemini');

        // Extract token usage from response
        const usage = data.usageMetadata ? {
            promptTokenCount: data.usageMetadata.promptTokenCount,
            candidatesTokenCount: data.usageMetadata.candidatesTokenCount,
            totalTokenCount: data.usageMetadata.totalTokenCount
        } : undefined;

        return { text, usage };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout - AI service took too long to respond');
        }
        throw error;
    }
}

interface GroqResponse {
    text: string;
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
}

async function callGroq(apiKey: string, systemInstruction: string, prompt: string, responseSchema?: Record<string, unknown>): Promise<GroqResponse> {
    const messages = [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }];
    if (responseSchema) messages[0].content += "\n\nIMPORTANT: You MUST respond with valid JSON matching this schema:\n" + JSON.stringify(responseSchema, null, 2);

    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.2, max_tokens: 8192, response_format: responseSchema ? { type: "json_object" } : undefined }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Groq API Error ${response.status}: ${await response.text()}`);
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error('Empty response from Groq');

        // Extract token usage from response
        const usage = data.usage ? {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens
        } : undefined;

        return { text, usage };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout - AI service took too long to respond');
        }
        throw error;
    }
}

// --- MAIN HANDLER ---

export async function POST(request: NextRequest) {
    try {
        const body: GenerateRequest = await request.json();
        const { action, modelConfig, deviceMode = 'arduino' } = body;

        // Sanitize user inputs to prevent XSS
        let systemInstruction = body.systemInstruction ? sanitizeText(String(body.systemInstruction)) : '';
        let prompt = body.prompt ? sanitizeText(String(body.prompt)) : '';
        let responseSchema = body.responseSchema;
        
        // Sanitize file contents
        const sanitizedFiles: ProjectFile[] = body.files && Array.isArray(body.files) 
            ? body.files.map((file: ProjectFile) => ({
                ...file,
                name: sanitizeText(file.name),
                content: sanitizeText(file.content),
            }))
            : [];

        // === ACTION HANDLER ===
        if (action) {
            const fileCtx = getFileContext(sanitizedFiles);
            switch (action) {
                case 'GENERATE_ARDUINO':
                    systemInstruction = ARDUINO_GENERATION_PROMPT(fileCtx, prompt);
                    responseSchema = ARDUINO_GENERATION_SCHEMA;
                    break;

                case 'GENERATE_RPI':
                    systemInstruction = RPI_GENERATION_PROMPT(fileCtx, prompt);
                    responseSchema = RPI_GENERATION_SCHEMA;
                    break;

                case 'VERIFY_ARDUINO':
                    systemInstruction = VERIFY_ARDUINO_PROMPT(
                        getFileContext(sanitizedFiles.filter(f => f.type === 'code'))
                    );
                    prompt = 'Analyze the above Arduino code for errors and issues.';
                    responseSchema = VERIFY_SCHEMA;
                    break;

                case 'VERIFY_PYTHON':
                    systemInstruction = VERIFY_PYTHON_PROMPT(
                        getFileContext(sanitizedFiles.filter(f => f.name.endsWith('.py')))
                    );
                    prompt = 'Analyze the above Python code for errors, security issues, and best practice violations.';
                    responseSchema = VERIFY_SCHEMA;
                    break;

                case 'DERIVE_WIRING': {
                    const codeFiles = getFileContext(
                        sanitizedFiles.filter(f =>
                            deviceMode === 'raspberry-pi'
                                ? f.name.endsWith('.py')
                                : f.type === 'code'
                        )
                    );
                    systemInstruction =
                        deviceMode === 'raspberry-pi'
                            ? DERIVE_RPI_WIRING_PROMPT(codeFiles)
                            : DERIVE_WIRING_PROMPT(codeFiles);
                    prompt = 'Extract all hardware components and their wiring from the above code.';
                    responseSchema = DERIVE_WIRING_SCHEMA;
                    break;
                }

                case 'OPTIMIZE_CODE':
                    systemInstruction = OPTIMIZE_CODE_PROMPT(fileCtx);
                    prompt = 'Review and optimize the above project code.';
                    responseSchema = OPTIMIZE_CODE_SCHEMA;
                    break;
            }
        }

        // Validation
        if (!systemInstruction || !prompt) {
            return NextResponse.json({
                error: 'Missing required parameters',
                code: 'MISSING_PARAMS',
                details: 'Both systemInstruction and prompt are required'
            }, { status: 400 });
        }

        let result: GeminiResponse | GroqResponse | undefined;
        let provider: 'gemini' | 'groq' = 'gemini';
        let tokenUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

        // AI CALL with Retry Logic and Fallback
        // Supports: (1) caller-supplied modelConfig keys, (2) env-var Gemini, (3) env-var Groq fallback
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (modelConfig?.apiKey && modelConfig.apiKey.length > 10) {
                    // --- Use caller-supplied model config ---
                    const { provider, apiKey, model, baseUrl, temperature, maxTokens } = modelConfig;

                    if (provider === 'gemini') {
                        // Override model for this request
                        const customUrl = `${baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${model}:generateContent`;
                        const custBody: Record<string, unknown> = {
                            contents: [{ parts: [{ text: prompt }] }],
                            systemInstruction: { parts: [{ text: systemInstruction }] },
                            generationConfig: { temperature: temperature ?? 0.2, maxOutputTokens: maxTokens ?? 8192 },
                        };
                        if (responseSchema) {
                            (custBody.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
                            (custBody.generationConfig as Record<string, unknown>).responseSchema = responseSchema;
                        }
                        const ctrl = new AbortController();
                        const tid = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
                        try {
                            const resp = await fetch(`${customUrl}?key=${apiKey}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(custBody),
                                signal: ctrl.signal,
                            });
                            clearTimeout(tid);
                            if (!resp.ok) throw new Error(`Gemini API Error ${resp.status}: ${await resp.text()}`);
                            const data = await resp.json();
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (!text) throw new Error('Empty response from Gemini');
                            result = { text, usage: data.usageMetadata ? { promptTokenCount: data.usageMetadata.promptTokenCount, candidatesTokenCount: data.usageMetadata.candidatesTokenCount, totalTokenCount: data.usageMetadata.totalTokenCount } : undefined };
                            if (result.usage) tokenUsage = { prompt_tokens: (result.usage as any).promptTokenCount, completion_tokens: (result.usage as any).candidatesTokenCount, total_tokens: (result.usage as any).totalTokenCount };
                        } catch (e) { clearTimeout(tid); throw e; }

                    } else if (provider === 'groq' || provider === 'openai' || provider === 'custom') {
                        // OpenAI-compatible endpoint
                        const endpoint = provider === 'groq'
                            ? 'https://api.groq.com/openai/v1/chat/completions'
                            : (baseUrl ? `${baseUrl}/chat/completions` : 'https://api.openai.com/v1/chat/completions');
                        const messages = [
                            { role: 'system', content: systemInstruction },
                            { role: 'user', content: prompt },
                        ];
                        const ctrl = new AbortController();
                        const tid = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
                        try {
                            const resp = await fetch(endpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                                body: JSON.stringify({ model, messages, temperature: temperature ?? 0.2, max_tokens: maxTokens ?? 8192, response_format: responseSchema ? { type: 'json_object' } : undefined }),
                                signal: ctrl.signal,
                            });
                            clearTimeout(tid);
                            if (!resp.ok) throw new Error(`API Error ${resp.status}: ${await resp.text()}`);
                            const data = await resp.json();
                            const text = data.choices?.[0]?.message?.content;
                            if (!text) throw new Error('Empty response');
                            result = { text, usage: data.usage };
                            if (data.usage) tokenUsage = { prompt_tokens: data.usage.prompt_tokens, completion_tokens: data.usage.completion_tokens, total_tokens: data.usage.total_tokens };
                        } catch (e) { clearTimeout(tid); throw e; }

                    } else if (provider === 'anthropic') {
                        const ctrl = new AbortController();
                        const tid = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
                        try {
                            const resp = await fetch('https://api.anthropic.com/v1/messages', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
                                body: JSON.stringify({ model, system: systemInstruction, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens ?? 8192 }),
                                signal: ctrl.signal,
                            });
                            clearTimeout(tid);
                            if (!resp.ok) throw new Error(`Anthropic API Error ${resp.status}: ${await resp.text()}`);
                            const data = await resp.json();
                            const text = data.content?.[0]?.text;
                            if (!text) throw new Error('Empty response from Anthropic');
                            result = { text };
                            if (data.usage) tokenUsage = { prompt_tokens: data.usage.input_tokens, completion_tokens: data.usage.output_tokens, total_tokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0) };
                        } catch (e) { clearTimeout(tid); throw e; }
                    }
                    break; // Success with custom model!

                } else {
                    // --- Use environment variable keys (default) ---
                    const geminiKey = await fetchGeminiApiKey();
                    result = await callGemini(geminiKey, systemInstruction, prompt, responseSchema);
                    if (result.usage) {
                        tokenUsage = {
                            prompt_tokens: result.usage.promptTokenCount,
                            completion_tokens: result.usage.candidatesTokenCount,
                            total_tokens: result.usage.totalTokenCount
                        };
                    }
                    break; // Success!
                }
            } catch (geminiError) {
                lastError = geminiError as Error;

                // On last attempt, try Groq fallback (if available)
                if (attempt === MAX_RETRIES) {
                    if (GROQ_API_KEY) {
                        try {
                            result = await callGroq(GROQ_API_KEY, systemInstruction, prompt, responseSchema);
                            provider = 'groq';
                            if (result.usage) {
                                tokenUsage = {
                                    prompt_tokens: result.usage.prompt_tokens,
                                    completion_tokens: result.usage.completion_tokens,
                                    total_tokens: result.usage.total_tokens
                                };
                            }
                            break; // Success with Groq!
                        } catch (groqError) {
                            // Groq also failed, continue to fallback logic
                            lastError = groqError as Error;
                        }
                    }

                    // === SERVER-SIDE FALLBACK for Wiring ===
                    if (action === 'DERIVE_WIRING') {
                        const fallbackWiring = basicRegexWiring(sanitizedFiles);
                        return NextResponse.json({
                            data: fallbackWiring,
                            provider: 'fallback_regex',
                            warning: 'Using regex fallback due to AI service unavailability',
                            tokenUsage: undefined
                        });
                    }

                    // All services failed
                    return NextResponse.json({
                        error: 'AI services temporarily unavailable',
                        code: 'AI_UNAVAILABLE',
                        message: 'Please try again in a few moments. Our AI services are experiencing high demand.',
                        retryAfter: 60,
                        details: process.env.NODE_ENV === 'development' ? lastError?.message : undefined
                    }, { status: 503 });
                }

                // Wait before retry (exponential backoff)
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)));
                }
            }
        }

        // Check if we got a result
        if (!result || !result.text) {
            return NextResponse.json({
                error: 'AI services failed',
                code: 'AI_FAILED',
                message: 'Failed to get response from AI services',
                details: process.env.NODE_ENV === 'development' ? lastError?.message : undefined
            }, { status: 500 });
        }

        // PARSE JSON
        if (responseSchema) {
            try {
                const parsed = JSON.parse(result.text);
                return NextResponse.json({
                    data: parsed,
                    provider,
                    tokenUsage
                });
            } catch (parseError) {
                return NextResponse.json({
                    error: 'Invalid AI response format',
                    code: 'PARSE_ERROR',
                    message: 'AI returned malformed JSON',
                    details: process.env.NODE_ENV === 'development' ? result.text.substring(0, 200) : undefined
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            data: result.text,
            provider,
            tokenUsage
        });

    } catch (error) {
        // Log error for monitoring (replace with proper logging service in production)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            message: errorMessage
        }, { status: 500 });
    }
}
