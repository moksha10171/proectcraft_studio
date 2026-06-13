import { Skeleton } from "@/components/ui/skeleton"

// Reusable skeleton components for loading states

export function ProjectCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-12" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ProjectCardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5">
                    <Skeleton className="h-40 w-full rounded-xl mb-4" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function CategoryCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        </div>
    )
}

export function CategoryGridSkeleton({ count = 9 }: { count?: number }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function ProjectDetailSkeleton() {
    return (
        <div className="min-h-screen pb-24 md:pb-0">
            {/* Breadcrumb skeleton */}
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16" />
                        <span className="text-muted-foreground">/</span>
                        <Skeleton className="h-4 w-24" />
                        <span className="text-muted-foreground">/</span>
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>

            {/* Hero skeleton */}
            <div className="border-b border-border">
                <div className="container mx-auto px-4 py-10 md:py-16">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-2/3" />
                            <div className="flex gap-6 pt-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-28" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Skeleton className="h-12 w-40 rounded-xl" />
                                <Skeleton className="h-12 w-36 rounded-xl" />
                            </div>
                        </div>
                        <div className="lg:w-80 space-y-4">
                            <Skeleton className="h-48 w-full rounded-2xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content skeleton */}
            <div className="container mx-auto px-4 py-10">
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-64 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function SearchResultsSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function ProjectListSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function PageHeaderSkeleton() {
    return (
        <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-10 md:py-12">
                <Skeleton className="h-9 w-64 mb-3" />
                <Skeleton className="h-5 w-96 max-w-full" />
            </div>
        </div>
    )
}

export function FilterBarSkeleton() {
    return (
        <div className="flex flex-wrap gap-3 mb-6">
            <Skeleton className="h-10 w-40 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
    )
}
