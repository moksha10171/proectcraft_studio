"use client";

import React from 'react';
import { Key, Settings, Terminal, Shield } from 'lucide-react';

interface ByokSetupBannerProps {
  variant?: 'compact' | 'full';
  onOpenModelManager?: () => void;
}

const SETUP_STEPS = [
  { icon: Key, label: 'Add an API key', detail: 'Gemini, Groq, OpenAI, Anthropic, or Ollama' },
  { icon: Settings, label: 'Pick a model', detail: 'Set temperature and native tool support' },
  { icon: Terminal, label: 'Start chatting', detail: 'Use /generate, /verify, /wiring slash commands' },
] as const;

export default function ByokSetupBanner({
  variant = 'full',
  onOpenModelManager,
}: ByokSetupBannerProps) {
  if (variant === 'compact') {
    return (
      <div className="mx-3 mt-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Key size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-amber-200">Configure a model to use the agent</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Keys stay in your browser or server env — never sent to ProjectCraft.
            </p>
          </div>
          {onOpenModelManager && (
            <button
              onClick={onOpenModelManager}
              className="shrink-0 text-[10px] font-semibold text-amber-300 hover:text-amber-200 px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
            >
              Setup
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-teal-500/15">
          <Shield size={14} className="text-teal-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-200">Bring your own API key</p>
          <p className="text-[10px] text-gray-500">Self-hosted — your keys, your data</p>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {SETUP_STEPS.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-start gap-2.5">
            <div className="mt-0.5 p-1 rounded-md bg-white/5">
              <Icon size={12} className="text-teal-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-300">{label}</p>
              <p className="text-[10px] text-gray-600">{detail}</p>
            </div>
          </div>
        ))}
      </div>
      {onOpenModelManager && (
        <div className="px-4 pb-3">
          <button
            onClick={onOpenModelManager}
            className="w-full py-2 text-xs font-bold rounded-lg bg-teal-500 text-black hover:bg-teal-400 transition-colors"
          >
            Open Model Manager
          </button>
        </div>
      )}
    </div>
  );
}
