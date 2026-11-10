import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BottomNavigation } from '@/components/bottom-navigation'
import { generatePageMetadata } from '@/lib/metadata-utils'

export const metadata = generatePageMetadata({
  title: 'Arduino, Raspberry Pi & IoT Resources',
  description: 'Board references, GPIO examples and electronic component guides for the ProjectCraft hardware studio.',
  path: '/resources',
})

const resources = [
  { path: 'arduino', title: 'Arduino', description: 'Board references and C++ examples. Compile Uno, Nano and Mega sketches with the local Arduino CLI.' },
  { path: 'raspberry-pi', title: 'Raspberry Pi', description: 'Linux Raspberry Pi GPIO and Python examples. Pico microcontrollers use a different SDK and pin map.' },
  { path: 'esp32', title: 'ESP32 & IoT', description: 'Wi-Fi microcontroller references. Use the ESP32 Arduino core or PlatformIO externally; the Studio compiler currently targets AVR boards.' },
  { path: 'components', title: 'Electronic components', description: 'Learn about resistors, sensors, displays and actuators before connecting a physical circuit.' },
]

export default function ResourcesPage() {
  return <>
    <Header />
    <main id="main-content" className="container mx-auto min-h-screen px-6 py-16 pb-24">
      <h1 className="text-4xl font-bold">Build with real hardware</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">References for Arduino, Raspberry Pi and IoT projects. Use manufacturer documentation to confirm pinouts and voltage limits. Studio animations illustrate wiring; they do not emulate firmware or electrical behavior.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {resources.map(resource => <Link key={resource.path} href={`/resources/${resource.path}`} className="rounded-2xl border border-border p-6 hover:border-primary">
          <h2 className="text-xl font-semibold">{resource.title}</h2>
          <p className="mt-3 text-muted-foreground">{resource.description}</p>
        </Link>)}
      </div>
      <Link href="/studio" className="mt-10 inline-block font-semibold text-primary">Open Studio →</Link>
    </main>
    <Footer /><BottomNavigation />
  </>
}
