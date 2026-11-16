import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata-utils"
import { APP_CONFIG } from "@/lib/config"

export const metadata: Metadata = generatePageMetadata({
  title: "Studio — Arduino Experiment Workbench",
  description: "Build Arduino sketches with the real compiler, run Uno firmware in an in-browser emulator, inspect signals and export experiments. AI assistance is optional.",
  path: "/studio",
  keywords: [
    "open source arduino ide",
    "raspberry pi studio",
    "self-hosted",
    "avr emulator",
    "arduino build and run",
  ],
})

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "ProjectCraft Studio",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web Browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description: "Self-hosted Arduino workbench with real compilation and Uno emulation.",
            url: `${APP_CONFIG.url}/studio`,
            isAccessibleForFree: true,
          }),
        }}
      />
      {children}
    </>
  )
}
