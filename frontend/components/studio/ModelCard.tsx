import React from 'react';
import {
  Bot, Shield, Zap, Globe, Cpu, CheckCircle, X,
  Activity, Clock, BarChart3, Layers, Radio
} from 'lucide-react';
import type { ModelSection, ToolCall, AgentStatus } from '@/lib/arduino-studio/agent-types';
import { PROVIDER_LABELS, TOOL_CALL_LABELS, TOOL_CALL_ICONS, getToolCallDuration } from '@/lib/arduino-studio/agent-types';
import ByokSetupBanner from '@/components/studio/ByokSetupBanner';

interface ModelCardProps {
  isOpen: boolean;
  onClose: () => void;
  deviceMode: 'arduino' | 'raspberry-pi';
  activeModel?: ModelSection | null;
  modelConfigured?: boolean;
  toolCalls?: ToolCall[];
  agentStatus?: AgentStatus;
  onOpenModelManager?: () => void;
}

export default function ModelCard({
  isOpen,
  onClose,
  deviceMode,
  activeModel,
  modelConfigured = true,
  toolCalls = [],
  agentStatus = 'idle',
  onOpenModelManager,
}: ModelCardProps) {
  if (!isOpen) return null;

  const totalTokens = toolCalls.reduce((s, tc) => s + (tc.tokenUsage?.total ?? 0), 0);
  const successCalls = toolCalls.filter(tc => tc.status === 'success').length;
  const lastCall = toolCalls.length > 0 ? toolCalls[toolCalls.length - 1] : null;

  const statusConfig: Record<AgentStatus, { label: string; color: string; pulse: boolean }> = {
    idle:       { label: 'Idle',       color: 'text-gray-400',    pulse: false },
    thinking:   { label: 'Thinking',   color: 'text-yellow-400',  pulse: true },
    generating: { label: 'Generating', color: 'text-teal-400',    pulse: true },
    verifying:  { label: 'Verifying',  color: 'text-blue-400',    pulse: true },
    error:      { label: 'Error',      color: 'text-red-400',     pulse: false },
    success:    { label: 'Ready',      color: 'text-emerald-400', pulse: false },
  };
  const statusCfg = statusConfig[agentStatus];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#1e1e1e] border border-teal-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-36 bg-gradient-to-br from-teal-900/40 via-emerald-900/20 to-black overflow-hidden flex items-end px-6 pb-5 border-b border-white/5">
          <div className="absolute top-0 right-0 p-32 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.04]" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>

          <div className="flex items-end gap-4 z-10 w-full">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg shadow-teal-900/40">
              <Bot size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white tracking-wide leading-none">
                AI Architect <span className="text-teal-400">v1.0</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {activeModel
                  ? `${activeModel.name} · ${PROVIDER_LABELS[activeModel.provider]}`
                  : modelConfigured
                    ? 'Using server environment keys'
                    : 'No API key configured'}
              </p>
              {activeModel && (
                <p className="text-[11px] text-gray-600 font-mono truncate mt-0.5">
                  {activeModel.model}
                </p>
              )}
            </div>
            {/* Live status */}
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {statusCfg.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusCfg.color.replace('text-', 'bg-').replace('-400', '-400').replace('-500', '-500')} opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusCfg.color.replace('text-', 'bg-')}`} />
              </span>
              <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">

          {!modelConfigured && (
            <ByokSetupBanner variant="full" onOpenModelManager={() => { onClose(); onOpenModelManager?.(); }} />
          )}

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#252526] rounded-xl p-3 text-center border border-white/5">
              <p className="text-lg font-bold text-teal-400 font-mono">{toolCalls.length}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Tool Calls</p>
            </div>
            <div className="bg-[#252526] rounded-xl p-3 text-center border border-white/5">
              <p className="text-lg font-bold text-emerald-400 font-mono">
                {totalTokens > 0 ? (totalTokens > 999 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens) : '—'}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Tokens</p>
            </div>
            <div className="bg-[#252526] rounded-xl p-3 text-center border border-white/5">
              <p className="text-lg font-bold text-blue-400 font-mono">{successCalls}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Successful</p>
            </div>
          </div>

          {/* Last tool call */}
          {lastCall && (
            <div className="bg-[#252526] rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Last Tool Call</p>
              <div className="flex items-center gap-2">
                <span className="text-base">{TOOL_CALL_ICONS[lastCall.action]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200">{TOOL_CALL_LABELS[lastCall.action]}</p>
                  <p className="text-[10px] text-gray-500 truncate">{lastCall.userPrompt.slice(0, 60)}…</p>
                </div>
                <div className="text-right shrink-0">
                  {lastCall.durationMs && (
                    <p className="text-[10px] text-gray-500 font-mono">{getToolCallDuration(lastCall)}</p>
                  )}
                  {lastCall.tokenUsage && (
                    <p className="text-[10px] text-teal-500 font-mono">{lastCall.tokenUsage.total.toLocaleString()}t</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Capabilities Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#252526] rounded-xl border border-white/5 hover:border-teal-500/20 transition-colors group">
              <div className="flex items-center gap-2 mb-1.5 text-gray-200 font-semibold text-sm group-hover:text-teal-400 transition-colors">
                <Cpu size={14} />
                Hardware Aware
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Optimized for {deviceMode === 'arduino' ? 'Arduino Uno/Mega' : 'Raspberry Pi 4/Zero'} architecture.
              </p>
            </div>
            <div className="p-3 bg-[#252526] rounded-xl border border-white/5 hover:border-teal-500/20 transition-colors group">
              <div className="flex items-center gap-2 mb-1.5 text-gray-200 font-semibold text-sm group-hover:text-teal-400 transition-colors">
                <Layers size={14} />
                Tool Dispatch
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Runs structured tool calls: Generate, Verify, Derive Wiring.
              </p>
            </div>
          </div>

          {/* Safety checks */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Safety & Integrity</h3>
            {[
              { icon: CheckCircle, label: 'Syntax Verification', desc: 'Local + AI double-check before display.' },
              { icon: Shield, label: 'Safe Libraries Only', desc: 'Restricted to standard open-source libraries.' },
              { icon: Globe, label: 'BYOK — Your Keys', desc: 'API keys stay on your server, never shared.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 text-emerald-500"><Icon size={14} /></div>
                <div>
                  <p className="text-sm text-gray-200 font-medium">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/5 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-teal-500 text-black font-bold text-sm rounded-lg hover:bg-teal-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
