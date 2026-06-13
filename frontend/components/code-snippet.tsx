'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeSnippetProps {
    code: string
    language: string
    title?: string
    showLineNumbers?: boolean
    maxHeight?: string
    className?: string
}

export function CodeSnippet({
    code,
    language,
    title,
    showLineNumbers = false,
    maxHeight,
    className = ''
}: CodeSnippetProps) {
    const [copied, setCopied] = useState(false)
    const [isExpanded, setIsExpanded] = useState(true)

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Keyboard shortcut for copy (Ctrl/Cmd + C when focused)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.target instanceof HTMLElement) {
                if (e.target.closest('.code-snippet-wrapper')) {
                    handleCopy()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [code])

    return (
        <div className={`rounded-xl border border-border bg-card overflow-hidden code-snippet-wrapper ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                        {language}
                    </Badge>
                    {title && <span className="text-sm font-medium">{title}</span>}
                    {showLineNumbers && (
                        <Badge variant="outline" className="text-[10px]">
                            {code.split('\n').length} lines
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3"
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label={isExpanded ? 'Collapse code' : 'Expand code'}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                                Collapse
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                                Expand
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3"
                        onClick={handleCopy}
                        aria-label="Copy code to clipboard"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 mr-1.5 text-green-500" />
                                <span className="text-green-500">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4 mr-1.5" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Code Display */}
            {isExpanded && (
                <div
                    className="overflow-x-auto"
                    style={maxHeight ? { maxHeight } : undefined}
                >
                    <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus}
                        showLineNumbers={showLineNumbers}
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '0.875rem',
                        }}
                        codeTagProps={{
                            style: {
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                            }
                        }}
                    >
                        {code}
                    </SyntaxHighlighter>
                </div>
            )}
        </div>
    )
}
