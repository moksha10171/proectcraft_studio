/**
 * ToolPairs — sanitize message history for valid tool_use/tool_result pairing.
 * Port of Logen's Logen.AI.ToolPairs.
 */

import type { AgentMessage } from '@/lib/arduino-studio/context-compressor';

type ContentBlock = {
  type: string;
  id?: string;
  tool_use_id?: string;
  [key: string]: unknown;
};

function role(msg: AgentMessage): string {
  return msg.role;
}

function isBlockContent(content: string | ContentBlock[]): content is ContentBlock[] {
  return Array.isArray(content);
}

function blockType(block: ContentBlock): string {
  return block.type;
}

function toolUseIds(msg: AgentMessage | undefined): Set<string> {
  if (!msg || !isBlockContent(msg.content as unknown as ContentBlock[])) return new Set();
  const blocks = msg.content as unknown as ContentBlock[];
  return new Set(
    blocks.filter(b => blockType(b) === 'tool_use' && b.id).map(b => b.id as string)
  );
}

function toolResultIds(msg: AgentMessage | undefined): Set<string> {
  if (!msg || !isBlockContent(msg.content as unknown as ContentBlock[])) return new Set();
  const blocks = msg.content as unknown as ContentBlock[];
  return new Set(
    blocks
      .filter(b => blockType(b) === 'tool_result' && b.tool_use_id)
      .map(b => b.tool_use_id as string)
  );
}

function filterBlocks(
  blocks: ContentBlock[],
  msgRole: string,
  prev: AgentMessage | undefined,
  next: AgentMessage | undefined
): ContentBlock[] {
  const prevUses = toolUseIds(prev);
  const nextResults = toolResultIds(next);

  return blocks.filter(block => {
    if (blockType(block) === 'tool_result') {
      return prevUses.has(block.tool_use_id as string);
    }
    if (blockType(block) === 'tool_use' && msgRole === 'assistant') {
      return nextResults.has(block.id as string);
    }
    return true;
  });
}

function emptyContent(msg: AgentMessage): boolean {
  const c = msg.content;
  if (typeof c === 'string') return c.trim().length === 0;
  if (Array.isArray(c)) return (c as unknown[]).length === 0;
  return true;
}

function filterMessage(
  msg: AgentMessage,
  prev: AgentMessage | undefined,
  next: AgentMessage | undefined
): AgentMessage {
  if (!isBlockContent(msg.content as unknown as ContentBlock[])) return msg;
  const blocks = msg.content as unknown as ContentBlock[];
  return {
    ...msg,
    content: filterBlocks(blocks, role(msg), prev, next) as unknown as string,
  };
}

function mergeConsecutiveRoles(messages: AgentMessage[]): AgentMessage[] {
  return messages.reduce<AgentMessage[]>((acc, msg) => {
    const last = acc[acc.length - 1];
    if (last && last.role === msg.role && typeof last.content === 'string' && typeof msg.content === 'string') {
      acc[acc.length - 1] = {
        ...last,
        content: `${last.content}\n\n${msg.content}`,
      };
    } else {
      acc.push(msg);
    }
    return acc;
  }, []);
}

/** Drop orphaned tool blocks and merge consecutive same-role messages. */
export function sanitizeToolPairs(messages: AgentMessage[]): AgentMessage[] {
  if (!messages.length) return messages;

  const filtered = messages.map((msg, i) =>
    filterMessage(msg, messages[i - 1], messages[i + 1])
  );

  const nonEmpty = filtered.filter(m => !emptyContent(m));

  // Never start with tool_result
  while (nonEmpty.length > 0 && nonEmpty[0].role === 'tool_result') {
    nonEmpty.shift();
  }

  return mergeConsecutiveRoles(nonEmpty);
}

/** Convert tool_result string messages to user-role for providers without native tool format */
export function flattenToolResultsForApi(messages: AgentMessage[]): AgentMessage[] {
  return messages.map(m => {
    if (m.role === 'tool_result') {
      return {
        role: 'user' as const,
        content: `[Tool ${m.tool || 'result'}]: ${m.content}`,
      };
    }
    if (m.role === 'tool_use') {
      return {
        role: 'assistant' as const,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      };
    }
    return m;
  });
}
