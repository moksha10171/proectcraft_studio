"use client"

import { cn } from "@/lib/utils"
import { Bot, User, Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ChatMessageProps {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
    showCopy?: boolean
}

export function ChatMessage({ role, content, showCopy = false }: ChatMessageProps) {
    const [copied, setCopied] = useState(false)
    const isUser = role === 'user'

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text', err)
        }
    }

    return (
        <div className={cn(
            "flex w-full gap-3 md:gap-4",
            isUser ? "flex-row-reverse" : "flex-row"
        )}>
            <div className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border",
                isUser ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
            )}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
                "relative group flex-1 space-y-2 overflow-hidden px-1",
                isUser ? "text-right" : "text-left"
            )}>
                <div className={cn(
                    "inline-block rounded-2xl px-4 py-3 text-sm shadow-sm ring-1 ring-inset",
                    isUser
                        ? "bg-primary text-primary-foreground ring-primary text-left"
                        : "bg-card text-card-foreground ring-border"
                )}>
                    <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
                        {content}
                    </div>
                </div>

                {!isUser && showCopy && (
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={handleCopy}
                            aria-label="Copy message"
                        >
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
