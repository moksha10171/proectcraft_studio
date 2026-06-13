import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata-utils"

export const metadata: Metadata = generatePageMetadata({
    title: "All Coding Projects - ProjectCraft",
    description: "Browse 1000+ free coding projects and tutorials for web development, Arduino, Raspberry Pi, and more. Download source code or test projects virtually in our AI Studio.",
    path: "/projects",
    keywords: [
        "coding project library",
        "free source code",
        "web development tutorials",
        "arduino project list",
        "raspberry pi projects",
        "coding for beginners",
    ],
})

export default function ProjectsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
