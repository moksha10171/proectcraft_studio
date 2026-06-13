"use client";

import React, { useRef, useCallback, useState, useEffect } from 'react';
import MonacoEditor, { OnMount, BeforeMount } from '@monaco-editor/react';
import { CheckCircle2, Loader2, XCircle, AlertCircle, FileCode, Brackets, FileText, Copy, Check, Terminal, Maximize2, Minimize2, Columns, Settings, AlignLeft } from 'lucide-react';

interface MonacoCodeEditorProps {
    code: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    language?: string;
    onVerify?: () => void;
    isVerifying?: boolean;
    errors?: string[] | null;
    onSelectionChange?: (selection: { text: string; startLine: number; endLine: number } | null) => void;
}

// Custom Arduino/C++ dark theme - using any to avoid monaco-editor type dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STUDIO_DARK_THEME: any = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
        { token: 'preprocessor', foreground: 'C586C0' },
    ],
    colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d2d',
        'editorLineNumber.foreground': '#4a5568',
        'editorLineNumber.activeForeground': '#0ea5e9',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorCursor.foreground': '#0ea5e9',
        'editorWhitespace.foreground': '#3b3b3b',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editor.selectionHighlightBackground': '#add6ff26',
        'editorBracketMatch.background': '#0d6efd40',
        'editorBracketMatch.border': '#0d6efd',
        'editorError.foreground': '#f14c4c',
        'editorWarning.foreground': '#cca700',
        'minimap.background': '#1e1e1e',
        'scrollbarSlider.background': '#4a4a4a60',
        'scrollbarSlider.hoverBackground': '#5a5a5a80',
        'scrollbarSlider.activeBackground': '#6a6a6aa0',
    }
};

// Language configuration for mapping file extensions
const LANGUAGE_MAP: Record<string, string> = {
    'ino': 'cpp',
    'cpp': 'cpp',
    'c': 'c',
    'h': 'cpp',
    'py': 'python',
    'python': 'python',
    'json': 'json',
    'md': 'markdown',
    'markdown': 'markdown',
};

