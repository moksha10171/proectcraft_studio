// Monaco Editor Configuration for Next.js
export const MONACO_EDITOR_OPTIONS = {
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: true,
    scrollBeyondLastLine: false,
    readOnly: false,
    cursorStyle: 'line' as const,
    wordWrap: 'on' as const,
    formatOnPaste: true,
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on' as const,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    folding: true,
    glyphMargin: true,
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    renderWhitespace: 'selection' as const,
};

// Configure Monaco environment for service workers
// This needs to be called on the client side only
export function initializeMonacoEnvironment() {
    if (typeof window === 'undefined') return;

    // Monaco environment setup using CDN workers
    (window as any).MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: string, label: string) {
            // Use CDN for workers to avoid build issues with Next.js
            const baseUrl = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs';

            if (label === 'json') {
                return `${baseUrl}/language/json/json.worker.js`;
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
                return `${baseUrl}/language/css/css.worker.js`;
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return `${baseUrl}/language/html/html.worker.js`;
            }
            if (label === 'typescript' || label === 'javascript') {
                return `${baseUrl}/language/typescript/ts.worker.js`;
            }
            return `${baseUrl}/editor/editor.worker.js`;
        },
    };
}

// Initialize immediately when module is loaded on client
if (typeof window !== 'undefined') {
    initializeMonacoEnvironment();
}
