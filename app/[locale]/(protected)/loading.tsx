import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="space-y-4 mb-8">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* Content Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-40 w-full rounded-lg" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
