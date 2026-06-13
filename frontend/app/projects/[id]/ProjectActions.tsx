"use client"

import { BookmarkButton } from '@/components/BookmarkButton'
import { Button } from '@/components/ui/button'
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ProjectChatSidebar } from '@/components/chat/project-chat-sidebar'

interface ProjectActionsProps {
    projectSlug: string
    projectTitle: string
    projectUrl: string
    downloadUrl: string
    categorySlug?: string
    categoryName?: string
}

export function ProjectActions({
    projectSlug,
    projectTitle,
    projectUrl,
    downloadUrl,
    categorySlug,
    categoryName,
}: ProjectActionsProps) {
    const [isChatOpen, setIsChatOpen] = useState(false)

    return (
        <>
            <div className="flex flex-wrap gap-3">
                <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                >
                    <Button
                        variant="default"
                        size="lg"
                        className="rounded-xl h-12 px-6 touch-action-manipulation active:scale-[0.98]"
                    >
                        Download Project
                    </Button>
                </a>

                <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsChatOpen(true)}
                    className="rounded-xl h-12 px-6 bg-transparent touch-action-manipulation active:scale-[0.98] border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground"
                >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    AI Assistant
                </Button>

                <BookmarkButton
                    type="project"
                    itemId={projectSlug}
                    title={projectTitle}
                    url={projectUrl}
                    variant="outline"
                    size="lg"
                    className="rounded-xl h-12 px-6 bg-transparent touch-action-manipulation active:scale-[0.98]"
                    showLabel
                />

                {categorySlug && categoryName && (
                    <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="rounded-xl h-12 px-6 bg-transparent touch-action-manipulation active:scale-[0.98]"
                    >
                        <Link href={`/categories/${categorySlug}`}>
                            Explore {categoryName}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </div>

            <ProjectChatSidebar
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                projectTitle={projectTitle}
                projectSlug={projectSlug}
            />
        </>
    )
}
