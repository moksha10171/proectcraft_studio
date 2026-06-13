// Type definitions for the Code Compiler

export type Language = 'html' | 'css' | 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'json';

export interface CodeFile {
    name: string;
    content: string;
    language: Language;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    files: CodeFile[];
}

export type ConsoleMessageType = 'log' | 'error' | 'warn' | 'info';

export interface ConsoleMessage {
    type: ConsoleMessageType;
    message: string;
    timestamp: number;
}

export interface CompilerConfig {
    autoRun: boolean;
    delay: number; // ms delay before running code after edit
}

export interface PreviewState {
    isLoading: boolean;
    error: string | null;
    lastUpdate: number;
}
