import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Cpu, Thermometer, Gauge, Monitor, Radio, Zap } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import arduinoData from "@/data/resources/arduino-resources.json"

export const metadata: Metadata = generatePageMetadata({
    title: "Arduino Resources - Boards, Sensors & Components",
    description: "Complete guide to Arduino boards, sensors, displays, motors, and modules with specifications, wiring diagrams, and C++ code examples.",
    path: "/resources/arduino",
    keywords: ["Arduino guide", "Arduino components", "Arduino sensors", "Arduino boards", "C++ code examples", "embedded systems"],
})

const categoryIcons: Record<string, any> = {
    "Board": Cpu,
    "Sensor": Thermometer,
    "Display": Monitor,
    "Motors & Drivers": Gauge,
    "Communication": Radio,
    "Modules": Zap
}

export default function ArduinoResourcesPage() {
    const allComponents = [...arduinoData.boards, ...arduinoData.components]
    const categories = arduinoData.overview.categories
    const breadcrumbs = generateBreadcrumbs('/resources/arduino')

    return (
        <>
            <BreadcrumbSchema items={breadcrumbs} />
            <Header />

            <main id="main-content" role="main" aria-label="Arduino Resources" className="min-h-screen pb-20 md:pb-0">
                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
                        <Cpu className="absolute top-12 right-12 h-48 w-48" aria-hidden="true" />
                    </div>
                    <div className="container relative mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
                        <div className="mx-auto max-w-3xl">
                            <Badge className="mb-4 bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border-teal-200 dark:border-teal-500/20">
                                Embedded Systems Platform
                            </Badge>
                            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                                Arduino <span className="text-teal-600 dark:text-teal-400">Resources</span>
                            </h1>
                            <p className="mb-4 text-lg leading-relaxed text-muted-foreground md:text-xl">
                                {arduinoData.overview.description}
                            </p>
                            <div className="flex flex-wrap gap-6 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                                        <Cpu className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Components</div>
                                        <div className="font-bold">{arduinoData.overview.totalComponents}+</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                                        <Zap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Categories</div>
                                        <div className="font-bold">{categories.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Quick Nav */}
                <section className="border-b border-border bg-muted/30">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {categories.map((category) => {
                                const Icon = categoryIcons[category] || Zap
                                const count = allComponents.filter(c => c.category === category).length
                                return (
                                    <a
                                        key={category}
                                        href={`#${category.toLowerCase().replace(/\s+/g, '-')}`}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-teal-500/50 hover:bg-teal-500/5 transition-all text-sm font-medium touch-action-manipulation active:scale-95"
                                    >
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                        {category}
                                        <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* Components by Category */}
                {categories.map((category) => {
                    const categoryComponents = allComponents.filter(c => c.category === category)
                    const Icon = categoryIcons[category] || Zap

                    return (
                        <section
                            key={category}
                            id={category.toLowerCase().replace(/\s+/g, '-')}
                            className="border-b border-border"
                        >
                            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
                                        <Icon className="h-6 w-6 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold md:text-3xl">{category}</h2>
                                        <p className="text-sm text-muted-foreground">{categoryComponents.length} items</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {categoryComponents.map((component) => (
                                        <Link
                                            key={component.slug}
                                            href={`/resources/arduino/${component.slug}`}
                                            className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 touch-action-manipulation active:scale-[0.98]"
                                        >
                                            {/* Header */}
                                            <div className="relative h-32 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent p-5">
                                                <Badge variant="secondary" className="mb-2 text-xs">
                                                    {component.category}
                                                </Badge>
                                                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                    {component.name}
                                                </h3>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 space-y-3">
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {component.shortDesc}
                                                </p>

                                                {/* Key Specs Preview */}
                                                {component.specifications && (
                                                    <div className="space-y-1 pt-2">
                                                        {Object.entries(component.specifications).slice(0, 2).map(([key, value]) => (
                                                            <div key={key} className="flex justify-between text-xs">
                                                                <span className="text-muted-foreground">{key}:</span>
                                                                <span className="font-medium">{value as string}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Price */}
                                                {component.pricing && (
                                                    <div className="pt-2 flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">Typical Price:</span>
                                                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                                                            {component.pricing}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )
                })}

                {/* Test Virtually First Section */}
                <section className="border-b border-border bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mx-auto max-w-4xl">
                            <div className="grid gap-8 md:grid-cols-2 items-center">
                                <div>
                                    <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                                        💡 Smart Workflow
                                    </Badge>
                                    <h2 className="mb-4 text-3xl font-bold">Test Before You Buy</h2>
                                    <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
                                        Use our AI Studio to simulate Arduino projects virtually. Test your code, verify wiring, and debug issues before purchasing components. Save money, reduce waste, and build with confidence.
                                    </p>
                                    <Link href="/studio">
                                        <Badge className="cursor-pointer bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 text-sm font-medium inline-flex items-center gap-2 touch-action-manipulation active:scale-[0.98] transition-all">
                                            Try AI Studio - Free
                                            <Zap className="h-4 w-4" />
                                        </Badge>
                                    </Link>
                                </div>
                                <div className="rounded-2xl border border-accent/20 bg-card p-6">
                                    <h3 className="font-bold mb-4 flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-accent" />
                                        Why Test Virtually?
                                    </h3>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold shrink-0">✓</span>
                                            <span>Catch wiring mistakes before damaging components</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold shrink-0">✓</span>
                                            <span>Test code without buying hardware first</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold shrink-0">✓</span>
                                            <span>Experiment with different components safely</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold shrink-0">✓</span>
                                            <span>Learn and iterate faster than with physical hardware</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Getting Started Section */}
                <section className="bg-teal-500/5">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="mb-4 text-3xl font-bold">How to Use These Resources</h2>
                            <p className="mb-8 text-lg text-muted-foreground">
                                Click on any component to view detailed specifications, wiring diagrams,
                                code examples, and tutorials. All code is ready to copy and use in your projects.
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <Badge variant="outline" className="px-4 py-2">Complete Specifications</Badge>
                                <Badge variant="outline" className="px-4 py-2">Wiring Diagrams</Badge>
                                <Badge variant="outline" className="px-4 py-2">C++ Code Examples</Badge>
                                <Badge variant="outline" className="px-4 py-2">Tutorials & Guides</Badge>
                                <Badge variant="outline" className="px-4 py-2">Virtual Testing</Badge>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <BottomNavigation />
        </>
    )
}
