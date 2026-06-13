'use client';

import React, { useRef, useEffect } from 'react';
import { Language } from '@/lib/code-compiler/types';
import { MONACO_EDITOR_OPTIONS } from '@/lib/code-compiler/monaco-config';

interface CodeCompilerEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: Language;
    fileName: string;
    theme?: 'vs-dark' | 'vs-light';
}

export default function CodeCompilerEditor({
    value,
    onChange,
    language,
    fileName,
    theme = 'vs-dark'
}: CodeCompilerEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    useEffect(() => {
        let mounted = true;

        // Dynamically import Monaco for client-side only
        import('monaco-editor').then((monaco) => {
            if (!mounted || !editorRef.current || monacoRef.current) return;

            monacoRef.current = monaco;

            // Map our language types to Monaco language IDs
            const monacoLanguage = getMonacoLanguage(language);

            // Create editor instance with configuration
            monacoEditorRef.current = monaco.editor.create(editorRef.current, {
                value,
                language: monacoLanguage,
                theme: 'vs-dark', // Force vs-dark for consistency with our dark UI
                ...MONACO_EDITOR_OPTIONS,
                fontSize: 13,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                minimap: { enabled: true, scale: 0.75 },
                padding: { top: 16, bottom: 16 },
                roundedSelection: true,
                cursorSmoothCaretAnimation: 'on',
                scrollBeyondLastLine: false,
                lineNumbersMinChars: 4,
                renderLineHighlight: 'all', // Highlight current line
                contextmenu: true,
            });

            // Listen to content changes
            monacoEditorRef.current.onDidChangeModelContent(() => {
                const currentValue = monacoEditorRef.current?.getValue() || '';
                onChange(currentValue);
            });
        }).catch(err => {
            console.error('Failed to load Monaco editor:', err);
        });

        return () => {
            mounted = false;
            monacoEditorRef.current?.dispose();
        };
    }, []); // Only create once

    // Update language when it changes
    useEffect(() => {
        if (monacoEditorRef.current && monacoRef.current) {
            const model = monacoEditorRef.current.getModel();
            if (model) {
                monacoRef.current.editor.setModelLanguage(model, getMonacoLanguage(language));
            }
        }
    }, [language]);

    // Update value when file changes (but not during typing)
    useEffect(() => {
        if (monacoEditorRef.current) {
            const currentValue = monacoEditorRef.current.getValue();
            if (currentValue !== value) {
                monacoEditorRef.current.setValue(value);
            }
        }
    }, [fileName]); // Only update when fileName changes (switching files)

    return (
        <div className="relative w-full h-full bg-[#1e1e1e]">
            <div
                ref={editorRef}
                className="w-full h-full"
                style={{ minHeight: '400px' }}
            />
        </div>
    );
}

function getMonacoLanguage(language: Language): string {
    const languageMap: Record<Language, string> = {
        html: 'html',
        css: 'css',
        javascript: 'javascript',
        typescript: 'typescript',
        jsx: 'javascript', // Monaco uses javascript for JSX
        tsx: 'typescript',
        json: 'json',
    };

    return languageMap[language] || 'plaintext';
}
