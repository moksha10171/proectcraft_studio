import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchResultsSkeleton } from "@/components/ui/skeleton-cards"

export default function Loading() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-24 md:pb-0">
        {/* Search Header Skeleton */}
        <div className="sticky top-16 z-40 border-b border-border bg-background/95">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-4">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6">
          {/* Popular Searches Skeleton */}
          <div className="space-y-8">
            <section>
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))}
              </div>
            </section>

            <section>
              <Skeleton className="h-5 w-36 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            </section>

            <section>
              <Skeleton className="h-5 w-40 mb-4" />
              <SearchResultsSkeleton />
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNavigation />
    </>
  )
}
