import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Copy, ExternalLink, Check } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import arduinoData from "@/data/resources/arduino-resources.json"
import { Metadata } from "next"
import { CodeSnippet } from "@/components/code-snippet"
import { Arduino3DViewer } from "@/components/arduino-3d-viewer"
import { get3DData, has3DVisualization, getPlaceholderImages } from "@/lib/arduino-3d-models"
import { ArticleSchema } from "@/components/seo/json-ld"

type ComponentData = typeof arduinoData.boards[0] | typeof arduinoData.components[0]

export async function generateStaticParams() {
    const allComponents = [...arduinoData.boards, ...arduinoData.components]
    return allComponents.map((component) => ({
        slug: component.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const allComponents = [...arduinoData.boards, ...arduinoData.components]
    const component = allComponents.find((c) => c.slug === slug)

    if (!component) {
        return { title: "Component Not Found" }
    }

    return {
        title: `${component.name} - Arduino Resources | ProjectCraft`,
        description: `${component.shortDesc} - Test this component virtually in our AI Studio before buying hardware.`,
        alternates: {
            canonical: `/resources/arduino/${slug}`,
        },
    }
}



export default async function ArduinoComponentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const allComponents = [...arduinoData.boards, ...arduinoData.components] as ComponentData[]
    const component = allComponents.find((c) => c.slug === slug)

    if (!component) {
        notFound()
    }

    const relatedComponents = component.relatedComponents
        ? allComponents.filter((c) => component.relatedComponents?.includes(c.slug))
        : []

    // Get 3D visualization data
    const visualizationData = get3DData(component.slug)
    const hasVisualization = has3DVisualization(component.slug)

    // Use provided images or fallback to placeholder
    const componentImages = visualizationData.images.length > 0
        ? visualizationData.images
        : getPlaceholderImages(component.name, component.category)

    return (
        <>
            {/* Structured Data for SEO */}
            <ArticleSchema
                headline={component.name}
                description={component.shortDesc}
                url={`https://projectcraft.in/resources/arduino/${component.slug}`}
                keywords={[component.category, 'Arduino', component.name, ...(component.useCases || []).slice(0, 3)]}
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
                            <Link href="/resources/arduino" className="hover:text-foreground transition-colors">
                                Arduino
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{component.name}</span>
                        </div>
                    </div>
                </section>

                {/* Hero with integrated 3D Visualizer */}
                <section className="border-b border-border bg-gradient-to-br from-teal-500/5 to-transparent">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <Button variant="ghost" asChild className="touch-action-manipulation active:scale-[0.98]">
                                <Link href="/resources/arduino">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Arduino Resources
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="bg-accent/10 border-accent/20 hover:bg-accent/20 touch-action-manipulation active:scale-[0.98]">
                                <Link href="/studio">
                                    Test in AI Studio
                                </Link>
                            </Button>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left: Content */}
                            <div className="flex-1 lg:max-w-2xl">
                                <Badge className="mb-4 bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border-teal-200 dark:border-teal-500/20">
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
                                            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                                {component.pricing}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: 3D Visualizer (Large Screens Only) */}
                            {hasVisualization && (
                                <div className="hidden lg:block lg:w-[450px] xl:w-[500px] shrink-0">
                                    <Arduino3DViewer
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
                        <Arduino3DViewer
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

                {/* Pinout/Wiring (for components) */}
                {"pinout" in component && component.pinout && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Pinout & Wiring</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="p-6">
                                    <h3 className="font-bold mb-4 text-lg">Pin Configuration</h3>
                                    <div className="space-y-2">
                                        {Object.entries(component.pinout).map(([pin, description]) => (
                                            <div key={pin} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                                                <span className="font-mono text-sm font-semibold">{pin}</span>
                                                <span className="text-sm text-muted-foreground ml-4 text-right">{description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                {"wiring" in component && component.wiring && (
                                    <Card className="p-6">
                                        <h3 className="font-bold mb-4 text-lg">Arduino Connection</h3>
                                        <div className="space-y-2">
                                            {Object.entries(component.wiring).map(([from, to]) => (
                                                <div key={from} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                                                    <span className="font-mono text-sm font-semibold bg-teal-500/10 px-2 py-1 rounded">
                                                        {from}
                                                    </span>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span className="text-sm">{to}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>
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
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">
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
                            <h2 className="text-2xl font-bold mb-6">Compatible Arduino Boards</h2>
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
                    <section className="border-b border-border bg-teal-500/5">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Learning Resources & Tutorials</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {component.tutorials.map((tutorial, index) => (
                                    <Card key={index} className="p-5 hover:border-teal-500/50 transition-colors">
                                        <a
                                            href={tutorial.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-3 group touch-action-manipulation active:scale-[0.98]"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-semibold mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                    {tutorial.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">{tutorial.url}</p>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 mt-1" />
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
                                        href={`/resources/arduino/${related.slug}`}
                                        className="group p-5 rounded-xl border border-border bg-card hover:border-teal-500/50 hover:shadow-lg transition-all touch-action-manipulation active:scale-[0.98]"
                                    >
                                        <Badge variant="secondary" className="mb-2 text-xs">{related.category}</Badge>
                                        <h3 className="font-bold mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
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
