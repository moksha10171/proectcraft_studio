import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import esp32Data from "@/data/resources/esp32-resources.json"
import { Metadata } from "next"
import { CodeSnippet } from "@/components/code-snippet"
import { ESP323DViewer } from "@/components/esp32-3d-viewer"
import { getESP323DData, hasESP323DVisualization, getESP32PlaceholderImages } from "@/lib/esp32-3d-models"
import { ArticleSchema } from "@/components/seo/json-ld"

type BoardData = typeof esp32Data.boards[0]

export async function generateStaticParams() {
    return esp32Data.boards.map((board) => ({
        slug: board.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const board = esp32Data.boards.find((b) => b.slug === slug)

    if (!board) {
        return { title: "Board Not Found" }
    }

    return {
        title: `${board.name} - ESP32/ESP8266 Resources | ProjectCraft`,
        description: board.shortDesc,
    }
}

export default async function ESP32BoardPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const board = esp32Data.boards.find((b) => b.slug === slug)

    if (!board) {
        notFound()
    }

    const relatedBoards = board.relatedComponents
        ? esp32Data.boards.filter((b) => board.relatedComponents?.includes(b.slug))
        : []

    const isESP32 = board.slug.startsWith('esp32')
    const themeColor = isESP32 ? 'teal' : 'cyan'

    // Get 3D visualization data
    const visualizationData = getESP323DData(board.slug)
    const hasVisualization = hasESP323DVisualization(board.slug)

    // Use provided images or fallback to placeholder
    const componentImages = visualizationData.images.length > 0
        ? visualizationData.images
        : getESP32PlaceholderImages(board.name, board.category)

    return (
        <>
            {/* Structured Data for SEO */}
            <ArticleSchema
                headline={board.name}
                description={board.shortDesc}
                url={`https://projectcraft.in/resources/esp32/${board.slug}`}
                keywords={[board.category, 'ESP32', 'IoT', board.name, ...(board.useCases || []).slice(0, 3)]}
            />

            <Header />

            <main id="main-content" className="min-h-screen pb-20 md:pb-0">
                {/* Breadcrumb */}
                <section className="border-b border-border bg-muted/30">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Link href="/resources" className="hover:text-foreground transition-colors">
                                Resources
                            </Link>
                            <span>/</span>
                            <Link href="/resources/esp32" className="hover:text-foreground transition-colors">
                                ESP32/ESP8266
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{board.name}</span>
                        </div>
                    </div>
                </section>

                {/* Hero with integrated 3D Visualizer */}
                <section className={`border-b border-border bg-gradient-to-br from-${themeColor}-500/5 to-transparent`}>
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
                        <Button variant="ghost" asChild className="mb-6 touch-action-manipulation active:scale-[0.98]">
                            <Link href="/resources/esp32">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to ESP32/ESP8266 Resources
                            </Link>
                        </Button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left: Content */}
                            <div className="flex-1 lg:max-w-2xl">
                                <Badge className={`mb-4 bg-${themeColor}-100 text-${themeColor}-700 dark:bg-${themeColor}-500/10 dark:text-${themeColor}-400 border-${themeColor}-200 dark:border-${themeColor}-500/20`}>
                                    {board.category}
                                </Badge>
                                <h1 className="text-4xl font-bold mb-4 md:text-5xl">{board.name}</h1>
                                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                    {board.fullDescription}
                                </p>
                                {board.pricing && (
                                    <div className="flex items-center gap-4 mb-6">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Typical Price Range</div>
                                            <div className={`text-2xl font-bold text-${themeColor}-600 dark:text-${themeColor}-400`}>
                                                {board.pricing}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: 3D Visualizer (Large Screens Only) */}
                            {hasVisualization && (
                                <div className="hidden lg:block lg:w-[450px] xl:w-[500px] shrink-0">
                                    <ESP323DViewer
                                        componentName={board.name}
                                        componentSlug={board.slug}
                                        sketchfabId={visualizationData.sketchfabId}
                                        compact={true}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3D Visualization (Mobile/Tablet - Below Hero) */}
                {hasVisualization && (
                    <div className="lg:hidden">
                        <ESP323DViewer
                            componentName={board.name}
                            componentSlug={board.slug}
                            sketchfabId={visualizationData.sketchfabId}
                        />
                    </div>
                )}

                {/* Specifications */}
                <section className="border-b border-border">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Technical Specifications</h2>
                        <Card className="p-6">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {Object.entries(board.specifications).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                                        <span className="font-medium text-sm text-muted-foreground">{key}</span>
                                        <span className="text-sm font-semibold text-right ml-4">{value as string}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Pinout */}
                <section className="border-b border-border bg-muted/30">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Pinout Configuration</h2>
                        <Card className="p-6">
                            <div className="space-y-2">
                                {Object.entries(board.pinout).map(([pin, description]) => (
                                    <div key={pin} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                                        <span className="font-mono text-sm font-semibold">{pin}</span>
                                        <span className="text-sm text-muted-foreground ml-4 text-right">{description}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Use Cases */}
                <section className="border-b border-border">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Use Cases & Applications</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {board.useCases.map((useCase, index) => (
                                <Card key={index} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-${themeColor}-500/10 text-${themeColor}-600 dark:text-${themeColor}-400 font-bold`}>
                                            {index + 1}
                                        </div>
                                        <p className="text-sm leading-relaxed">{useCase}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Code Example */}
                <section className="border-b border-border bg-muted/30">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Code Example</h2>
                        <CodeSnippet
                            code={board.codeSnippet.code}
                            language={board.codeSnippet.language}
                            title={board.codeSnippet.title}
                        />
                    </div>
                </section>

                {/* Compatible Boards */}
                <section className="border-b border-border">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Compatible Modules</h2>
                        <div className="flex flex-wrap gap-2">
                            {board.compatibleBoards.map((compat) => (
                                <Badge key={compat} variant="outline" className="px-4 py-2">
                                    {compat}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Tutorials */}
                <section className={`border-b border-border bg-${themeColor}-500/5`}>
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Learning Resources & Tutorials</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {board.tutorials.map((tutorial, index) => (
                                <Card key={index} className={`p-5 hover:border-${themeColor}-500/50 transition-colors`}>
                                    <a
                                        href={tutorial.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-3 group"
                                    >
                                        <div className="flex-1">
                                            <h3 className={`font-semibold mb-1 group-hover:text-${themeColor}-600 dark:group-hover:text-${themeColor}-400 transition-colors`}>
                                                {tutorial.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">{tutorial.url}</p>
                                        </div>
                                        <ExternalLink className={`h-4 w-4 text-muted-foreground group-hover:text-${themeColor}-600 dark:group-hover:text-${themeColor}-400 shrink-0 mt-1`} />
                                    </a>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Related Boards */}
                {relatedBoards.length > 0 && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Related Boards</h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {relatedBoards.map((related) => (
                                    <Link
                                        key={related.slug}
                                        href={`/resources/esp32/${related.slug}`}
                                        className={`group p-5 rounded-xl border border-border bg-card hover:border-${themeColor}-500/50 hover:shadow-lg transition-all`}
                                    >
                                        <Badge variant="secondary" className="mb-2 text-xs">{related.category}</Badge>
                                        <h3 className={`font-bold mb-2 group-hover:text-${themeColor}-600 dark:group-hover:text-${themeColor}-400 transition-colors`}>
                                            {related.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{related.shortDesc}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
            <BottomNavigation />
        </>
    )
}
