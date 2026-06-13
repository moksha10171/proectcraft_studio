"use client";

import React, { useRef, useCallback } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Check, X, ChevronDown, ChevronUp, GitCompare, FileCode, Loader2 } from 'lucide-react';

export interface FileChange {
    path: string;
    originalContent: string;
    modifiedContent: string;
    language?: string;
}

interface DiffPreviewProps {
    changes: FileChange[];
    onAccept: (path: string) => void;
    onAcceptAll: () => void;
    onReject: (path: string) => void;
    onRejectAll: () => void;
    onClose: () => void;
}

// Custom theme for diff editor - using any for Monaco types
const DIFF_THEME = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
    ],
    colors: {
        'editor.background': '#1e1e1e',
        'diffEditor.insertedTextBackground': '#22c55e20',
        'diffEditor.removedTextBackground': '#ef444420',
        'diffEditor.insertedLineBackground': '#22c55e15',
        'diffEditor.removedLineBackground': '#ef444415',
        'diffEditorGutter.insertedLineBackground': '#22c55e40',
        'diffEditorGutter.removedLineBackground': '#ef444440',
    }
};

const LANGUAGE_MAP: Record<string, string> = {
    'ino': 'cpp',
    'cpp': 'cpp',
    'c': 'c',
    'h': 'cpp',
    'py': 'python',
    'json': 'json',
    'md': 'markdown',
};

const DiffPreview: React.FC<DiffPreviewProps> = ({
    changes,
    onAccept,
    onAcceptAll,
    onReject,
    onRejectAll,
    onClose
}) => {
    const [expandedFiles, setExpandedFiles] = React.useState<Set<string>>(new Set(changes.map(c => c.path)));
    const [viewMode, setViewMode] = React.useState<'side-by-side' | 'inline'>('side-by-side');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diffEditorRefs = useRef<Map<string, any>>(new Map());

    const toggleFile = (path: string) => {
        setExpandedFiles(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const getFileExtension = (path: string): string => {
        return path.split('.').pop()?.toLowerCase() || '';
    };

    const getLanguage = (path: string): string => {
        const ext = getFileExtension(path);
        return LANGUAGE_MAP[ext] || 'plaintext';
    };

    const countChanges = (original: string, modified: string): { additions: number; deletions: number } => {
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');

        // Simple diff counting
        const additions = modifiedLines.filter(line => !originalLines.includes(line)).length;
        const deletions = originalLines.filter(line => !modifiedLines.includes(line)).length;

        return { additions, deletions };
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDiffEditorMount = useCallback((path: string) => (editor: any, monaco: any) => {
        diffEditorRefs.current.set(path, editor);
        monaco.editor.defineTheme('diff-dark', DIFF_THEME);
        monaco.editor.setTheme('diff-dark');
    }, []);

    if (changes.length === 0) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] rounded-xl border border-[#333] shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-[#252526] px-5 py-4 border-b border-[#333] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <GitCompare size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI Suggested Changes</h2>
                            <p className="text-xs text-gray-400">
                                {changes.length} file{changes.length !== 1 ? 's' : ''} modified
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex bg-[#1e1e1e] rounded-lg p-1 border border-[#333]">
                            <button
                                onClick={() => setViewMode('side-by-side')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'side-by-side'
                                    ? 'bg-sky-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Side by Side
                            </button>
                            <button
                                onClick={() => setViewMode('inline')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'inline'
                                    ? 'bg-sky-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Inline
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={onRejectAll}
                            className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <X size={16} />
                            Reject All
                        </button>
                        <button
                            onClick={onAcceptAll}
                            className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all"
                        >
                            <Check size={16} />
                            Accept All
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* File Changes List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {changes.map((change, index) => {
                        const isExpanded = expandedFiles.has(change.path);
                        const { additions, deletions } = countChanges(change.originalContent, change.modifiedContent);
                        const language = getLanguage(change.path);

                        return (
                            <div key={change.path} className="border-b border-[#333] last:border-b-0">
                                {/* File Header */}
                                <div
                                    className="px-5 py-3 bg-[#252526] flex items-center justify-between cursor-pointer hover:bg-[#2a2d2e] transition-colors"
                                    onClick={() => toggleFile(change.path)}
                                >
                                    <div className="flex items-center gap-3">
                                        <button className="text-gray-400">
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                        </button>
                                        <FileCode size={16} className="text-sky-400" />
                                        <span className="font-mono text-sm text-gray-200">{change.path}</span>

                                        {/* Change Stats */}
                                        <div className="flex items-center gap-2 ml-4">
                                            {additions > 0 && (
                                                <span className="text-xs font-mono text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded">
                                                    +{additions}
                                                </span>
                                            )}
                                            {deletions > 0 && (
                                                <span className="text-xs font-mono text-red-400 bg-red-900/30 px-2 py-0.5 rounded">
                                                    -{deletions}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => onReject(change.path)}
                                            className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors flex items-center gap-1.5"
                                        >
                                            <X size={14} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => onAccept(change.path)}
                                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-sm flex items-center gap-1.5 transition-colors"
                                        >
                                            <Check size={14} />
                                            Accept
                                        </button>
                                    </div>
                                </div>

                                {/* Diff View */}
                                {isExpanded && (
                                    <div className="h-80 bg-[#1e1e1e]">
                                        <DiffEditor
                                            height="100%"
                                            language={language}
                                            original={change.originalContent}
                                            modified={change.modifiedContent}
                                            onMount={handleDiffEditorMount(change.path)}
                                            loading={
                                                <div className="flex items-center justify-center h-full">
                                                    <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                                                </div>
                                            }
                                            options={{
                                                readOnly: true,
                                                renderSideBySide: viewMode === 'side-by-side',
                                                fontSize: 12,
                                                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
                                                minimap: { enabled: false },
                                                scrollBeyondLastLine: false,
                                                lineNumbers: 'on',
                                                glyphMargin: true,
                                                folding: false,
                                                renderIndicators: true,
                                                originalEditable: false,
                                                diffWordWrap: 'on',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="bg-[#252526] px-5 py-3 border-t border-[#333] flex items-center justify-between text-xs text-gray-500">
                    <span>Review changes carefully before accepting</span>
                    <span className="flex items-center gap-4">
                        <span className="text-emerald-400">+{changes.reduce((sum, c) => sum + countChanges(c.originalContent, c.modifiedContent).additions, 0)} additions</span>
                        <span className="text-red-400">-{changes.reduce((sum, c) => sum + countChanges(c.originalContent, c.modifiedContent).deletions, 0)} deletions</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DiffPreview;
