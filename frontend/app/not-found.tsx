import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center p-4">
                <div className="mx-auto max-w-md text-center">
                    <div className="mb-8 flex justify-center">
                        <Logo width={96} height={96} showText={false} className="opacity-50 grayscale" />
                    </div>
                    <div className="mb-8 text-4xl font-bold text-primary/40">404</div>
                    <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Page Not Found</h1>
                    <p className="mb-8 text-lg text-muted-foreground">
                        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button asChild className="rounded-xl h-11 px-6 touch-action-manipulation active:scale-[0.98]">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="rounded-xl h-11 px-6 bg-transparent touch-action-manipulation active:scale-[0.98]">
                            <Link href="/projects">
                                Explore Projects
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
