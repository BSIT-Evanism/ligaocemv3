import { Skeleton } from "@/components/ui/skeleton";

type RequestsSkeletonProps = {
    rows?: number;
};

export function RequestsSkeleton({ rows = 6 }: RequestsSkeletonProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </div>

            <div className="rounded-lg border bg-card">
                <div className="border-b p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
                <div className="divide-y">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="grid grid-cols-4 items-center gap-4 p-4">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="h-5 w-64" />
                            <div className="flex justify-end gap-2">
                                <Skeleton className="h-9 w-20" />
                                <Skeleton className="h-9 w-9" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RequestsSkeleton;


