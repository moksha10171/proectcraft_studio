/**
 * Schema Builder — convert tool registry schemas to provider-native formats
 */

import { TOOL_REGISTRY, type ToolDefinition } from '@/lib/arduino-studio/tool-registry';

export interface NativeToolSpec {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** Anthropic / generic JSON Schema tool spec */
export function buildAnthropicToolSpecs(
  tools: ToolDefinition[] = TOOL_REGISTRY
): NativeToolSpec[] {
  return tools.map(tool => ({
    name: tool.name,
    description: `${tool.purpose} Include _summary: present-tense label ≤8 words for UI.`,
    input_schema: fieldsToJsonSchema(tool.input_schema),
  }));
}

/** OpenAI function calling format */
export function buildOpenAIToolSpecs(tools: ToolDefinition[] = TOOL_REGISTRY) {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.purpose,
      parameters: fieldsToJsonSchema(tool.input_schema),
    },
  }));
}

/** Gemini function declarations */
export function buildGeminiToolSpecs(tools: ToolDefinition[] = TOOL_REGISTRY) {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.purpose,
    parameters: fieldsToJsonSchema(tool.input_schema),
  }));
}

function fieldsToJsonSchema(
  fields: ToolDefinition['input_schema']
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = ['_summary'];

  properties._summary = {
    type: 'string',
    description: 'Present-tense UI label, ≤8 words (e.g. "Generating blink sketch")',
  };

  for (const [key, field] of Object.entries(fields)) {
    if (key === '_summary') continue;
    properties[key] = {
      type: mapType(field.type),
      description: field.description,
    };
    if (field.required) required.push(key);
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

function mapType(t: string): string {
  switch (t) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'array': return 'array';
    case 'object': return 'object';
    default: return 'string';
  }
}

export function providerSupportsNativeTools(provider: string): boolean {
  return ['anthropic', 'openai', 'gemini', 'groq'].includes(provider);
}
