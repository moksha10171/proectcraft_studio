import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Cpu, Wifi, Zap } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import esp32Resources from "@/data/resources/esp32-resources.json"

export const metadata: Metadata = generatePageMetadata({
    title: "ESP32 & ESP8266 Resources",
    description: "Comprehensive guide to ESP32 and ESP8266 WiFi/Bluetooth microcontrollers with specifications, pinouts, and code examples.",
    path: "/resources/esp32",
    keywords: ["ESP32 guide", "ESP8266 guide", "WiFi microcontrollers", "Bluetooth IoT", "NodeMCU", "Wemos", "virtual testing"],
})

export default function ESP32ResourcesPage() {
    const { overview, boards } = esp32Resources
    const breadcrumbs = generateBreadcrumbs('/resources/esp32')

    // Since all boards use "Board" category, we'll split them by ESP32 vs ESP8266 for better organization
    const esp32Boards = boards.filter(b => b.slug.startsWith('esp32'))
    const esp8266Boards = boards.filter(b => b.slug.startsWith('esp8266') || b.slug.includes('wemos') || b.slug.includes('adafruit'))

    return (
        <>
            <BreadcrumbSchema items={breadcrumbs} />
            <Header />

            <main id="main-content" role="main" aria-label="ESP32 and ESP8266 Resources" className="min-h-screen pb-20 md:pb-0">
                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />
                    <div className="container relative mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
                        <div className="mx-auto max-w-3xl text-center">
                            <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full">
                                <Wifi className="mr-1.5 h-3.5 w-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                WiFi & Bluetooth Microcontrollers
                            </Badge>
                            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                                ESP32 & ESP8266 <span className="text-teal-600 dark:text-teal-400">Resources</span>
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
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10">
                                    <Cpu className="h-6 w-6 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">{overview.totalComponents}</div>
                                <div className="text-sm text-muted-foreground">Development Boards</div>
                            </div>
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10">
                                    <Wifi className="h-6 w-6 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">WiFi + BT</div>
                                <div className="text-sm text-muted-foreground">Wireless Connectivity</div>
                            </div>
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10">
                                    <Zap className="h-6 w-6 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                </div>
                                <div className="text-3xl font-bold tracking-tight">IoT Ready</div>
                                <div className="text-sm text-muted-foreground">Low Power</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ESP32 Boards */}
                <section className="border-b border-border">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mb-12">
                            <h2 className="mb-3 text-3xl font-bold">ESP32 Boards</h2>
                            <p className="text-muted-foreground text-lg">
                                Dual-core processors with WiFi, Bluetooth, and advanced features
                            </p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {esp32Boards.map((board) => (
                                <Link
                                    key={board.slug}
                                    href={`/resources/esp32/${board.slug}`}
                                    className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-24 bg-gradient-to-br from-teal-500/20 via-teal-500/10 to-transparent p-6">
                                        <h3 className="text-xl font-bold group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                                            {board.name}
                                        </h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {board.shortDesc}
                                        </p>
                                        <div className="flex items-center justify-between text-xs">
                                            <Badge variant="secondary" className="rounded-full">
                                                {board.category}
                                            </Badge>
                                            <span className="font-medium text-teal-600 dark:text-teal-400">
                                                {board.pricing}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Virtual Testing CTA */}
                <section className="border-b border-border bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mx-auto max-w-4xl">
                            <div className="grid gap-8 md:grid-cols-2 items-center">
                                <div>
                                    <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                                        💡 IoT Development Made Easy
                                    </Badge>
                                    <h2 className="mb-4 text-3xl font-bold">Test WiFi/BT Projects Virtually</h2>
                                    <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
                                        Simulate ESP32/ESP8266 IoT projects in our AI Studio. Test wireless connectivity, validate code, and optimize power consumption before deploying to actual hardware.
                                    </p>
                                    <Link href="/studio">
                                        <Badge className="cursor-pointer bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 text-sm font-medium inline-flex items-center gap-2 touch-action-manipulation active:scale-[0.98] transition-all">
                                            Try AI Studio - Free
                                            <Wifi className="h-4 w-4" />
                                        </Badge>
                                    </Link>
                                </div>
                                <div className="rounded-2xl border border-accent/20 bg-card p-6">
                                    <h3 className="font-bold mb-4 flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-accent" />
                                        Why Simulate IoT First?
                                    </h3>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold shrink-0">✓</span>
                                            <span>Test WiFi/Bluetooth code without network setup</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold shrink-0">✓</span>
                                            <span>Optimize power consumption for battery projects</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold shrink-0">✓</span>
                                            <span>Debug IoT protocols before hardware deployment</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold shrink-0">✓</span>
                                            <span>Save money by validating project feasibility first</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ESP8266 Boards */}
                <section className="border-b border-border bg-muted/30">
                    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
                        <div className="mb-12">
                            <h2 className="mb-3 text-3xl font-bold">ESP8266 Boards</h2>
                            <p className="text-muted-foreground text-lg">
                                Cost-effective WiFi microcontrollers for IoT projects
                            </p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {esp8266Boards.map((board) => (
                                <Link
                                    key={board.slug}
                                    href={`/resources/esp32/${board.slug}`}
                                    className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/5 touch-action-manipulation active:scale-[0.98]"
                                >
                                    <div className="relative h-24 bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent p-6">
                                        <h3 className="text-xl font-bold group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                                            {board.name}
                                        </h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {board.shortDesc}
                                        </p>
                                        <div className="flex items-center justify-between text-xs">
                                            <Badge variant="secondary" className="rounded-full">
                                                {board.category}
                                            </Badge>
                                            <span className="font-medium text-cyan-600 dark:text-cyan-400">
                                                {board.pricing}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <BottomNavigation />
        </>
    )
}
