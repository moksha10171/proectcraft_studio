import { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata-utils'

export const metadata: Metadata = generatePageMetadata({
    title: 'Search Projects & Resources - ProjectCraft',
    description: 'Search example projects and hardware references for Arduino, Raspberry Pi and ESP32 on ProjectCraft.',
    path: '/search',
    keywords: ['search projects', 'arduino search', 'raspberry pi resources search', 'iot project search'],
})

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
