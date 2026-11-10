import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { OrganizationSchema, WebSiteSchema } from "@/components/seo/json-ld"
import { GlobalErrorBoundary } from "@/components/global-error-boundary"
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ProjectCraft - Arduino & IoT Studio",
    template: "%s | ProjectCraft",
  },
  description:
    "Self-hosted Arduino and Raspberry Pi workbench with a code editor, compiler checks, wiring visualization and optional AI assistance.",
  keywords: [
    "coding projects",
    "open source",
    "arduino projects",
    "raspberry pi projects",
    "self-hosted",
    "developer hub",
    "programming tutorials",
  ],
  authors: [{ name: "ProjectCraft Contributors" }],
  creator: "ProjectCraft",
  publisher: "ProjectCraft",
  category: "Education",
  applicationName: "ProjectCraft",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "ProjectCraft - Arduino & IoT Studio",
    description: "Edit embedded code, check it locally and visualize wiring with optional AI assistance.",
    siteName: "ProjectCraft",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProjectCraft - Arduino & IoT Studio",
    description: "Edit embedded code, check it locally and visualize wiring with optional AI assistance.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#14b8a6" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className="font-sans antialiased">
        <GlobalErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <a href="#main-content" className="skip-link">Skip to main content</a>
            {children}
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
