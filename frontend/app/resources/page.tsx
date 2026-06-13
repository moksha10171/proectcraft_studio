import { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Cpu, Microchip, BookOpen, Code, Zap, Wifi, Package, Bot, Cloud, Globe, Shield, Brain, BarChart3, Smartphone } from "lucide-react"
import Link from "next/link"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"

export const metadata: Metadata = generatePageMetadata({
    title: "Development Resources - Hardware, AI Tools & Web Hosting",
    description: "Complete development resources: Arduino, Raspberry Pi, ESP32 hardware + AI coding tools (Copilot, ChatGPT, Claude) + Web hosting (Vercel, Netlify) + React, Next.js guides.",
    path: "/resources",
    keywords: ["Arduino", "Raspberry Pi", "ESP32", "AI coding tools", "GitHub Copilot", "ChatGPT", "web hosting", "Vercel", "Netlify", "React", "Next.js", "TypeScript", "deployment guide", "virtual testing"],
})

export default function ResourcesPage() {
    const breadcrumbs = generateBreadcrumbs('/resources')

    return (
        <>
            <BreadcrumbSchema items={breadcrumbs} />
            <Header />

            <main id="main-content" role="main" aria-label="Development Resources" className="min-h-screen pb-20 md:pb-0">
                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />
                    <div className="container relative mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-24">
                        <div className="mx-auto max-w-3xl text-center">
                            <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full">
                                <BookOpen className="mr-1.5 h-3.5 w-3.5 text-primary" aria-hidden="true" />
                                Hardware Resources & Guides
                            </Badge>
                            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                                Development{" "}
                                <span className="text-primary">Resources</span>
                            </h1>
                            <p className="mb-8 text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                                Everything you need to build: Hardware guides, AI/ML frameworks, data science tools, cybersecurity resources, mobile development, web hosting, and modern frameworks. Test virtually, deploy globally, build smarter.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="border-b border-border bg-card">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
                        <div className="grid gap-8 sm:grid-cols-3">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                    <Cpu className="h-6 w-6 text-primary" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">133</div>
                                <div className="text-sm text-muted-foreground">Components</div>
                            </div>
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                    <Code className="h-6 w-6 text-primary" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">100+</div>
                                <div className="text-sm text-muted-foreground">Code Examples</div>
                            </div>
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                    <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">50+</div>
                                <div className="text-sm text-muted-foreground">Tutorials</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Resource Categories */}
                <section className="border-b border-border">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-12 text-center">
                                <h2 className="mb-3 text-3xl font-bold md:text-4xl">Hardware Resources</h2>
                                <p className="text-muted-foreground text-lg">
                                    Explore resources for Arduino, Raspberry Pi, ESP32/ESP8266, and Electronic Components
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Arduino Card */}
                                <Link
                                    href="/resources/arduino"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-teal-500/20 via-teal-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Cpu className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border-teal-200 dark:border-teal-500/20">
                                                Embedded Systems
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                Arduino
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Explore Arduino boards, sensors, displays, motors, and modules
                                            with complete specs and C++ code. Test your projects virtually in AI Studio before buying hardware.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-teal-500" />
                                                <span>3 Board Types</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-teal-500" />
                                                <span>50 Components</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-teal-500" />
                                                <span>3D Models</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-teal-500" />
                                                <span>Code Examples</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-medium pt-2 text-sm md:text-base">
                                            Explore Arduino
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Raspberry Pi Card */}
                                <Link
                                    href="/resources/raspberry-pi"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Microchip className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20">
                                                Single-Board Computers
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                Raspberry Pi
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Discover Raspberry Pi models, HATs, cameras, and accessories with
                                            GPIO specs and Python code. Test GPIO projects virtually before deploying to hardware.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-rose-500" />
                                                <span>3 Pi Models</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-rose-500" />
                                                <span>13 Components</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-rose-500" />
                                                <span>3D Models</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-rose-500" />
                                                <span>Python Code</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium pt-2 text-sm md:text-base">
                                            Explore Raspberry Pi
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* ESP32/ESP8266 Card */}
                                <Link
                                    href="/resources/esp32"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Wifi className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20">
                                                WiFi & Bluetooth IoT
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                ESP32/ESP8266
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Explore ESP32 and ESP8266 WiFi/Bluetooth microcontrollers with detailed
                                            specs and IoT code. Simulate wireless projects and power consumption before building.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-cyan-500" />
                                                <span>18 Boards</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-cyan-500" />
                                                <span>WiFi + BT</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-cyan-500" />
                                                <span>3D Models</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-cyan-500" />
                                                <span>IoT Ready</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium pt-2 text-sm md:text-base">
                                            Explore ESP32
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Electronic Components Card */}
                                <Link
                                    href="/resources/components"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Package className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">
                                                Essential Electronics
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                Components
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Discover resistors, capacitors, transistors, diodes, and ICs with
                                            specs and circuit examples. Calculate values and test circuits virtually.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-amber-500" />
                                                <span>22 Items</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-amber-500" />
                                                <span>5 Categories</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-amber-500" />
                                                <span>Gallery</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-amber-500" />
                                                <span>Guides</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium pt-2 text-sm md:text-base">
                                            Explore Components
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Software Development Resources */}
                <section className="border-b border-border">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-12 text-center">
                                <h2 className="mb-3 text-3xl font-bold md:text-4xl">Software Development</h2>
                                <p className="text-muted-foreground text-lg">
                                    AI/ML frameworks, data science tools, cybersecurity resources, mobile development, and web technologies
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {/* AI Development Card */}
                                <Link
                                    href="/resources/ai-development"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Bot className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20">
                                                AI-Powered Coding
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                AI Tools
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Master GitHub Copilot, ChatGPT, Claude, and Cursor. Learn prompt engineering and build software 10x faster with AI assistants.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500" />
                                                <span>6 AI Tools</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500" />
                                                <span>Free Options</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500" />
                                                <span>Prompt Guides</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500" />
                                                <span>Token Tips</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium pt-2 text-sm md:text-base">
                                            Explore AI Tools
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Hosting & Deployment Card */}
                                <Link
                                    href="/resources/hosting-deployment"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Cloud className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">
                                                Deploy to Production
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                Hosting
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Deploy with Vercel, Netlify, Railway, or Render. Compare free tiers, pricing, domains, and databases to go from localhost to production.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500" />
                                                <span>6 Platforms</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500" />
                                                <span>Free Tiers</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500" />
                                                <span>Domain Setup</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500" />
                                                <span>5min Deploy</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium pt-2 text-sm md:text-base">
                                            Explore Hosting
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Web Development Card */}
                                <Link
                                    href="/resources/web-development"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Globe className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
                                                Modern Frameworks
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                Web Dev
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Master React, Next.js, Node.js, TypeScript, and Tailwind CSS. Build modern web apps with the latest tools and best practices.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500" />
                                                <span>6 Frameworks</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500" />
                                                <span>TypeScript</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500" />
                                                <span>Code Examples</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500" />
                                                <span>Best Practices</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium pt-2 text-sm md:text-base">
                                            Explore Web Dev
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Cybersecurity Card */}
                                <Link
                                    href="/resources/cybersecurity"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Shield className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20">
                                                Cybersecurity
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                Security Tools
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Master penetration testing, network security, and ethical hacking with industry-standard tools and methodologies.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-red-500" />
                                                <span>8 Tools</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-red-500" />
                                                <span>Free Options</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-red-500" />
                                                <span>Professional</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-red-500" />
                                                <span>Enterprise</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium pt-2 text-sm md:text-base">
                                            Explore Security
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Machine Learning Card */}
                                <Link
                                    href="/resources/machine-learning"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Brain className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20">
                                                AI & ML
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                ML Frameworks
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Build intelligent systems with TensorFlow, PyTorch, and cutting-edge AI frameworks for deep learning and NLP.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500" />
                                                <span>8 Frameworks</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500" />
                                                <span>Free Options</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500" />
                                                <span>Production Ready</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500" />
                                                <span>Scalable</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium pt-2 text-sm md:text-base">
                                            Explore ML
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Data Science Card */}
                                <Link
                                    href="/resources/data-science"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-teal-500/20 via-teal-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <BarChart3 className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border-teal-200 dark:border-teal-500/20">
                                                Data Science
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                Data Tools
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Master data analysis, visualization, and statistical computing with Python, R, Jupyter, and Tableau.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-teal-500" />
                                                <span>8 Libraries</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-teal-500" />
                                                <span>Open Source</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-teal-500" />
                                                <span>Interactive</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-teal-500" />
                                                <span>Enterprise</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-medium pt-2 text-sm md:text-base">
                                            Explore Data Science
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Mobile Development Card */}
                                <Link
                                    href="/resources/mobile-development"
                                    className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-40 md:h-48 bg-gradient-to-br from-indigo-500/20 via-indigo-500/10 to-transparent p-6 md:p-8">
                                        <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                                            <Smartphone className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Badge className="mb-3 md:mb-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">
                                                Mobile Dev
                                            </Badge>
                                            <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                                                Mobile Apps
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Build cross-platform mobile apps with React Native, Flutter, Swift, and Kotlin for iOS and Android.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-indigo-500" />
                                                <span>6 Frameworks</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-indigo-500" />
                                                <span>Native Performance</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-indigo-500" />
                                                <span>Cross-Platform</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-indigo-500" />
                                                <span>Modern UX</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium pt-2 text-sm md:text-base">
                                            Explore Mobile Dev
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="border-b border-border bg-muted/30">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mx-auto max-w-6xl">
                            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
                                What You'll Find
                            </h2>
                            <div className="grid gap-8 md:grid-cols-3">
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                        <Zap className="h-8 w-8 text-primary" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-bold">Detailed Specifications</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Complete technical specs including voltage, current, pins, dimensions,
                                        and operating ranges for accurate project planning.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                        <Code className="h-8 w-8 text-primary" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-bold">Ready-to-Use Code</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Copy-paste code examples in C++ for Arduino and Python for Raspberry Pi,
                                        complete with comments and explanations.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                        <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-bold">Learning Resources</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Curated tutorials, official documentation links, and project ideas
                                        to help you learn and build effectively.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-primary/[0.03]">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="mb-4 text-balance text-2xl font-bold md:text-3xl">
                                Learn, Test Virtually, Then Build
                            </h2>
                            <p className="mb-8 text-pretty leading-relaxed text-muted-foreground">
                                Explore component guides, test your projects in our AI Studio with virtual simulation, and only buy hardware once you know it works. Build smarter, not harder.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                                <Button size="lg" asChild className="w-full sm:w-auto rounded-xl h-12 px-8 touch-action-manipulation active:scale-[0.98]">
                                    <Link href="/studio">
                                        Try AI Studio
                                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto rounded-xl h-12 px-8 bg-transparent touch-action-manipulation active:scale-[0.98]">
                                    <Link href="/resources/arduino">
                                        Arduino Resources
                                    </Link>
                                </Button>
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
