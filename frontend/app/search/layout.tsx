import { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata-utils'

export const metadata: Metadata = generatePageMetadata({
    title: 'Search Projects & Resources - ProjectCraft',
    description: 'Search for Arduino, Raspberry Pi, and Web Development projects, tools, and learning resources on ProjectCraft.',
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
