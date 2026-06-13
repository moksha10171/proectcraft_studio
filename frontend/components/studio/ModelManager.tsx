"use client";

import React, { useState } from 'react';
import {
  Plus, Trash2, Check, Edit3, Key, Bot, ChevronDown,
  Server, Sparkles, AlertCircle, Eye, EyeOff, Settings2,
  GripVertical, Radio, Wifi, WifiOff, Loader2
} from 'lucide-react';
import type { ModelSection, AIProvider } from '@/lib/arduino-studio/agent-types';
import {
  createModelSection, PROVIDER_LABELS, PROVIDER_DEFAULT_MODELS,
  PROVIDER_BASE_URLS
} from '@/lib/arduino-studio/agent-types';

// ─── Provider badge ───────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<AIProvider, string> = {
  gemini:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  groq:      'bg-orange-500/10 text-orange-400 border-orange-500/20',
  openai:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  anthropic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  custom:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function ProviderBadge({ provider }: { provider: AIProvider }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${PROVIDER_COLORS[provider]}`}>
      {PROVIDER_LABELS[provider]}
    </span>
  );
}

// ─── API Key Input ────────────────────────────────────────────────────────────

function ApiKeyInput({
  value,
  onChange,
  placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-xs text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-teal-500/50 transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
      >
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  );
}

// ─── Single model editor card ─────────────────────────────────────────────────

function ModelCard({
  model,
  isActive,
  onActivate,
  onUpdate,
  onDelete,
}: {
  model: ModelSection;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (updates: Partial<ModelSection>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const hasKey = model.apiKey.length > 10;

  async function handleTest() {
    setTestStatus('testing');
    setTestError('');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hi' }],
          modelConfig: {
            provider: model.provider,
            apiKey: model.apiKey,
            model: model.model,
            baseUrl: model.baseUrl,
            maxTokens: 16,
          },
        }),
      });
      if (!res.ok) {
        setTestError(`HTTP ${res.status}`);
        setTestStatus('error');
        return;
      }
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let gotText = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        if (chunk.includes('"text_delta"') || chunk.includes('"done"')) { gotText = true; break; }
        if (chunk.includes('"error"')) {
          const m = chunk.match(/"message"\s*:\s*"([^"]+)"/);
          setTestError(m ? m[1].slice(0, 80) : 'Provider error');
          setTestStatus('error');
          reader.cancel();
          return;
        }
      }
      reader.cancel();
      setTestStatus(gotText ? 'ok' : 'error');
      if (!gotText) setTestError('No response received');
    } catch (e) {
      setTestError(e instanceof Error ? e.message.slice(0, 80) : 'Network error');
      setTestStatus('error');
    }
  }

  return (
    <div
      className={`rounded-xl border transition-all ${
        isActive
          ? 'border-teal-500/40 bg-teal-500/5'
          : 'border-white/10 bg-[#161b22] hover:border-white/20'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 p-3">
        <GripVertical size={14} className="text-gray-600 shrink-0 cursor-grab" />

        {/* Active indicator */}
        <button
          onClick={onActivate}
          title={isActive ? 'Active model' : 'Set as active'}
          className={`shrink-0 h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center ${
            isActive
              ? 'border-teal-500 bg-teal-500'
              : 'border-gray-600 bg-transparent hover:border-teal-500/50'
          }`}
        >
          {isActive && <Check size={9} className="text-white" />}
        </button>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-200 truncate">{model.name}</p>
            {!hasKey && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                <AlertCircle size={10} />
                No key
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-500 font-mono truncate">{model.model}</p>
        </div>

        <ProviderBadge provider={model.provider} />

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            title="Configure"
          >
            <Settings2 size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            title="Remove model"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded config */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-3">
          {/* Name */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Display Name</label>
            <input
              type="text"
              value={model.name}
              onChange={e => onUpdate({ name: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-teal-500/50 transition-colors"
              placeholder="My Gemini Agent"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Provider</label>
            <select
              value={model.provider}
              onChange={e => {
                const prov = e.target.value as AIProvider;
                onUpdate({
                  provider: prov,
                  model: PROVIDER_DEFAULT_MODELS[prov],
                  baseUrl: PROVIDER_BASE_URLS[prov],
                });
              }}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-teal-500/50 transition-colors"
            >
              {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map(p => (
                <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
              ))}
            </select>
          </div>

          {/* Model name */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Model</label>
            <input
              type="text"
              value={model.model}
              onChange={e => onUpdate({ model: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-teal-500/50 transition-colors"
              placeholder={PROVIDER_DEFAULT_MODELS[model.provider]}
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              API Key
              <span className="ml-1 text-gray-600 font-normal normal-case">(stored locally only)</span>
            </label>
            <ApiKeyInput
              value={model.apiKey}
              onChange={v => onUpdate({ apiKey: v })}
              placeholder={`${PROVIDER_LABELS[model.provider]} API key…`}
            />
          </div>

          {/* Base URL (for custom) */}
          {model.provider === 'custom' && (
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Base URL</label>
              <input
                type="text"
                value={model.baseUrl || ''}
                onChange={e => onUpdate({ baseUrl: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-teal-500/50 transition-colors"
                placeholder="http://localhost:11434/v1"
              />
            </div>
          )}

          {/* Temperature + Max Tokens */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Temperature <span className="text-gray-600 font-normal">{model.temperature ?? 0.7}</span>
              </label>
              <input
                type="range"
                min="0" max="1" step="0.1"
                value={model.temperature ?? 0.7}
                onChange={e => onUpdate({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-teal-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Max Tokens</label>
              <input
                type="number"
                value={model.maxTokens ?? 8192}
                onChange={e => onUpdate({ maxTokens: parseInt(e.target.value) })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 font-mono focus:outline-none focus:border-teal-500/50 transition-colors"
                min={512} max={32768} step={512}
              />
            </div>
          </div>

          {/* Native tool calling */}
          <div className="flex items-center justify-between py-1">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Native tool calling
              </label>
              <p className="text-[10px] text-gray-600">Disable for Ollama/local models (uses text fallback)</p>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ supportsNativeTools: !(model.supportsNativeTools ?? model.provider !== 'custom') })}
              className={`relative w-10 h-5 rounded-full transition-colors ${(model.supportsNativeTools ?? model.provider !== 'custom') ? 'bg-teal-600' : 'bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${(model.supportsNativeTools ?? model.provider !== 'custom') ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>

          {/* System prompt override */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              System Prompt Override <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={model.systemPromptOverride || ''}
              onChange={e => onUpdate({ systemPromptOverride: e.target.value })}
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-teal-500/50 transition-colors font-mono"
              placeholder="Leave empty to use default system prompts…"
            />
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={!hasKey || testStatus === 'testing'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-40 transition-colors"
            >
              {testStatus === 'testing' ? (
                <Loader2 size={11} className="animate-spin text-teal-400" />
              ) : testStatus === 'ok' ? (
                <Wifi size={11} className="text-emerald-400" />
              ) : testStatus === 'error' ? (
                <WifiOff size={11} className="text-red-400" />
              ) : (
                <Wifi size={11} className="text-gray-500" />
              )}
              {testStatus === 'testing' ? 'Testing…' : 'Test connection'}
            </button>
            {testStatus === 'ok' && (
              <span className="text-[10px] text-emerald-400">Connected</span>
            )}
            {testStatus === 'error' && (
              <span className="text-[10px] text-red-400 truncate max-w-[160px]" title={testError}>{testError || 'Failed'}</span>
            )}
          </div>

          {/* Set active button */}
          {!isActive && (
            <button
              onClick={onActivate}
              className="w-full py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-400 hover:bg-teal-500/20 transition-colors"
            >
              Set as Active Model
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Model Picker ─────────────────────────────────────────────────────────

function AddModelPicker({ onAdd }: { onAdd: (provider: AIProvider) => void }) {
  const [open, setOpen] = useState(false);
  const providers: AIProvider[] = ['gemini', 'groq', 'openai', 'anthropic', 'custom'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-teal-500/30 text-xs font-semibold text-teal-500 hover:bg-teal-500/5 hover:border-teal-500/50 transition-all"
      >
        <Plus size={14} />
        Add Model
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {providers.map(p => (
            <button
              key={p}
              onClick={() => { onAdd(p); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition-colors"
            >
              <div className={`h-2 w-2 rounded-full ${PROVIDER_COLORS[p].split(' ')[0].replace('bg-', 'bg-').replace('/10', '')}`} />
              <div>
                <p className="text-xs font-medium text-gray-200">{PROVIDER_LABELS[p]}</p>
                <p className="text-[10px] text-gray-500 font-mono">{PROVIDER_DEFAULT_MODELS[p]}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ModelManager ─────────────────────────────────────────────────────────────

interface ModelManagerProps {
  models: ModelSection[];
  onModelsChange: (models: ModelSection[]) => void;
}

export default function ModelManager({ models, onModelsChange }: ModelManagerProps) {
  const activeModel = models.find(m => m.isActive);

  const handleAdd = (provider: AIProvider) => {
    const newModel = createModelSection(provider);
    // First model is auto-active
    if (models.length === 0) newModel.isActive = true;
    onModelsChange([...models, newModel]);
  };

  const handleActivate = (id: string) => {
    onModelsChange(models.map(m => ({ ...m, isActive: m.id === id })));
  };

  const handleUpdate = (id: string, updates: Partial<ModelSection>) => {
    onModelsChange(models.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDelete = (id: string) => {
    const remaining = models.filter(m => m.id !== id);
    // If deleted model was active, activate first remaining
    if (activeModel?.id === id && remaining.length > 0) {
      remaining[0].isActive = true;
    }
    onModelsChange(remaining);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#161b22]">
        <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
          <Server size={14} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-none">Models</p>
          <p className="text-[10px] text-gray-500 leading-none mt-0.5">
            {models.length} configured · {activeModel ? activeModel.name : 'none active'}
          </p>
        </div>
      </div>

      {/* Models list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {models.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="p-4 bg-violet-500/10 rounded-2xl mb-3">
              <Bot size={28} className="text-violet-400 opacity-60" />
            </div>
            <p className="text-xs font-medium text-gray-400">No models yet</p>
            <p className="text-[11px] text-gray-600 mt-1 max-w-[200px]">
              Add a model below. Each model gets its own API key and runs as an independent agent.
            </p>
          </div>
        )}

        {models.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            isActive={model.isActive}
            onActivate={() => handleActivate(model.id)}
            onUpdate={updates => handleUpdate(model.id, updates)}
            onDelete={() => handleDelete(model.id)}
          />
        ))}
      </div>

      {/* Footer — add button */}
      <div className="p-3 border-t border-white/5">
        <AddModelPicker onAdd={handleAdd} />
        <p className="text-[10px] text-gray-600 text-center mt-2">
          <Key size={9} className="inline mr-1" />
          API keys are stored only in your browser localStorage
        </p>
      </div>
    </div>
  );
}
