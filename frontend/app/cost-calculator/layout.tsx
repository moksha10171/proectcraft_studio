import { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata-utils'

export const metadata: Metadata = generatePageMetadata({
    title: 'Project Cost Calculator - Hardware & Component Estimates',
    description: 'Estimate the cost of your Arduino or Raspberry Pi projects. Calculate hardware expenses including components, regional taxes, and contingency buffers.',
    path: '/cost-calculator',
    keywords: ['project cost calculator', 'hardware estimate', 'arduino components price', 'raspberry pi cost', 'iot project budget'],
})

export default function CostCalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
