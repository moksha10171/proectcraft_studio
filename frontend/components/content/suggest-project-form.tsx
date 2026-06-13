"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, Sparkles, Loader2 } from "lucide-react"

export function SuggestProjectForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setIsSubmitting(false)
        setIsSuccess(true)

        // Reset success message after 5 seconds to allow another submission
        setTimeout(() => setIsSuccess(false), 5000)
        e.currentTarget.reset()
    }

    if (isSuccess) {
        return (
            <div className="w-full max-w-lg mx-auto bg-card border border-primary/20 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300 shadow-xl shadow-primary/5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Suggestion Received!</h3>
                <p className="text-muted-foreground">
                    Thanks for your idea. Our team reviews all suggestions and we might build this next!
                </p>
                <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setIsSuccess(false)}
                >
                    Suggest Another
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Request a Project
                        </h3>
                        <p className="text-muted-foreground">
                            Can't find what you're looking for? Tell us what to build next!
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Project Title <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                required
                                placeholder="e.g., AI-Powered Plant Watering System"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="category" className="text-sm font-medium leading-none">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select a category...</option>
                                    <option value="web">Web Development</option>
                                    <option value="arduino">Arduino</option>
                                    <option value="raspberry-pi">Raspberry Pi</option>
                                    <option value="cybersecurity">Cybersecurity</option>
                                    <option value="ai-ml">AI / Machine Learning</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium leading-none">
                                    Your Email (Optional)
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="To notify you when it's live"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium leading-none">
                                Description
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                placeholder="Briefly describe the features you'd like to see..."
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending Suggestion...
                                </>
                            ) : (
                                <>
                                    Submit Request
                                    <Send className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
