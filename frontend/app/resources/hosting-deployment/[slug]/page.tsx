import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Cloud, Zap, DollarSign, Code2, BookOpen, Server } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import hostingData from "@/data/resources/hosting-deployment-resources.json"
import { Metadata } from "next"
import { CodeSnippet } from "@/components/code-snippet"
import type { ResourceItem } from "@/types/resource"

type ResourceData = ResourceItem

export async function generateStaticParams() {
    return hostingData.resources.map((resource) => ({
        slug: resource.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const resource = hostingData.resources.find((r) => r.slug === slug)

    if (!resource) {
        return { title: "Resource Not Found" }
    }

    return {
        title: `${resource.name} - Hosting & Deployment | ProjectCraft`,
        description: resource.shortDesc,
        keywords: `${resource.name}, web hosting, deployment, ${resource.category}`,
        alternates: {
            canonical: `/resources/hosting-deployment/${slug}`,
        },
    }
}

export default async function HostingResourcePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const resource = hostingData.resources.find((r) => r.slug === slug) as ResourceItem | undefined

    if (!resource) {
        notFound()
    }

    const relatedResources = resource.alternatives
        ? hostingData.resources.filter((r) => resource.alternatives?.includes(r.slug))
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
                            <Link href="/resources/hosting-deployment" className="hover:text-foreground transition-colors">
                                Hosting & Deployment
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{resource.name}</span>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <section className="border-b border-border bg-gradient-to-br from-blue-500/5 to-transparent">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
                        <Button variant="ghost" asChild className="mb-6 touch-action-manipulation active:scale-[0.98]">
                            <Link href="/resources/hosting-deployment">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Hosting & Deployment
                            </Link>
                        </Button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="flex-1">
                                <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">
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
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {resource.pricing}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Code Example */}
                {resource.codeSnippet && (
                    <section className="border-b border-border bg-muted/30">
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                            <div className="flex items-center gap-3 mb-6">
                                <Code2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <h2 className="text-2xl font-bold">Documentation & Guides</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {resource.tutorials.map((tutorial, index) => (
                                    <Card key={index} className="p-6 hover:shadow-md transition-shadow group">
                                        <h3 className="font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                                                View Guide
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
                            <h2 className="text-2xl font-bold mb-6">Alternative Platforms</h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {relatedResources.map((related) => (
                                    <Link
                                        key={related.slug}
                                        href={`/resources/hosting-deployment/${related.slug}`}
                                        className="group"
                                    >
                                        <Card className="p-6 h-full hover:shadow-lg transition-all hover:border-blue-500/50">
                                            <Badge className="mb-3 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                                {related.category}
                                            </Badge>
                                            <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                <section className="bg-gradient-to-b from-blue-500/5 to-background">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <Card className="p-8 border-2 border-blue-500/20 bg-blue-500/5">
                            <div className="text-center max-w-2xl mx-auto">
                                <Cloud className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-4">Ready to Deploy?</h2>
                                <p className="text-muted-foreground mb-6">
                                    Test your web projects in our Build IDE before deploying to production.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="lg" asChild className="touch-action-manipulation active:scale-[0.98]">
                                        <Link href="/build">
                                            Try Build IDE
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild className="touch-action-manipulation active:scale-[0.98]">
                                        <Link href="/resources/hosting-deployment">
                                            More Platforms
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
