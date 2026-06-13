import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { PageHeaderSkeleton, CategoryGridSkeleton } from "@/components/ui/skeleton-cards"

export default function Loading() {
    return (
        <>
            <Header />
            <main className="min-h-screen pb-24 md:pb-0">
                <PageHeaderSkeleton />
                <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
                    <CategoryGridSkeleton count={9} />
                </div>
            </main>
            <Footer />
            <BottomNavigation />
        </>
    )
}
