import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Copy, ExternalLink, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import componentsData from "@/data/resources/components-resources.json"
import { Metadata } from "next"
import { CodeSnippet } from "@/components/code-snippet"
import { Components3DViewer } from "@/components/components-3d-viewer"
import { getComponent3DData, hasComponentVisualization, getComponentPlaceholderImages } from "@/lib/components-3d-models"

type ComponentData = typeof componentsData.components[0]

export async function generateStaticParams() {
    return componentsData.components.map((component) => ({
        slug: component.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const component = componentsData.components.find((c) => c.slug === slug)

    if (!component) {
        return { title: "Component Not Found" }
    }

    return {
        title: `${component.name} - Electronic Components | ProjectCraft`,
        description: component.shortDesc,
    }
}

export default async function ComponentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const component = componentsData.components.find((c) => c.slug === slug)

    if (!component) {
        notFound()
    }

    const relatedComponents = component.relatedComponents
        ? componentsData.components.filter((c) => component.relatedComponents?.includes(c.slug))
        : []

    // Get 3D visualization data
    const visualizationData = getComponent3DData(component.slug)
    const hasVisualization = hasComponentVisualization(component.slug)
    
    // Use provided images or fallback to placeholder
    const componentImages = visualizationData.images.length > 0 
        ? visualizationData.images 
        : getComponentPlaceholderImages(component.name, component.category)

    return (
        <>
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
                            <Link href="/resources/components" className="hover:text-foreground transition-colors">
                                Components
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{component.name}</span>
                        </div>
                    </div>
                </section>

                {/* Hero with integrated 3D Visualizer */}
                <section className="border-b border-border bg-gradient-to-br from-amber-500/5 to-transparent">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
                        <Button variant="ghost" asChild className="mb-6 touch-action-manipulation active:scale-[0.98]">
                            <Link href="/resources/components">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Components
                            </Link>
                        </Button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left: Content */}
                            <div className="flex-1 lg:max-w-2xl">
                                <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">
                                    {component.category}
                                </Badge>
                                <h1 className="text-4xl font-bold mb-4 md:text-5xl">{component.name}</h1>
                                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                    {component.fullDescription}
                                </p>
                                {component.pricing && (
                                    <div className="flex items-center gap-4 mb-6">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Typical Price Range</div>
                                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                {component.pricing}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: 3D Visualizer (Large Screens Only) */}
                            {hasVisualization && (
                                <div className="hidden lg:block lg:w-[450px] xl:w-[500px] shrink-0">
                                    <Components3DViewer
                                        componentName={component.name}
                                        componentSlug={component.slug}
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
                        <Components3DViewer
                            componentName={component.name}
                            componentSlug={component.slug}
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

                {/* Identification / Pinout */}
                {"identification" in component && component.identification && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Component Identification</h2>
                            <Card className="p-6">
                                <div className="space-y-2">
                                    {Object.entries(component.identification).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                                            <span className="font-medium text-sm text-muted-foreground">{key}</span>
                                            <span className="text-sm text-right ml-4">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </section>
                )}

                {"pinout" in component && component.pinout && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Pinout Configuration</h2>
                            <Card className="p-6">
                                <div className="space-y-2">
                                    {Object.entries(component.pinout).map(([pin, description]) => (
                                        <div key={pin} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                                            <span className="font-mono text-sm font-semibold">{pin}</span>
                                            <span className="text-sm text-muted-foreground ml-4 text-right">{description}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </section>
                )}

                {"wiring" in component && component.wiring && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Wiring Guide</h2>
                            <Card className="p-6">
                                <div className="space-y-2">
                                    {Object.entries(component.wiring).map(([from, to]) => (
                                        <div key={from} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                                            <span className="font-mono text-sm font-semibold bg-amber-500/10 px-2 py-1 rounded">
                                                {from}
                                            </span>
                                            <span className="text-muted-foreground">→</span>
                                            <span className="text-sm">{to}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Use Cases */}
                <section className="border-b border-border">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Use Cases & Applications</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {component.useCases.map((useCase, index) => (
                                <Card key={index} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm leading-relaxed">{useCase}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Code Example / Circuit */}
                <section className="border-b border-border bg-muted/30">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">
                            {component.codeSnippet.language === "cpp" ? "Code Example" : "Circuit Information"}
                        </h2>
                        <CodeSnippet
                            code={component.codeSnippet.code}
                            language={component.codeSnippet.language}
                            title={component.codeSnippet.title}
                        />
                    </div>
                </section>

                {/* Safety Notes */}
                {"safetyNotes" in component && component.safetyNotes && (
                    <section className="border-b border-border bg-red-500/5">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <div className="flex items-start gap-4 p-6 rounded-xl border-2 border-red-500/20 bg-red-500/5">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-2 text-red-900 dark:text-red-200">Safety & Precautions</h3>
                                    <p className="text-sm leading-relaxed text-red-800 dark:text-red-300">
                                        {component.safetyNotes}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Tutorials */}
                <section className="border-b border-border bg-amber-500/5">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Learning Resources & Tutorials</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {component.tutorials.map((tutorial, index) => (
                                <Card key={index} className="p-5 hover:border-amber-500/50 transition-colors">
                                    <a
                                        href={tutorial.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-3 group"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {tutorial.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">{tutorial.url}</p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 shrink-0 mt-1" />
                                    </a>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Related Components */}
                {relatedComponents.length > 0 && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Related Components</h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {relatedComponents.map((related) => (
                                    <Link
                                        key={related.slug}
                                        href={`/resources/components/${related.slug}`}
                                        className="group p-5 rounded-xl border border-border bg-card hover:border-amber-500/50 hover:shadow-lg transition-all"
                                    >
                                        <Badge variant="secondary" className="mb-2 text-xs">{related.category}</Badge>
                                        <h3 className="font-bold mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
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
