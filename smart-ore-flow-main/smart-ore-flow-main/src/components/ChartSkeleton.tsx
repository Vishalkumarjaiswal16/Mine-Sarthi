import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ChartSkeleton = () => {
  return (
    <Card className="p-4 sm:p-6 bg-card border-border">
      <div className="mb-3 sm:mb-4">
        <Skeleton className="h-5 w-40 sm:w-48 mb-1" />
        <Skeleton className="h-3 w-32 sm:w-36" />
      </div>

      <div className="mb-4">
        <Skeleton className="h-48 sm:h-56 w-full rounded-lg" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-2 h-0.5 sm:w-3 sm:h-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </Card>
  );
};
