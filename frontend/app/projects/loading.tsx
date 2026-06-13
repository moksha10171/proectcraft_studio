import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { PageHeaderSkeleton, FilterBarSkeleton, ProjectCardGridSkeleton } from "@/components/ui/skeleton-cards"

export default function Loading() {
    return (
        <>
            <Header />
            <main className="min-h-screen pb-24 md:pb-0">
                <PageHeaderSkeleton />
                <div className="container mx-auto px-4 py-10">
                    <FilterBarSkeleton />
                    <ProjectCardGridSkeleton count={9} />
                </div>
            </main>
            <Footer />
            <BottomNavigation />
        </>
    )
}
