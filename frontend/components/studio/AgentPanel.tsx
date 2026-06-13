"use client";

import React, { useState } from 'react';
import {
  Bot, ChevronDown, ChevronRight, Clock, CheckCircle2,
  XCircle, Loader2, Terminal, Cpu, Eye, EyeOff, BarChart3,
  Activity
} from 'lucide-react';
import type { ToolCallEntry, AgentStatus } from '@/hooks/useAgentEngine';
import type { ModelSection } from '@/lib/arduino-studio/agent-types';
import { PROVIDER_LABELS } from '@/lib/arduino-studio/agent-types';
import ByokSetupBanner from '@/components/studio/ByokSetupBanner';

// ─── Status indicator ──────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AgentStatus }) {
  const config: Record<AgentStatus, { color: string; pulse: boolean; label: string }> = {
    idle:         { color: 'bg-gray-500',    pulse: false, label: 'Idle' },
    thinking:     { color: 'bg-yellow-400',  pulse: true,  label: 'Thinking' },
    streaming:    { color: 'bg-teal-400',    pulse: true,  label: 'Generating' },
    calling_tool: { color: 'bg-blue-400',    pulse: true,  label: 'Tool Call' },
    error:        { color: 'bg-red-500',     pulse: false, label: 'Error' },
    done:         { color: 'bg-emerald-400', pulse: false, label: 'Ready' },
  };
  const { color, pulse, label } = config[status] ?? config.idle;
  return (
    <span className="flex items-center gap-1.5" title={label}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </span>
  );
}

// ─── Tool Call Row — uses canonical backend shape ──────────────────────────────

