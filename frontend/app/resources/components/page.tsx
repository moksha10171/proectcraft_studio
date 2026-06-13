import { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Zap, Package } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import componentsData from "@/data/resources/components-resources.json"

export const metadata: Metadata = generatePageMetadata({
    title: "Electronic Components Library - Resistors, Capacitors & More",
    description: "Essential electronic components including resistors, capacitors, transistors, ICs, and diodes with specifications.",
    path: "/resources/components",
    keywords: ["resistors", "capacitors", "transistors", "ICs", "LEDs", "diodes", "electronics", "components"],
})

export default function ComponentsResourcesPage() {
    const { overview, components } = componentsData
    const breadcrumbs = generateBreadcrumbs('/resources/components')

    // Group by category dynamically from overview
    const categories = overview.categories.reduce((acc, category) => {
        acc[category] = components.filter(c => c.category === category)
        return acc
    }, {} as Record<string, typeof components>)

    return (
        <>
            <BreadcrumbSchema items={breadcrumbs} />
            <Header />

            <main id="main-content" role="main" aria-label="Electronic Components Resources" className="min-h-screen pb-20 md:pb-0">
                {/* Hero */}
                <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />
                    <div className="container relative mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
                        <div className="mx-auto max-w-3xl text-center">
                            <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full">
                                <Package className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                                Fundamental Building Blocks
                            </Badge>
                            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                                Electronic <span className="text-amber-600 dark:text-amber-400">Components</span>
                            </h1>
                            <p className="mb-8 text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                                {overview.description}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="border-b border-border bg-card">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <div className="grid gap-8 sm:grid-cols-3">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                                    <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">{overview.totalComponents}</div>
                                <div className="text-sm text-muted-foreground">Components</div>
                            </div>
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                                    <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">5</div>
                                <div className="text-sm text-muted-foreground">Categories</div>
                            </div>
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                                    <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">Essential</div>
                                <div className="text-sm text-muted-foreground">For All Projects</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories */}
                {Object.entries(categories).map(([categoryName, items], index) => (
                    <section key={categoryName} className={`border-b border-border ${index % 2 === 1 ? 'bg-muted/30' : ''}`}>
                        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                            <div className="mb-12">
                                <h2 className="mb-3 text-3xl font-bold">{categoryName}</h2>
                                <p className="text-muted-foreground text-lg">
                                    {items.length} component{items.length !== 1 ? 's' : ''} in this category
                                </p>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((component) => (
                                    <Link
                                        key={component.slug}
                                        href={`/resources/components/${component.slug}`}
                                        className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5"
                                    >
                                        <div className="relative h-24 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent p-6">
                                            <h3 className="text-xl font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                                                {component.name}
                                            </h3>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {component.shortDesc}
                                            </p>
                                            <div className="flex items-center justify-between text-xs">
                                                <Badge variant="secondary" className="rounded-full">
                                                    {component.category}
                                                </Badge>
                                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                                    {component.pricing}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}
            </main>

            <Footer />
            <BottomNavigation />
        </>
    )
}
