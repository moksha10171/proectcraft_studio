"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Bot,
    X,
    RefreshCw,
    Sparkles,
    Send,
    Loader2,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChatMessage } from "./chat-message"
import { toast } from "sonner"

interface ProjectChatSidebarProps {
    isOpen: boolean
    onClose: () => void
    projectTitle: string
    projectSlug: string
}

export function ProjectChatSidebar({
    isOpen,
    onClose,
    projectTitle,
    projectSlug
}: ProjectChatSidebarProps) {
    const [messages, setMessages] = React.useState<Array<{ id: string, role: 'user' | 'assistant', content: string, timestamp: number }>>([])
    const [input, setInput] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [chatId, setChatId] = React.useState<string | null>(null)
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: input.trim(),
            timestamp: Date.now()
        }

        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    topicSlug: projectSlug,
                    topicData: {
                        slug: projectSlug,
                        title: projectTitle,
                        type: 'project'
                    },
                    chatId: chatId
                })
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to get response")
            }

            const aiResponse = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: data.message,
                timestamp: Date.now()
            }

            setMessages(prev => [...prev, aiResponse])

            if (data.chatId) {
                setChatId(data.chatId)
            }
        } catch (err) {
            console.error(err)
            setError("Failed to send message. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Mobile Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
                    />

                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed z-50 flex flex-col bg-background shadow-2xl",
                            "inset-0 sm:inset-auto",
                            "sm:top-0 sm:right-0 sm:h-screen sm:w-full sm:max-w-md",
                            "sm:border-l border-border/50"
                        )}
                        role="dialog"
                        aria-label="AI Assistant Chat"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm sm:text-base">Project Assistant</h3>
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {projectTitle}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setMessages([])
                                        setError(null)
                                        setChatId(null)
                                    }}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    title="Clear chat"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
                                    <div className="p-4 bg-primary/5 rounded-full">
                                        <Sparkles className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="max-w-xs space-y-2">
                                        <h4 className="font-semibold">How can I help you?</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Ask questions about the code, setup instructions, or components used in this project.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 w-full">
                                        {[
                                            "Explain the code structure",
                                            "How do I set this up?",
                                            "What components do I need?",
                                            "Troubleshoot common errors"
                                        ].map((q, i) => (
                                            <Button
                                                key={i}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs justify-start h-auto py-2 px-3 whitespace-normal text-left font-normal"
                                                onClick={() => {
                                                    setInput(q)
                                                    // Optional: auto-send
                                                }}
                                            >
                                                {q}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <ChatMessage
                                        key={msg.id}
                                        id={msg.id}
                                        role={msg.role}
                                        content={msg.content}
                                        timestamp={msg.timestamp}
                                        showCopy
                                    />
                                ))
                            )}

                            {isLoading && (
                                <div className="flex gap-3 max-w-[90%]">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background">
                            <form onSubmit={handleSend} className="relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="pr-12 py-6 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg transition-transform active:scale-95"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Send message</span>
                                </Button>
                            </form>
                            <div className="mt-2 text-center">
                                <p className="text-[10px] text-muted-foreground/60">
                                    AI may produce inaccurate information. You are responsible for verifying output.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
