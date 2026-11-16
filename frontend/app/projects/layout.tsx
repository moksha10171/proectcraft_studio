import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata-utils"

export const metadata: Metadata = generatePageMetadata({
    title: "All Coding Projects - ProjectCraft",
    description: "Downloadable example sketches and scripts for Arduino and Raspberry Pi, with wiring notes. Open them in ProjectCraft Studio or use them with your own tools.",
    path: "/projects",
    keywords: [
        "coding project library",
        "example sketches",
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
