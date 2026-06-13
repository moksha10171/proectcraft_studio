"use client";

/**
 * Terminal — ProjectCraft Studio AI Chat Panel
 *
 * Full Logen-inspired agent chat UI with:
 *   - Streaming tokens (word-by-word render)
 *   - Inline tool call chips (spinner → ✓ + elapsed ms)
 *   - Context usage circular SVG meter
 *   - Steer / Defer toggle while agent is processing
 *   - Queued message chips (cancelable)
 *   - Slash-command palette (/generate, /verify, /wiring, /optimize, /web, /model, /clear)
 *   - Model badge on each AI message
 *   - Stop generation button
 *   - Thinking indicator (3-dot bounce)
 *   - Collapsible thinking blocks (extended reasoning)
 *   - Message show-more/less (clamp at 400 chars)
 *   - Copy message button on hover
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Send, Square, Sparkles, Lightbulb, Cpu, Code, Zap,
  Copy, Check, Trash2, Bot, GitCompare, FileEdit, Wand2,
  ChevronRight, Globe, X, ArrowUp
} from 'lucide-react';
import ChatCodeBlock from './chat-code-block';
import { getSlashCommands, type SlashCommand } from '@/lib/arduino-studio/tool-registry';
import { contextUsageColor, contextUsageLabel, formatTokenCount } from '@/lib/arduino-studio/context-compressor';
import type { ChatMessage, ToolCallEntry, QueuedMessage, ContextUsage } from '@/hooks/useAgentEngine';
import ByokSetupBanner from '@/components/studio/ByokSetupBanner';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TerminalProps {
  // Agent engine state (from useAgentEngine)
  messages: ChatMessage[];
  isThinking: boolean;
  contextUsage: ContextUsage;
  queuedMessages: QueuedMessage[];
  steerMode: 'steer' | 'defer';
  onSendMessage: (msg: string) => void;
  onStopGeneration: () => void;
  onCancelQueuedMessage: (id: string) => void;
  onSetSteerMode: (mode: 'steer' | 'defer') => void;
  onClearHistory: () => void;

  // Code editor integration
  onApplyCode?: (code: string, fileName?: string) => void;
  selectedCode?: { text: string; startLine: number; endLine: number } | null;
  activeFileName?: string;
  deviceMode?: 'arduino' | 'raspberry-pi';
  onOpenDiffPreview?: () => void;
  onOpenModelManager?: () => void;
  modelConfigured?: boolean;
  draftInput?: string;
  onDraftChange?: (value: string) => void;

  // Legacy support (for non-agent mode)
  legacyChatHistory?: Array<{ role: 'user' | 'model'; text: string; isError?: boolean; hasChanges?: boolean }>;
  isProcessing?: boolean;
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const ARDUINO_PROMPTS = [
  { icon: Lightbulb, label: "LED Blink", prompt: "Create a simple LED blink sketch for pin 13" },
  { icon: Cpu, label: "Sensor", prompt: "Read a DHT11 temperature sensor and display on Serial" },
  { icon: Code, label: "Servo", prompt: "Control a servo motor with a potentiometer" },
  { icon: Zap, label: "Button", prompt: "Turn on LED when button is pressed with debounce" },
];

const RPI_PROMPTS = [
  { icon: Lightbulb, label: "LED Blink", prompt: "Create a GPIO LED blink script for pin 17" },
  { icon: Cpu, label: "Temperature", prompt: "Read BME280 sensor and print temperature/humidity" },
  { icon: Code, label: "Servo PWM", prompt: "Control a servo motor using hardware PWM on RPi" },
  { icon: Zap, label: "Button", prompt: "React to button press with GPIO input and debounce" },
];

// ─── Context Usage Meter (circular SVG) ─────────────────────────────────────

function ContextMeter({ usage }: { usage: ContextUsage }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = contextUsageColor(usage.percent);
  const label = contextUsageLabel(usage.percent);
  const circumference = 2 * Math.PI * 14; // r=14
  const strokeDash = (usage.percent / 100) * circumference;

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <div className="cursor-default">
        <svg viewBox="0 0 36 36" className="w-5 h-5" aria-label={`Context usage: ${usage.percent}%`}>
          <circle cx="18" cy="18" r="14" fill="none" stroke="#333" strokeWidth="5" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        </svg>
      </div>
      {showTooltip && (
        <div className="absolute right-0 bottom-full mb-2 w-52 rounded-xl border shadow-xl p-3 z-50"
          style={{ background: '#1e1e1e', borderColor: '#333' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-200">Context Usage</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: `${color}20`, color }}>
              {label}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mb-2" style={{ background: '#333' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${usage.percent}%`, background: color }} />
          </div>
          <div className="flex justify-between text-[11px] text-gray-500">
            <span>{formatTokenCount(usage.usedTokens)} used</span>
            <span>{formatTokenCount(usage.maxTokens)} max</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool Call Chip ───────────────────────────────────────────────────────────

function ToolCallChip({ tc }: { tc: ToolCallEntry }) {
  return (
    <div className="flex items-center gap-2 text-xs pl-10 py-1 animate-fadeIn"
      style={{ animationDuration: '0.2s', marginTop: '-4px' }}>
      {tc.status === 'running' ? (
        <span className="ws-tool-spinner inline-block w-2.5 h-2.5 rounded-full border border-[#444] border-t-sky-500"
          style={{ animation: 'spin 0.6s linear infinite' }} />
      ) : tc.status === 'error' ? (
        <span className="text-red-400 text-[11px] font-semibold">✕</span>
      ) : (
        <span className="text-emerald-400 text-[11px] font-semibold">✓</span>
      )}
      <span className="font-medium text-gray-400">{tc.emoji} {tc.label}</span>
      {tc.elapsedMs && (
        <span className="text-gray-600">{tc.elapsedMs}ms</span>
      )}
    </div>
  );
}

// ─── Thinking Block (collapsible) ─────────────────────────────────────────────

function ThinkingBlock({ content, active }: { content: string; active?: boolean }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className="pl-10 py-1">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ChevronRight size={12} className={`transition-transform ${collapsed ? '' : 'rotate-90'}`} />
        {!collapsed && active
          ? <span className="opacity-60" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>Thinking…</span>
          : <span>Thought for a moment</span>
        }
      </button>
      {!collapsed && (
        <pre className="mt-1 px-1 text-[11px] text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      )}
    </div>
  );
}

// ─── Model Badge ─────────────────────────────────────────────────────────────

function ModelBadge({ model, role }: { model?: string; role?: string }) {
  if (!model && !role) return null;
  return (
    <div className="flex items-center gap-1 mt-1 px-1">
      {role && (
        <span className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
          {role}
        </span>
      )}
      {model && (
        <span className="text-[10px] font-mono text-gray-600">{model}</span>
      )}
    </div>
  );
}

// ─── Message Component ────────────────────────────────────────────────────────

interface MessageItemProps {
  msg: ChatMessage;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onOpenDiffPreview?: () => void;
  onApplyCode?: (code: string, fileName?: string) => void;
  activeFileName?: string;
}

const MessageItem = React.memo(({ msg, onCopy, copiedId, onOpenDiffPreview, onApplyCode, activeFileName }: MessageItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const shouldClamp = msg.role === 'assistant' && !msg.isStreaming && msg.content.length > 400;
  const hasCodeBlocks = msg.role === 'assistant' && msg.content.includes('```');

  const handleApply = useCallback((code: string, fileName?: string) => {
    onApplyCode?.(code, fileName || activeFileName);
  }, [onApplyCode, activeFileName]);

  // Render markdown with code block extraction
  const rendered = useMemo(() => {
    const text = msg.content;
    const elements: React.ReactNode[] = [];
    let key = 0;
    let buf = '';
    let inCode = false;
    let codeLang = '';
    let codeContent = '';

    const flushText = () => {
      if (!buf.trim()) { buf = ''; return; }
      const lines = buf.split('\n');
      for (const line of lines) {
        if (line.startsWith('### ')) {
          elements.push(<h3 key={key++} className="text-sm font-bold text-sky-400 mt-3 mb-1">{line.slice(4)}</h3>);
        } else if (line.startsWith('## ')) {
          elements.push(<h2 key={key++} className="text-sm font-bold text-sky-300 mt-3 mb-1">{line.slice(3)}</h2>);
        } else if (line.startsWith('# ')) {
          elements.push(<h1 key={key++} className="text-base font-bold text-sky-200 mt-3 mb-1">{line.slice(2)}</h1>);
        } else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          elements.push(<li key={key++} className="ml-4 mb-0.5 list-disc opacity-90">{line.trim().slice(2)}</li>);
        } else if (/^\d+\.\s/.test(line.trim())) {
          elements.push(<li key={key++} className="ml-4 mb-0.5 list-decimal opacity-90">{line.trim().replace(/^\d+\.\s/, '')}</li>);
        } else if (!line.trim()) {
          elements.push(<div key={key++} className="h-2" />);
        } else {
          // Inline bold + code
          const parts: React.ReactNode[] = [];
          let li = 0;
          const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
          let m: RegExpExecArray | null;
          while ((m = re.exec(line)) !== null) {
            if (m.index > li) parts.push(line.slice(li, m.index));
            if (m[1]) parts.push(<code key={`c${key}${m.index}`} className="bg-[#1a1a1a] text-teal-400 px-1.5 py-0.5 rounded text-xs font-mono">{m[1]}</code>);
            else if (m[2]) parts.push(<strong key={`b${key}${m.index}`} className="text-sky-300 font-semibold">{m[2]}</strong>);
            li = m.index + m[0].length;
          }
          if (li < line.length) parts.push(line.slice(li));
          elements.push(<p key={key++} className="mb-1.5 opacity-90 leading-relaxed">{parts}</p>);
        }
      }
      buf = '';
    };

    for (const line of text.split('\n')) {
      if (line.startsWith('```') && !inCode) {
        flushText();
        inCode = true;
        codeLang = line.slice(3).trim() || 'cpp';
        codeContent = '';
      } else if (line === '```' && inCode) {
        let fileName: string | undefined;
        if (codeLang.includes('.')) { fileName = codeLang; codeLang = codeLang.split('.').pop() || 'cpp'; }
        elements.push(
          <ChatCodeBlock key={key++} code={codeContent} language={codeLang} fileName={fileName}
            onApply={handleApply} showApplyButton={!!onApplyCode} />
        );
        inCode = false; codeContent = ''; codeLang = '';
      } else if (inCode) {
        codeContent += (codeContent ? '\n' : '') + line;
      } else {
        buf += (buf ? '\n' : '') + line;
      }
    }
    flushText();
    if (elements.length === 0 && text) {
      elements.push(<p key={0} className="whitespace-pre-wrap opacity-90">{text}</p>);
    }
    return elements;
  }, [msg.content, handleApply, onApplyCode]);

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end animate-fadeIn" style={{ animationDuration: '0.3s' }}>
        <div className="max-w-[80%]">
          <div className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed relative group"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white' }}>
            <p className="whitespace-pre-wrap">{msg.content}</p>
            <button
              onClick={() => onCopy(msg.content, msg.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              aria-label="Copy message"
            >
              {copiedId === msg.id ? <Check size={11} className="text-white" /> : <Copy size={11} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Thinking/tool_call inline messages
  if (msg.type === 'thinking' && msg.thinking) {
    return <ThinkingBlock content={msg.thinking} active={msg.isStreaming} />;
  }

  // Tool call rows (standalone)
  if (msg.type === 'tool_call' && msg.toolCalls) {
    return (
      <>
        {msg.toolCalls.map(tc => <ToolCallChip key={tc.id} tc={tc} />)}
      </>
    );
  }

  // Assistant message
  return (
    <div className="animate-fadeIn" style={{ animationDuration: '0.3s' }}>
      {/* Thinking blocks inline */}
      {msg.thinking && <ThinkingBlock content={msg.thinking} active={msg.isStreaming} />}

      {/* Tool calls inline */}
      {msg.toolCalls?.map(tc => <ToolCallChip key={tc.id} tc={tc} />)}

      {/* Main message */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-7 w-7 mt-0.5 shrink-0 rounded-xl border flex items-center justify-center"
          style={{ background: '#1e2033', borderColor: '#333', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }}>
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#8b5cf6' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest mb-1.5 text-gray-600">Architect</p>

          <div className={`relative group`}>
            <div
              className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-gray-200 
                ${shouldClamp && !expanded ? 'overflow-hidden' : ''}`}
              style={{
                background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : '#252526',
                border: msg.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid #333',
                maxHeight: shouldClamp && !expanded ? '160px' : undefined,
              }}
            >
              {msg.type === 'error'
                ? <p className="text-red-400">⚠️ {msg.content}</p>
                : <>{rendered}</>
              }

              {/* Streaming cursor */}
              {msg.isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-sky-400 ml-0.5 animate-blink align-middle" />
              )}
            </div>

            {/* Copy button on hover */}
            {!msg.isStreaming && (
              <button
                onClick={() => onCopy(msg.content, msg.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md"
                style={{ background: '#1e1e1e' }}
                aria-label="Copy message"
              >
                {copiedId === msg.id
                  ? <Check size={11} className="text-emerald-400" />
                  : <Copy size={11} className="text-gray-500" />}
              </button>
            )}
          </div>

          {/* Show more/less */}
          {shouldClamp && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[11px] font-medium mt-1 px-1"
              style={{ color: '#8b5cf6' }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}

          {/* Diff preview + model badge */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {msg.modelName && <ModelBadge model={msg.modelName} role={msg.modelRole} />}
            {(msg as ChatMessage & { hasChanges?: boolean }).hasChanges && onOpenDiffPreview && (
              <button
                onClick={onOpenDiffPreview}
                className="flex items-center gap-1 text-[10px] text-sky-400 px-2 py-0.5 rounded-full border border-sky-700/40"
              >
                <GitCompare size={10} /> Review Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
MessageItem.displayName = 'MessageItem';

// ─── Slash Command Palette ────────────────────────────────────────────────────

function SlashPalette({
  query,
  activeIdx,
  onSelect,
  commands,
}: {
  query: string;
  activeIdx: number;
  onSelect: (cmd: SlashCommand) => void;
  commands: SlashCommand[];
}) {
  const filtered = useMemo(() =>
    commands.filter(c => c.key.includes(query.toLowerCase())),
    [commands, query]
  );

  if (filtered.length === 0) return null;

  return (
    <div className="absolute left-0 bottom-full mb-2 w-80 rounded-xl border shadow-2xl overflow-hidden z-50 py-1"
      style={{ background: '#1e1e1e', borderColor: '#333' }}>
      {filtered.map((cmd, idx) => (
        <button
          key={cmd.key}
          onClick={() => onSelect(cmd)}
          className="w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-colors"
          style={{ background: idx === activeIdx ? '#2a2a2a' : undefined }}
        >
          <span className="w-24 shrink-0 text-right text-[13px] font-mono font-medium text-purple-400">{cmd.label}</span>
          <span className="flex-1 text-[12px] text-gray-500">{cmd.desc}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Terminal Component ──────────────────────────────────────────────────

const Terminal: React.FC<TerminalProps> = ({
  messages,
  isThinking,
  contextUsage,
  queuedMessages,
  steerMode,
  onSendMessage,
  onStopGeneration,
  onCancelQueuedMessage,
  onSetSteerMode,
  onClearHistory,
  onApplyCode,
  selectedCode,
  activeFileName,
  deviceMode = 'arduino',
  onOpenDiffPreview,
  onOpenModelManager,
  modelConfigured = true,
  draftInput: draftInputProp,
  onDraftChange,
  // Legacy support
  legacyChatHistory,
  isProcessing,
}) => {
  const [input, setInput] = useState('');
  const draftLoadedRef = useRef(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [commandPalette, setCommandPalette] = useState<{ query: string; activeIdx: number } | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const SUGGESTED = deviceMode === 'arduino' ? ARDUINO_PROMPTS : RPI_PROMPTS;
  const slashCommands = useMemo(() => getSlashCommands(deviceMode), [deviceMode]);

  // Use agent messages or legacy history
  const isLegacyMode = !messages || messages.length === 0 && !!legacyChatHistory;
  const hasMessages = messages.length > 0 || (legacyChatHistory?.length ?? 0) > 0;

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isThinking, legacyChatHistory]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  // Focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Restore draft input from persistence once
  useEffect(() => {
    if (draftLoadedRef.current || draftInputProp === undefined) return;
    if (draftInputProp) setInput(draftInputProp);
    draftLoadedRef.current = true;
  }, [draftInputProp]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    onDraftChange?.(val);

    // Detect slash commands
    if (val.startsWith('/') && !val.includes(' ')) {
      setCommandPalette({ query: val, activeIdx: 0 });
    } else {
      setCommandPalette(null);
    }
  };

  const handleSlashSelect = (cmd: SlashCommand) => {
    setCommandPalette(null);
    if (cmd.action === 'OPEN_MODEL_MANAGER') {
      onOpenModelManager?.();
      setInput('');
    } else if (cmd.action === 'CLEAR_HISTORY') {
      onClearHistory();
      setInput('');
    } else if (cmd.tool) {
      // Insert slash command as a prompt
      setInput(cmd.key + ' ');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (commandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const filtered = slashCommands.filter(c => c.key.includes(commandPalette.query));
        setCommandPalette(p => p ? { ...p, activeIdx: Math.min(p.activeIdx + 1, filtered.length - 1) } : null);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCommandPalette(p => p ? { ...p, activeIdx: Math.max(p.activeIdx - 1, 0) } : null);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const filtered = slashCommands.filter(c => c.key.includes(commandPalette.query));
        const cmd = filtered[commandPalette.activeIdx];
        if (cmd) handleSlashSelect(cmd);
        return;
      }
      if (e.key === 'Escape') {
        setCommandPalette(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || !modelConfigured) return;
    let msg = input.trim();

    // Prepend selected code context
    if (selectedCode?.text) {
      msg = `[Selection from ${activeFileName || 'editor'}, lines ${selectedCode.startLine}-${selectedCode.endLine}]\n\`\`\`\n${selectedCode.text}\n\`\`\`\n\n${msg}`;
    }

    onSendMessage(msg);
    setInput('');
    onDraftChange?.('');
    setCommandPalette(null);
  };

  const thinking = isThinking || isProcessing;

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] font-sans overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="h-12 bg-[#252526] border-b border-[#1a1a1a] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl border flex items-center justify-center"
            style={{ background: '#1e2033', borderColor: '#333', boxShadow: '0 0 12px rgba(139,92,246,0.25)' }}>
            <div className={`h-2 w-2 rounded-full ${thinking ? 'animate-pulse' : ''}`}
              style={{ background: '#8b5cf6' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-200">AI Architect</h2>
          </div>
          {thinking && (
            <span className="text-[10px] bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full border border-purple-700/40 animate-pulse">
              {isThinking ? 'Thinking…' : 'Generating…'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasMessages && (
            <button
              onClick={onClearHistory}
              className="text-xs text-gray-600 hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333] transition-colors"
              aria-label="Clear chat history"
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Selection Banner ────────────────────────────────────────────── */}
      {selectedCode?.text && (
        <div className="bg-sky-900/20 border-b border-sky-700/20 px-4 py-2 flex items-center gap-2">
          <Wand2 size={13} className="text-sky-400 shrink-0" />
          <span className="text-xs text-sky-300">
            Editing selection from <strong className="text-sky-200">{activeFileName || 'editor'}</strong>
            <span className="text-sky-500/70 ml-1">(lines {selectedCode.startLine}–{selectedCode.endLine})</span>
          </span>
        </div>
      )}

      {/* ── Message List ─────────────────────────────────────────────────── */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar" role="log" aria-live="polite">

        {/* Empty state */}
        {!hasMessages && (
          <div className="h-full flex flex-col items-center justify-center pb-8">
            <div className="relative flex items-center justify-center mb-8" style={{ width: 80, height: 80 }}>
              <span className="absolute rounded-xl" style={{ width: 48, height: 48, border: '1.5px solid #8b5cf6', animation: 'pulseRing 2.8s ease-out infinite' }} />
              <span className="absolute rounded-xl" style={{ width: 48, height: 48, border: '1.5px solid #8b5cf6', animation: 'pulseRing 2.8s ease-out infinite', animationDelay: '1.4s' }} />
              <div className="relative z-10 grid place-items-center rounded-xl"
                style={{ width: 46, height: 46, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 10px 30px -8px rgba(139,92,246,0.6)' }}>
                <Sparkles size={20} className="text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              {modelConfigured ? 'AI Architect Ready' : 'Configure your model'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 text-center max-w-xs leading-relaxed">
              {modelConfigured
                ? `Describe your ${deviceMode === 'arduino' ? 'Arduino' : 'Raspberry Pi'} project and I'll generate code, wiring, and more.`
                : 'Add an API key in Model Manager to start generating code and wiring.'}
            </p>
            {!modelConfigured && onOpenModelManager && (
              <div className="w-full max-w-sm mb-4">
                <ByokSetupBanner variant="compact" onOpenModelManager={onOpenModelManager} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTED.map((s, i) => (
                <button key={i} onClick={() => onSendMessage(s.prompt)}
                  disabled={thinking || !modelConfigured}
                  className="flex items-center gap-2 p-3 rounded-lg text-left transition-all disabled:opacity-50"
                  style={{ background: '#252526', border: '1px solid #333' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#333'; }}
                >
                  <s.icon size={14} className="text-purple-400 shrink-0" />
                  <span className="text-xs text-gray-400">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-600 mt-6">Type <span className="text-purple-400 font-mono">/</span> for slash commands</p>
          </div>
        )}

        {/* Agent messages */}
        {messages.map(msg => (
          <MessageItem
            key={msg.id}
            msg={msg}
            onCopy={handleCopy}
            copiedId={copiedId}
            onOpenDiffPreview={onOpenDiffPreview}
            onApplyCode={onApplyCode}
            activeFileName={activeFileName}
          />
        ))}

        {/* Legacy chat fallback */}
        {isLegacyMode && legacyChatHistory?.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'text-white'
                : 'text-gray-200'
            }`} style={{
              background: msg.role === 'user' ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : '#252526',
              border: msg.role === 'user' ? 'none' : '1px solid #333',
            }}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {thinking && (
          <div className="flex items-center gap-2.5 animate-fadeIn">
            <div className="h-7 w-7 shrink-0 rounded-xl border flex items-center justify-center"
              style={{ background: '#1e2033', borderColor: '#333', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }}>
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#8b5cf6' }} />
            </div>
            <span className="flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="inline-block rounded-full"
                  style={{ width: 5, height: 5, background: '#6b7280', animation: `typingDot 1.4s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </span>
          </div>
        )}
      </div>

      {/* ── Input Area ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 relative" style={{ background: '#252526', borderTop: '1px solid #1a1a1a' }}>

        {/* Slash-command palette */}
        {commandPalette && (
          <SlashPalette
            query={commandPalette.query}
            activeIdx={commandPalette.activeIdx}
            onSelect={handleSlashSelect}
            commands={slashCommands}
          />
        )}

        {/* Queued message chips */}
        {queuedMessages.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            {queuedMessages.map(q => (
              <div key={q.id} className="flex items-center gap-2 text-[12px] px-2.5 py-1.5 rounded-lg"
                style={{ background: '#1e1e1e', color: '#6b7280', border: '1px dashed #333' }}>
                <span className="text-[11px] opacity-60">⏳</span>
                <span className="flex-1 truncate">{q.text}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-60 shrink-0">
                  {q.disposition === 'defer' ? 'after build' : 'steering'}
                </span>
                <button onClick={() => onCancelQueuedMessage(q.id)} className="opacity-50 hover:opacity-100 shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Steer / Defer toggle (visible while thinking) */}
        {thinking && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[11px] text-gray-600 mr-1">New message:</span>
            <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: '#333' }}>
              {(['steer', 'defer'] as const).map(mode => (
                <button key={mode} onClick={() => onSetSteerMode(mode)}
                  className="px-2.5 py-1 text-[11px] font-medium transition-colors"
                  style={steerMode === mode
                    ? { background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }
                    : { color: '#6b7280' }}>
                  {mode === 'steer' ? 'Steer now' : 'After build'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input form */}
        <div className="flex items-end gap-2 px-3 py-2 rounded-2xl"
          style={{ background: '#1e1e1e', border: '1.5px solid #333', transition: 'border-color 0.2s' }}
          onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)'; }}
          onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#333'; }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              !modelConfigured
                ? 'Configure a model in Model Manager first…'
                : selectedCode
                  ? 'Ask about the selected code…'
                  : 'Message the Architect…'
            }
            disabled={!modelConfigured}
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-gray-200 resize-none"
            style={{ maxHeight: 160, lineHeight: 1.5, padding: '4px 0', fontFamily: 'inherit' }}
            aria-label="Message input"
          />

          {/* Context meter */}
          {contextUsage.usedTokens > 0 && (
            <ContextMeter usage={contextUsage} />
          )}

          {/* Stop / Send button */}
          {thinking ? (
            <button
              onClick={onStopGeneration}
              className="h-8 w-8 grid place-items-center rounded-lg shrink-0 transition-all"
              style={{ background: '#2a2a2a', border: '1px solid #444', color: '#6b7280' }}
              aria-label="Stop generation"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || !modelConfigured}
              className="h-8 w-8 grid place-items-center rounded-lg shrink-0 transition-all disabled:opacity-30"
              style={{ background: '#8b5cf6', color: 'white' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
              aria-label="Send message"
            >
              <ArrowUp size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes typingDot { 0%,100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0% { transform: scale(0.72); opacity: 0.5; } 100% { transform: scale(1.85); opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
        .animate-blink { animation: blink 1s step-end infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default Terminal;