function ToolCallRow({ tc }: { tc: ToolCallEntry }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    running: <Loader2 size={14} className="text-teal-400 animate-spin" />,
    success: <CheckCircle2 size={14} className="text-emerald-400" />,
    error:   <XCircle size={14} className="text-red-400" />,
  }[tc.status] ?? <Loader2 size={14} className="text-gray-400 animate-spin" />;

  const rowColor = {
    running: 'border-teal-500/30 bg-teal-500/5',
    success: 'border-emerald-500/20',
    error:   'border-red-500/20 bg-red-500/5',
  }[tc.status] ?? 'border-gray-700/50';

  const durationText = tc.elapsedMs != null
    ? tc.elapsedMs < 1000 ? `${tc.elapsedMs}ms` : `${(tc.elapsedMs / 1000).toFixed(1)}s`
    : null;

  return (
    <div className={`rounded-lg border ${rowColor} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        {statusIcon}
        <span className="text-base">{tc.emoji}</span>
        <span className="flex-1 text-xs font-medium text-gray-200 truncate">{tc.label || tc.tool}</span>
        {durationText && <span className="text-[10px] text-gray-500 shrink-0">{durationText}</span>}
        {expanded ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
          {tc.result && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Output</p>
              <pre className="text-[11px] text-emerald-400 bg-black/30 rounded p-2 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {tc.result}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-4 pt-1">
            {(tc.provider || tc.model) && (
              <span className="text-[10px] text-gray-500">
                <span className="text-gray-400">{tc.provider ? PROVIDER_LABELS[tc.provider as keyof typeof PROVIDER_LABELS] ?? tc.provider : ''}</span>
                {tc.model && <span className="ml-1 text-gray-600">· {tc.model}</span>}
              </span>
            )}
          </div>

          {tc.filesModified && tc.filesModified.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tc.filesModified.map(f => (
                <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono border border-teal-500/20">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Session Stats ─────────────────────────────────────────────────────────────

function SessionStats({ toolCalls }: { toolCalls: ToolCallEntry[] }) {
  const successCount = toolCalls.filter(tc => tc.status === 'success').length;
  const avgMs = toolCalls.filter(tc => tc.elapsedMs).length > 0
    ? Math.round(toolCalls.reduce((s, tc) => s + (tc.elapsedMs ?? 0), 0) / toolCalls.filter(tc => tc.elapsedMs).length)
    : 0;

  return (
    <div className="grid grid-cols-3 gap-2 p-3 bg-black/20 rounded-lg border border-white/5">
      <div className="text-center">
        <p className="text-base font-bold text-teal-400 font-mono">{toolCalls.length}</p>
        <p className="text-[10px] text-gray-500">Tool Calls</p>
      </div>
      <div className="text-center border-x border-white/5">
        <p className="text-base font-bold text-emerald-400 font-mono">{successCount}</p>
        <p className="text-[10px] text-gray-500">Succeeded</p>
      </div>
      <div className="text-center">
        <p className="text-base font-bold text-blue-400 font-mono">
          {avgMs > 0 ? `${(avgMs / 1000).toFixed(1)}s` : '—'}
        </p>
        <p className="text-[10px] text-gray-500">Avg Time</p>
      </div>
    </div>
  );
}

// ─── Main AgentPanel ───────────────────────────────────────────────────────────

interface AgentPanelProps {
  status: AgentStatus;
  activeModel: ModelSection | null;
  toolCalls: ToolCallEntry[];
  modelConfigured?: boolean;
  onClearHistory: () => void;
  onOpenModelManager?: () => void;
}

export default function AgentPanel({
  status,
  activeModel,
  toolCalls,
  modelConfigured = true,
  onClearHistory,
  onOpenModelManager,
}: AgentPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none">AI Agent</p>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              {activeModel ? activeModel.name : 'No model configured'}
            </p>
          </div>
        </div>
        <StatusDot status={status} />
      </div>

      {/* Active model info */}
      {activeModel ? (
        <div className="px-4 py-2 border-b border-white/5 bg-[#0d1117]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={12} className="text-teal-500" />
              <span className="text-[11px] text-gray-300 font-mono">{activeModel.model}</span>
            </div>
            <span className="text-[10px] text-gray-600 uppercase tracking-wider">
              {PROVIDER_LABELS[activeModel.provider]}
            </span>
          </div>
          {(status === 'calling_tool') && (
            <div className="flex items-center gap-1.5 mt-1">
              <Activity size={10} className="text-teal-400 animate-pulse" />
              <span className="text-[10px] text-teal-400">Running tool…</span>
            </div>
          )}
        </div>
      ) : !modelConfigured ? (
        <ByokSetupBanner variant="full" onOpenModelManager={onOpenModelManager} />
      ) : null}

      {/* Session stats */}
      {toolCalls.length > 0 && (
        <div className="px-3 py-2 border-b border-white/5">
          <SessionStats toolCalls={toolCalls} />
        </div>
      )}

      {/* Tool call log */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-3 py-2 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 z-10">
          <div className="flex items-center gap-1.5">
            <Terminal size={11} className="text-gray-500" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tool Call Log</span>
            {toolCalls.length > 0 && (
              <span className="ml-1 text-[10px] bg-teal-500/20 text-teal-400 rounded-full px-1.5 py-0 font-mono">
                {toolCalls.length}
              </span>
            )}
          </div>
          {toolCalls.length > 0 && (
            <button onClick={onClearHistory} className="text-[10px] text-gray-600 hover:text-red-400 transition-colors">
              Clear
            </button>
          )}
        </div>

        <div className="p-3 space-y-2">
          {toolCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-4 bg-teal-500/10 rounded-2xl mb-3">
                <Bot size={28} className="text-teal-500 opacity-60" />
              </div>
              <p className="text-xs font-medium text-gray-400">No tool calls yet</p>
              <p className="text-[11px] text-gray-600 mt-1 max-w-[200px] leading-relaxed">
                {modelConfigured
                  ? 'Send a message or try /generate, /verify, /wiring in chat'
                  : 'Configure a model first, then ask the agent to generate code'}
              </p>
              {modelConfigured && (
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {['/generate', '/verify', '/wiring', '/optimize'].map(cmd => (
                    <span key={cmd} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-gray-500 border border-white/5">
                      {cmd}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            [...toolCalls].reverse().map(tc => (
              <ToolCallRow key={tc.id} tc={tc} />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/5 flex items-center gap-3 bg-[#161b22]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          <span className="text-[10px] text-gray-600">Success</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="text-[10px] text-gray-600">Error</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart3 size={10} className="text-gray-600" />
          <span className="text-[10px] text-gray-600">Backend-owned loop</span>
        </div>
      </div>
    </div>
  );
}