const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
    code,
    onChange,
    readOnly,
    language = 'ino',
    onVerify,
    isVerifying,
    errors,
    onSelectionChange
}) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monacoRef = useRef<any>(null);
    const [showErrors, setShowErrors] = useState(true);
    const [copied, setCopied] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
    const [showMinimap, setShowMinimap] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Map language to Monaco language ID
    const monacoLanguage = LANGUAGE_MAP[language] || 'plaintext';

    // Language display info
    const langInfo = {
        ino: { icon: FileCode, label: 'Arduino C++', color: 'text-teal-500' },
        cpp: { icon: FileCode, label: 'C++', color: 'text-purple-500' },
        c: { icon: FileCode, label: 'C', color: 'text-blue-500' },
        h: { icon: FileCode, label: 'Header', color: 'text-purple-400' },
        python: { icon: Terminal, label: 'Python (RPi)', color: 'text-yellow-500' },
        py: { icon: Terminal, label: 'Python (RPi)', color: 'text-yellow-500' },
        json: { icon: Brackets, label: 'JSON', color: 'text-amber-500' },
        markdown: { icon: FileText, label: 'Markdown', color: 'text-blue-400' },
        md: { icon: FileText, label: 'Markdown', color: 'text-blue-400' },
    }[language] || { icon: FileText, label: 'Text', color: 'text-gray-400' };

    const LangIcon = langInfo.icon;
    const hasErrors = errors && errors.length > 0;

    // Parse error line numbers for decorations
    const getErrorLineNumbers = useCallback((): number[] => {
        if (!errors) return [];
        const lines: number[] = [];
        errors.forEach(err => {
            const match = err.match(/(?:line|:|^)\s*(\d+)/i);
            if (match) {
                const line = parseInt(match[1], 10);
                if (!isNaN(line) && line > 0) lines.push(line);
            }
        });
        return [...new Set(lines)];
    }, [errors]);

    // Register theme before mount
    const handleBeforeMount: BeforeMount = useCallback((monaco) => {
        monaco.editor.defineTheme('studio-dark', STUDIO_DARK_THEME);
    }, []);

    // Editor mount handler
    const handleEditorMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Set theme
        monaco.editor.setTheme('studio-dark');

        // Track cursor position
        editor.onDidChangeCursorPosition((e) => {
            setCursorPosition({ line: e.position.lineNumber, col: e.position.column });
        });

        // Track selection changes for AI context
        editor.onDidChangeCursorSelection((e) => {
            if (onSelectionChange) {
                const selection = editor.getSelection();
                if (selection && !selection.isEmpty()) {
                    const selectedText = editor.getModel()?.getValueInRange(selection) || '';
                    onSelectionChange({
                        text: selectedText,
                        startLine: selection.startLineNumber,
                        endLine: selection.endLineNumber
                    });
                } else {
                    onSelectionChange(null);
                }
            }
        });

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (onVerify) onVerify();
        });

        // Focus editor
        editor.focus();
    }, [onVerify, onSelectionChange]);

    // Update error decorations when errors change
    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;

        const errorLines = getErrorLineNumbers();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decorations: any[] = errorLines.map(line => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                className: 'error-line-decoration',
                glyphMarginClassName: 'error-glyph-margin',
                linesDecorationsClassName: 'error-line-number',
                overviewRuler: {
                    color: '#f14c4c',
                    position: monaco.editor.OverviewRulerLane.Full
                }
            }
        }));

        // Apply decorations - filter and map with explicit types
        const model = editorRef.current?.getModel();
        const allDecorations = model?.getAllDecorations() || [];
        const oldDecorations = allDecorations
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((d: any) => d.options.className === 'error-line-decoration')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((d: any) => d.id);

        editorRef.current?.deltaDecorations(oldDecorations, decorations);
    }, [errors, getErrorLineNumbers]);

    // Handle code changes
    const handleCodeChange = useCallback((value: string | undefined) => {
        onChange(value || '');
    }, [onChange]);

    // Copy code to clipboard
    const handleCopyCode = useCallback(async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    // Toggle minimap
    const toggleMinimap = useCallback(() => {
        setShowMinimap(prev => !prev);
        editorRef.current?.updateOptions({ minimap: { enabled: !showMinimap } });
    }, [showMinimap]);

    // Go to error line
    const goToErrorLine = useCallback((error: string) => {
        const match = error.match(/(?:line|:|^)\s*(\d+)/i);
        if (match && editorRef.current) {
            const line = parseInt(match[1], 10);
            editorRef.current.revealLineInCenter(line);
            editorRef.current.setPosition({ lineNumber: line, column: 1 });
            editorRef.current.focus();
        }
    }, []);

    // Format code
    const formatCode = useCallback(() => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
    }, []);

    // Statistics
    const stats = React.useMemo(() => {
        const lines = code.split('\n');
        return {
            lines: lines.length,
            chars: code.length,
        };
    }, [code]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4] border-r border-[#1a1a1a] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        >
            {/* Header */}
            <div className="h-12 bg-[#252526] px-4 flex justify-between items-center select-none border-b border-[#1a1a1a] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-[#333]`}>
                            <LangIcon size={16} className={langInfo.color} aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-200 text-xs leading-none">{langInfo.label}</span>
                            <span className="text-[10px] text-gray-500 font-mono mt-0.5">{language}.{monacoLanguage}</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-[#333] mx-1" aria-hidden="true"></div>

                    {/* Verification Status */}
                    {errors === null && !isVerifying ? (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" aria-hidden="true"></div>
                            Ready
                        </span>
                    ) : (
                        hasErrors ? (
                            <span className="text-red-400 flex items-center gap-1.5 bg-red-900/20 px-2 py-0.5 rounded-full border border-red-900/50 text-[10px]" role="alert">
                                <AlertCircle size={10} aria-hidden="true" />
                                <span className="font-bold">{errors?.length}</span> Problems
                            </span>
                        ) : (
                            <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-900/50 text-[10px]" role="status">
                                <CheckCircle2 size={10} aria-hidden="true" />
                                Verified
                            </span>
                        )
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Secondary Actions */}
                    <div className="flex items-center mr-2 border-r border-[#333] pr-2 gap-1">
                        <span className="text-[10px] text-gray-500 mr-1 font-mono">{stats.lines} lines</span>
                    </div>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#2a2d2e] hover:bg-[#383838] text-gray-300 hover:text-white transition-all border border-[#333] shadow-inner focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                        title="Copy code"
                        aria-label="Copy code to clipboard"
                    >
                        {copied ? <Check size={12} className="text-emerald-400" aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Main Action: Verify */}
                    {!readOnly && onVerify && (
                        <button
                            onClick={onVerify}
                            disabled={isVerifying}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg focus:outline-none focus:ring-1 focus:ring-sky-500/50 ${isVerifying
                                ? 'bg-sky-600 text-white cursor-wait'
                                : hasErrors
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                                }`}
                            aria-label={isVerifying ? 'Verifying code' : (hasErrors ? 'Re-verify code' : 'Verify code')}
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    {hasErrors ? <AlertCircle size={12} aria-hidden="true" /> : <CheckCircle2 size={12} aria-hidden="true" />}
                                    {hasErrors ? 'Re-Verify' : 'Verify'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>


            {/* Monaco Editor */}
            <div className="flex-1 relative overflow-hidden">
                <MonacoEditor
                    height="100%"
                    language={monacoLanguage}
                    value={code}
                    onChange={handleCodeChange}
                    beforeMount={handleBeforeMount}
                    onMount={handleEditorMount}
                    loading={
                        <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" aria-hidden="true" />
                        </div>
                    }
                    options={{
                        readOnly,
                        fontSize: 13,
                        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
                        fontLigatures: true,
                        lineNumbers: 'on',
                        glyphMargin: true,
                        folding: true,
                        foldingStrategy: 'indentation',
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 4,
                        renderLineHighlight: 'all',
                        renderWhitespace: 'selection',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        minimap: {
                            enabled: showMinimap,
                            side: 'right',
                            size: 'proportional',
                            showSlider: 'mouseover'
                        },
                        scrollbar: {
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10,
                            useShadows: false,
                        },
                        bracketPairColorization: {
                            enabled: true,
                        },
                        guides: {
                            bracketPairs: true,
                            indentation: true,
                        },
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        padding: { top: 8, bottom: 8 },
                        wordWrap: 'off',
                        tabSize: 2,
                        insertSpaces: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        quickSuggestions: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: 'on',
                        snippetSuggestions: 'inline',
                    }}
                />
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#252526] border-t border-[#1a1a1a] px-4 flex items-center justify-between text-[10px] text-gray-500 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        Ln {cursorPosition.line}, Col {cursorPosition.col}
                    </span>
                    <span className="text-[#333]" aria-hidden="true">|</span>
                    <span>{stats.lines} lines</span>
                    <span className="text-[#333]" aria-hidden="true">|</span>
                    <span>{stats.chars} chars</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 ${hasErrors ? 'text-red-400' : 'text-emerald-400'}`}>
                        {hasErrors ? <XCircle size={10} aria-hidden="true" /> : <CheckCircle2 size={10} aria-hidden="true" />}
                        {hasErrors ? `${errors?.length} issues` : 'No issues'}
                    </span>
                </div>
            </div>

            {/* Error Panel (Bottom) */}
            {
                hasErrors && (
                    <div className={`border-t border-red-900/50 bg-[#1e1e1e] transition-all duration-300 flex flex-col ${showErrors ? 'h-32' : 'h-7'}`}>
                        <button
                            className="h-7 bg-[#2d1b1b] flex items-center px-3 cursor-pointer hover:bg-[#3d2b2b] select-none border-b border-red-900/30 w-full text-left focus:outline-none focus:bg-[#3d2b2b]"
                            onClick={() => setShowErrors(!showErrors)}
                            aria-expanded={showErrors}
                            aria-label={showErrors ? 'Collapse error panel' : 'Expand error panel'}
                        >
                            <AlertCircle size={12} className="text-red-400 mr-2" aria-hidden="true" />
                            <span className="text-xs text-red-200 font-medium">Problems ({errors?.length})</span>
                            <span className="ml-auto text-red-300/50 text-xs" aria-hidden="true">{showErrors ? '▼' : '▲'}</span>
                        </button>
                        {showErrors && (
                            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-[#1a1515]" role="list" aria-label="Error list">
                                {errors?.map((err, idx) => (
                                    <button
                                        key={idx}
                                        className="flex items-start gap-2 px-3 py-2 hover:bg-red-900/10 border-b border-red-900/10 text-xs font-mono group cursor-pointer w-full text-left focus:outline-none focus:bg-red-900/20"
                                        onClick={() => goToErrorLine(err)}
                                        aria-label={`Go to error: ${err}`}
                                    >
                                        <XCircle size={12} className="text-red-500 mt-0.5 shrink-0 group-hover:text-red-400" aria-hidden="true" />
                                        <span className="text-red-100/90 leading-tight">{err}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* Custom styles for error decorations */}
            <style jsx global>{`
                .error-line-decoration {
                    background-color: rgba(244, 63, 94, 0.1) !important;
                }
                .error-glyph-margin {
                    background: radial-gradient(circle at center, #ef4444 40%, transparent 60%);
                    border-radius: 50%;
                    margin-left: 4px;
                }
                .error-line-number {
                    background-color: rgba(244, 63, 94, 0.3) !important;
                }
            `}</style>
        </div >
    );
};

export default MonacoCodeEditor;
