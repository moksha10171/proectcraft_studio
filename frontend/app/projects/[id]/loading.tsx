import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ProjectDetailSkeleton } from "@/components/ui/skeleton-cards"

export default function Loading() {
    return (
        <>
            <Header />
            <main>
                <ProjectDetailSkeleton />
            </main>
            <Footer />
            <BottomNavigation />
        </>
    )
}
