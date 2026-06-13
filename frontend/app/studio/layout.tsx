import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata-utils"
import { APP_CONFIG } from "@/lib/config"

export const metadata: Metadata = generatePageMetadata({
  title: "AI Studio - Arduino & Raspberry Pi IDE",
  description: "Self-hosted AI-powered IDE for Arduino and Raspberry Pi. Generate code, visualize wiring, and run virtual simulations using your own API keys.",
  path: "/studio",
  keywords: [
    "open source arduino ide",
    "raspberry pi studio",
    "self-hosted",
    "virtual hardware testing",
    "embedded systems simulator",
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
            description: "Self-hosted AI IDE for embedded systems with virtual simulation.",
            url: `${APP_CONFIG.url}/studio`,
            isAccessibleForFree: true,
          }),
        }}
      />
      {children}
    </>
  )
}
