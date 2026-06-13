"use client";

import React, { useState, useCallback } from 'react';
import { Check, Copy, Play, FileCode, ChevronDown, ChevronRight, CheckCircle2, Edit3 } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';

interface ChatCodeBlockProps {
    code: string;
    language?: string;
    fileName?: string;
    onApply?: (code: string, fileName?: string) => void;
    showApplyButton?: boolean;
}

const LANGUAGE_LABELS: Record<string, string> = {
    cpp: 'C++',
    c: 'C',
    python: 'Python',
    py: 'Python',
    json: 'JSON',
    ino: 'Arduino',
    h: 'Header',
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
};

const LANGUAGE_COLORS: Record<string, string> = {
    cpp: 'from-purple-500 to-purple-600',
    c: 'from-blue-500 to-blue-600',
    python: 'from-yellow-500 to-yellow-600',
    py: 'from-yellow-500 to-yellow-600',
    json: 'from-amber-500 to-amber-600',
    ino: 'from-teal-500 to-teal-600',
    h: 'from-purple-400 to-purple-500',
    javascript: 'from-yellow-400 to-yellow-500',
    js: 'from-yellow-400 to-yellow-500',
    typescript: 'from-blue-400 to-blue-500',
    ts: 'from-blue-400 to-blue-500',
};

const ChatCodeBlock: React.FC<ChatCodeBlockProps> = ({
    code,
    language = 'cpp',
    fileName,
    onApply,
    showApplyButton = true
}) => {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isApplied, setIsApplied] = useState(false);
    const [applyAnimation, setApplyAnimation] = useState(false);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    const handleApply = useCallback(() => {
        if (onApply && !isApplied) {
            // Trigger animation
            setApplyAnimation(true);

            // Apply the code
            onApply(code, fileName);

            // Mark as applied after animation
            setTimeout(() => {
                setIsApplied(true);
                setApplyAnimation(false);
            }, 500);
        }
    }, [onApply, code, fileName, isApplied]);

    // Highlight code using Prism
    const highlightedCode = React.useMemo(() => {
        let lang = Prism.languages.clike;
        let grammar = 'clike';

        if (language === 'cpp' || language === 'ino' || language === 'c' || language === 'h') {
            lang = Prism.languages.cpp;
            grammar = 'cpp';
        } else if (language === 'python' || language === 'py') {
            lang = Prism.languages.python;
            grammar = 'python';
        } else if (language === 'json') {
            lang = Prism.languages.json;
            grammar = 'json';
        }

        try {
            return Prism.highlight(code, lang, grammar);
        } catch {
            return code;
        }
    }, [code, language]);

    const lineCount = code.split('\n').length;
    const languageLabel = LANGUAGE_LABELS[language] || language.toUpperCase();
    const languageColor = LANGUAGE_COLORS[language] || 'from-gray-500 to-gray-600';

    return (
        <div className={`rounded-xl border overflow-hidden my-3 transition-all duration-300 ${isApplied
                ? 'border-emerald-500/50 bg-emerald-900/10 shadow-lg shadow-emerald-900/20'
                : 'border-[#333] bg-[#1a1a1a] hover:border-[#444]'
            } ${applyAnimation ? 'scale-[1.02] ring-2 ring-emerald-500' : ''}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-2.5 ${isApplied ? 'bg-emerald-900/20' : 'bg-[#252526]'
                } border-b border-[#333]`}>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-400 hover:text-white transition-colors p-0.5 rounded hover:bg-[#333]"
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {/* Language Badge */}
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r ${languageColor} shadow-sm`}>
                        <FileCode size={11} className="text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                            {languageLabel}
                        </span>
                    </div>

                    {fileName && (
                        <span className="text-xs font-mono text-gray-300 bg-[#1e1e1e] px-2 py-0.5 rounded">
                            {fileName}
                        </span>
                    )}

                    <span className="text-[10px] text-gray-500">
                        {lineCount} line{lineCount !== 1 ? 's' : ''}
                    </span>

                    {/* Applied Badge */}
                    {isApplied && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-700/50">
                            <CheckCircle2 size={10} />
                            Applied to Editor
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${copied
                                ? 'text-emerald-400 bg-emerald-900/30'
                                : 'text-gray-400 hover:text-white hover:bg-[#333]'
                            }`}
                        title="Copy code"
                    >
                        {copied ? (
                            <>
                                <Check size={12} />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy size={12} />
                                <span>Copy</span>
                            </>
                        )}
                    </button>

                    {/* Apply Button */}
                    {showApplyButton && onApply && (
                        <button
                            onClick={handleApply}
                            disabled={isApplied}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all shadow-sm ${isApplied
                                    ? 'bg-emerald-900/30 text-emerald-400 cursor-default border border-emerald-700/50'
                                    : 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white hover:shadow-md hover:shadow-sky-500/20'
                                }`}
                            title={isApplied ? 'Already applied' : (fileName ? `Apply to ${fileName}` : 'Apply to editor')}
                        >
                            {isApplied ? (
                                <>
                                    <CheckCircle2 size={12} />
                                    Applied
                                </>
                            ) : (
                                <>
                                    <Edit3 size={12} />
                                    Apply
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Code Content */}
            {isExpanded && (
                <div className="relative overflow-x-auto custom-scrollbar">
                    <div className="flex min-w-fit">
                        {/* Line Numbers */}
                        <div className={`flex-shrink-0 py-3 px-3 text-right text-[11px] font-mono select-none border-r ${isApplied
                                ? 'bg-emerald-900/10 text-emerald-600/60 border-emerald-700/30'
                                : 'bg-[#1a1a1a] text-gray-600 border-[#2a2a2a]'
                            }`}>
                            {code.split('\n').map((_, i) => (
                                <div key={i} className="leading-5 h-5">{i + 1}</div>
                            ))}
                        </div>

                        {/* Code */}
                        <pre className="flex-1 py-3 px-4 overflow-x-auto">
                            <code
                                className="text-[12px] font-mono leading-5 block"
                                dangerouslySetInnerHTML={{ __html: highlightedCode }}
                            />
                        </pre>
                    </div>
                </div>
            )}

            {/* Collapsed preview */}
            {!isExpanded && (
                <div
                    className="px-4 py-2.5 text-xs text-gray-500 cursor-pointer hover:bg-[#252526] transition-colors flex items-center gap-2"
                    onClick={() => setIsExpanded(true)}
                >
                    <FileCode size={12} className="text-gray-600" />
                    <span>{lineCount} lines of {languageLabel} code</span>
                    <span className="text-gray-600">— click to expand</span>
                </div>
            )}

            {/* Prism styles */}
            <style jsx global>{`
                .token.comment { color: #6A9955; font-style: italic; }
                .token.keyword { color: #569CD6; font-weight: bold; }
                .token.string { color: #CE9178; }
                .token.number { color: #B5CEA8; }
                .token.function { color: #DCDCAA; }
                .token.class-name { color: #4EC9B0; }
                .token.operator { color: #D4D4D4; }
                .token.punctuation { color: #D4D4D4; }
                .token.property { color: #9CDCFE; }
                .token.boolean { color: #569CD6; }
                .token.constant { color: #4FC1FF; }
                .token.builtin { color: #4EC9B0; }
                .token.directive { color: #C586C0; }
                .token.preprocessor { color: #C586C0; }
            `}</style>
        </div>
    );
};

export default ChatCodeBlock;
