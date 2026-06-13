import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Bot, Zap, DollarSign, Code2, BookOpen } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import aiData from "@/data/resources/ai-development-resources.json"
import { Metadata } from "next"
import { CodeSnippet } from "@/components/code-snippet"

type ResourceData = typeof aiData.resources[0]

export async function generateStaticParams() {
    return aiData.resources.map((resource) => ({
        slug: resource.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const resource = aiData.resources.find((r) => r.slug === slug)

    if (!resource) {
        return { title: "Resource Not Found" }
    }

    return {
        title: `${resource.name} - AI Development Tools | ProjectCraft`,
        description: resource.shortDesc,
        keywords: `${resource.name}, AI coding, prompt engineering, ${resource.category}`,
        alternates: {
            canonical: `/resources/ai-development/${slug}`,
        },
    }
}

export default async function AIResourcePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const resource = aiData.resources.find((r) => r.slug === slug) as ResourceData | undefined

    if (!resource) {
        notFound()
    }

    const relatedResources = resource.alternatives
        ? aiData.resources.filter((r) => resource.alternatives?.includes(r.slug))
        : []

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
                            <Link href="/resources/ai-development" className="hover:text-foreground transition-colors">
                                AI Development
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{resource.name}</span>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <section className="border-b border-border bg-gradient-to-br from-purple-500/5 to-transparent">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
                        <Button variant="ghost" asChild className="mb-6 touch-action-manipulation active:scale-[0.98]">
                            <Link href="/resources/ai-development">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to AI Development
                            </Link>
                        </Button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="flex-1">
                                <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20">
                                    {resource.category}
                                </Badge>
                                <h1 className="text-4xl font-bold mb-4 md:text-5xl">{resource.name}</h1>
                                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                    {resource.fullDescription}
                                </p>
                                {resource.pricing && (
                                    <div className="flex items-center gap-4 mb-6">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Pricing</div>
                                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                {resource.pricing}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Specifications */}
                <section className="border-b border-border">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <h2 className="text-2xl font-bold mb-6">Specifications</h2>
                        <Card className="p-6">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {Object.entries(resource.specifications).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                                        <span className="font-medium text-sm text-muted-foreground">{key}</span>
                                        <span className="text-sm font-semibold text-right ml-4">{value as string}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Features */}
                {resource.features && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <div className="flex items-center gap-3 mb-6">
                                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                <h2 className="text-2xl font-bold">Key Features</h2>
                            </div>
                            <Card className="p-6">
                                <div className="grid gap-3 md:grid-cols-2">
                                    {Object.entries(resource.features).map(([key, value]) => (
                                        <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5">
                                            <div className="h-2 w-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                                            <div>
                                                <div className="font-semibold text-sm mb-1">{key}</div>
                                                <div className="text-sm text-muted-foreground">{value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Use Cases */}
                {resource.useCases && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Use Cases</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {resource.useCases.map((useCase, index) => (
                                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm leading-relaxed">{useCase}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Best Practices */}
                {resource.bestPractices && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Best Practices</h2>
                            <Card className="p-6">
                                <ul className="space-y-3">
                                    {resource.bestPractices.map((practice, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <span className="text-purple-500 font-bold mt-1">✓</span>
                                            <span className="text-sm leading-relaxed">{practice}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Code Example */}
                {resource.codeSnippet && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <div className="flex items-center gap-3 mb-6">
                                <Code2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                <h2 className="text-2xl font-bold">{resource.codeSnippet.title}</h2>
                            </div>
                            <CodeSnippet
                                code={resource.codeSnippet.code}
                                language={resource.codeSnippet.language}
                            />
                        </div>
                    </section>
                )}

                {/* Tutorials & Resources */}
                {resource.tutorials && resource.tutorials.length > 0 && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <div className="flex items-center gap-3 mb-6">
                                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                <h2 className="text-2xl font-bold">Tutorials & Documentation</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {resource.tutorials.map((tutorial, index) => (
                                    <Card key={index} className="p-6 hover:shadow-md transition-shadow group">
                                        <h3 className="font-semibold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {tutorial.title}
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="mt-3 w-full touch-action-manipulation active:scale-[0.98]"
                                        >
                                            <a href={tutorial.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                View Tutorial
                                            </a>
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Related Resources */}
                {relatedResources.length > 0 && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Alternative Tools</h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {relatedResources.map((related) => (
                                    <Link
                                        key={related.slug}
                                        href={`/resources/ai-development/${related.slug}`}
                                        className="group"
                                    >
                                        <Card className="p-6 h-full hover:shadow-lg transition-all hover:border-purple-500/50">
                                            <Badge className="mb-3 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                                                {related.category}
                                            </Badge>
                                            <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                {related.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {related.shortDesc}
                                            </p>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA */}
                <section className="bg-gradient-to-b from-purple-500/5 to-background">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <Card className="p-8 border-2 border-purple-500/20 bg-purple-500/5">
                            <div className="text-center max-w-2xl mx-auto">
                                <Bot className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-4">Ready to Build with AI?</h2>
                                <p className="text-muted-foreground mb-6">
                                    Try our AI-powered Studio to generate Arduino and Raspberry Pi projects instantly.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="lg" asChild className="touch-action-manipulation active:scale-[0.98]">
                                        <Link href="/studio">
                                            Try AI Studio
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild className="touch-action-manipulation active:scale-[0.98]">
                                        <Link href="/resources/ai-development">
                                            More AI Tools
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>
            </main>

            <Footer />
            <BottomNavigation />
        </>
    )
}
