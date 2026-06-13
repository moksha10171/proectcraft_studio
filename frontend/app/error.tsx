"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { RotateCcw, AlertCircle } from "lucide-react"
import { Logo } from "@/components/logo"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center p-4">
                <div className="mx-auto max-w-md text-center">
                    <div className="mb-8 flex justify-center relative">
                        <Logo width={96} height={96} showText={false} className="opacity-50 grayscale" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <AlertCircle className="h-10 w-10 text-destructive/60" />
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Something went wrong!</h1>
                    <p className="mb-8 text-lg text-muted-foreground">
                        We encountered an unexpected error. Our team has been notified and we're working on it.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button onClick={() => reset()} className="rounded-xl h-11 px-6 touch-action-manipulation active:scale-[0.98]">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        <Button variant="outline" asChild className="rounded-xl h-11 px-6 bg-transparent touch-action-manipulation active:scale-[0.98]">
                            <Link href="/">
                                Go Home
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
