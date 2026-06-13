import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import raspberryPiData from "@/data/resources/raspberry-pi-resources.json"
import { Metadata } from "next"
import { CodeSnippet } from "@/components/code-snippet"
import { RaspberryPi3DViewer } from "@/components/raspberry-pi-3d-viewer"
import { getRaspberryPi3DData, hasRaspberryPi3DVisualization, getRaspberryPiPlaceholderImages } from "@/lib/raspberry-pi-3d-models"
import { ArticleSchema } from "@/components/seo/json-ld"

type ComponentData = typeof raspberryPiData.boards[0] | typeof raspberryPiData.components[0]

export async function generateStaticParams() {
    const allComponents = [...raspberryPiData.boards, ...raspberryPiData.components]
    return allComponents.map((component) => ({
        slug: component.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const allComponents = [...raspberryPiData.boards, ...raspberryPiData.components]
    const component = allComponents.find((c) => c.slug === slug)

    if (!component) {
        return { title: "Component Not Found" }
    }

    return {
        title: `${component.name} - Raspberry Pi Resources | ProjectCraft`,
        description: component.shortDesc,
    }
}

export default async function RaspberryPiComponentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const allComponents = [...raspberryPiData.boards, ...raspberryPiData.components] as ComponentData[]
    const component = allComponents.find((c) => c.slug === slug)

    if (!component) {
        notFound()
    }

    const relatedComponents = component.relatedComponents
        ? allComponents.filter((c) => component.relatedComponents?.includes(c.slug))
        : []

    // Get 3D visualization data
    const visualizationData = getRaspberryPi3DData(component.slug)
    const hasVisualization = hasRaspberryPi3DVisualization(component.slug)

    // Use provided images or fallback to placeholder
    const componentImages = visualizationData.images.length > 0
        ? visualizationData.images
        : getRaspberryPiPlaceholderImages(component.name, component.category)

    return (
        <>
            {/* Structured Data for SEO */}
            <ArticleSchema
                headline={component.name}
                description={component.shortDesc}
                url={`https://projectcraft.in/resources/raspberry-pi/${component.slug}`}
                keywords={[component.category, 'Raspberry Pi', component.name, ...(component.useCases || []).slice(0, 3)]}
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
                            <Link href="/resources/raspberry-pi" className="hover:text-foreground transition-colors">
                                Raspberry Pi
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{component.name}</span>
                        </div>
                    </div>
                </section>

                {/* Hero with integrated 3D Visualizer */}
                <section className="border-b border-border bg-gradient-to-br from-rose-500/5 to-transparent">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
                        <Button variant="ghost" asChild className="mb-6 touch-action-manipulation active:scale-[0.98]">
                            <Link href="/resources/raspberry-pi" aria-label="Go back to Raspberry Pi Resources page">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Raspberry Pi Resources
                            </Link>
                        </Button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left: Content */}
                            <div className="flex-1 lg:max-w-2xl">
                                <Badge className="mb-4 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20">
                                    {component.category}
                                </Badge>
                                <h1 className="text-4xl font-bold mb-4 md:text-5xl">{component.name}</h1>
                                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                    {component.fullDescription || component.shortDesc}
                                </p>
                                {component.pricing && (
                                    <div className="flex items-center gap-4 mb-6">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Typical Price Range</div>
                                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                                {component.pricing}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: 3D Visualizer (Large Screens Only) */}
                            {hasVisualization && (
                                <div className="hidden lg:block lg:w-[450px] xl:w-[500px] shrink-0">
                                    <RaspberryPi3DViewer
                                        componentName={component.name}
                                        componentSlug={component.slug}
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
                        <RaspberryPi3DViewer
                            componentName={component.name}
                            componentSlug={component.slug}
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
                                {Object.entries(component.specifications).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                                        <span className="font-medium text-sm text-muted-foreground">{key}</span>
                                        <span className="text-sm font-semibold text-right ml-4">{value as string}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* GPIO Requirements (for HATs and components) */}
                {"gpioRequirements" in component && component.gpioRequirements && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">GPIO Requirements</h2>
                            <Card className="p-6">
                                <div className="space-y-3">
                                    {Object.entries(component.gpioRequirements).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                                            <span className="font-medium text-sm text-muted-foreground">{key}</span>
                                            <span className="text-sm text-right ml-4">{value as string}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Use Cases */}
                {component.useCases && component.useCases.length > 0 && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Use Cases & Applications</h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {component.useCases.map((useCase, index) => (
                                    <Card key={index} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm leading-relaxed">{useCase}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Code Example */}
                {component.codeSnippet && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Code Example</h2>
                            <CodeSnippet
                                code={component.codeSnippet.code}
                                language={component.codeSnippet.language}
                                title={component.codeSnippet.title}
                            />
                        </div>
                    </section>
                )}

                {/* Compatible Boards */}
                {"compatibleBoards" in component && component.compatibleBoards && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Compatible Raspberry Pi Models</h2>
                            <div className="flex flex-wrap gap-2">
                                {component.compatibleBoards.map((board) => (
                                    <Badge key={board} variant="outline" className="px-4 py-2">
                                        {board}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Tutorials */}
                {component.tutorials && component.tutorials.length > 0 && (
                    <section className="border-b border-border bg-rose-500/5">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Learning Resources & Tutorials</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {component.tutorials.map((tutorial, index) => (
                                    <Card key={index} className="p-5 hover:border-rose-500/50 transition-colors">
                                        <a
                                            href={tutorial.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-3 group"
                                            aria-label={`Open ${tutorial.title} tutorial in new tab`}
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-semibold mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                                    {tutorial.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">{tutorial.url}</p>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 shrink-0 mt-1" />
                                        </a>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Related Components */}
                {relatedComponents.length > 0 && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Related Components</h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {relatedComponents.map((related) => (
                                    <Link
                                        key={related.slug}
                                        href={`/resources/raspberry-pi/${related.slug}`}
                                        className="group p-5 rounded-xl border border-border bg-card hover:border-rose-500/50 hover:shadow-lg transition-all"
                                        aria-label={`View details for ${related.name}`}
                                    >
                                        <Badge variant="secondary" className="mb-2 text-xs">{related.category}</Badge>
                                        <h3 className="font-bold mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
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
