import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Globe, Zap, DollarSign, Code2, BookOpen, Package } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import webDevData from "@/data/resources/web-development-resources.json"
import { Metadata } from "next"
import { CodeSnippet } from "@/components/code-snippet"

type ResourceData = typeof webDevData.resources[0]

export async function generateStaticParams() {
    return webDevData.resources.map((resource) => ({
        slug: resource.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const resource = webDevData.resources.find((r) => r.slug === slug)

    if (!resource) {
        return { title: "Resource Not Found" }
    }

    return {
        title: `${resource.name} - Web Development | ProjectCraft`,
        description: resource.shortDesc,
        keywords: `${resource.name}, web development, ${resource.category}, frontend, backend`,
        alternates: {
            canonical: `/resources/web-development/${slug}`,
        },
    }
}

export default async function WebDevResourcePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const resource = webDevData.resources.find((r) => r.slug === slug) as ResourceData | undefined

    if (!resource) {
        notFound()
    }

    const relatedResources = resource.relatedResources
        ? webDevData.resources.filter((r) => resource.relatedResources?.includes(r.slug))
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
                            <Link href="/resources/web-development" className="hover:text-foreground transition-colors">
                                Web Development
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{resource.name}</span>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <section className="border-b border-border bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
                        <Button variant="ghost" asChild className="mb-6 touch-action-manipulation active:scale-[0.98]">
                            <Link href="/resources/web-development">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Web Development
                            </Link>
                        </Button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="flex-1">
                                <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
                                    {resource.category}
                                </Badge>
                                <h1 className="text-4xl font-bold mb-4 md:text-5xl">{resource.name}</h1>
                                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                    {resource.fullDescription}
                                </p>
                                {resource.pricing && (
                                    <div className="flex items-center gap-4 mb-6">
                                        <div>
                                            <div className="text-sm text-muted-foreground">License</div>
                                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
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
                        <h2 className="text-2xl font-bold mb-6">Technical Details</h2>
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
                                <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                <h2 className="text-2xl font-bold">Key Features</h2>
                            </div>
                            <Card className="p-6">
                                <div className="grid gap-3 md:grid-cols-2">
                                    {Object.entries(resource.features).map(([key, value]) => (
                                        <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
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

                {/* Ecosystem */}
                {resource.ecosystem && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <div className="flex items-center gap-3 mb-6">
                                <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                <h2 className="text-2xl font-bold">Ecosystem & Tools</h2>
                            </div>
                            <Card className="p-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {Object.entries(resource.ecosystem).map(([key, value]) => (
                                        <div key={key} className="p-3 rounded-lg bg-emerald-500/5">
                                            <div className="font-semibold text-sm mb-2 text-emerald-600 dark:text-emerald-400">{key}</div>
                                            <div className="text-sm text-muted-foreground">{value}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Best For */}
                {resource.bestFor && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Best For</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {resource.bestFor.map((useCase, index) => (
                                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm leading-relaxed">{useCase}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Learning Path */}
                {resource.learningPath && (
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Learning Path</h2>
                            <Card className="p-6">
                                <div className="space-y-4">
                                    {Object.entries(resource.learningPath).map(([level, description], index) => (
                                        <div key={level} className="flex items-start gap-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="font-semibold text-sm mb-1">{level}</div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Code Example */}
                {resource.codeSnippet && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <div className="flex items-center gap-3 mb-6">
                                <Code2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
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
                    <section className="border-b border-border">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <div className="flex items-center gap-3 mb-6">
                                <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                <h2 className="text-2xl font-bold">Documentation & Tutorials</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {resource.tutorials.map((tutorial, index) => (
                                    <Card key={index} className="p-6 hover:shadow-md transition-shadow group">
                                        <h3 className="font-semibold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
                                                View Resource
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
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <h2 className="text-2xl font-bold mb-6">Related Technologies</h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {relatedResources.map((related) => (
                                    <Link
                                        key={related.slug}
                                        href={`/resources/web-development/${related.slug}`}
                                        className="group"
                                    >
                                        <Card className="p-6 h-full hover:shadow-lg transition-all hover:border-emerald-500/50">
                                            <Badge className="mb-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                {related.category}
                                            </Badge>
                                            <h3 className="font-bold text-lg mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
                <section className="bg-gradient-to-b from-emerald-500/5 to-background">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <Card className="p-8 border-2 border-emerald-500/20 bg-emerald-500/5">
                            <div className="text-center max-w-2xl mx-auto">
                                <Globe className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-4">Start Building Web Apps</h2>
                                <p className="text-muted-foreground mb-6">
                                    Test your web projects in our Build IDE with live preview and instant deployment.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="lg" asChild className="touch-action-manipulation active:scale-[0.98]">
                                        <Link href="/build">
                                            Try Build IDE
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild className="touch-action-manipulation active:scale-[0.98]">
                                        <Link href="/resources/web-development">
                                            More Frameworks
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
