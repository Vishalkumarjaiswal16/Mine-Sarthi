import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const MetricCardSkeleton = () => {
  return (
    <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-muted/20 border-border hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
            <Skeleton className="h-3 w-16 sm:w-20" />
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-1 sm:mb-2">
          <Skeleton className="h-8 w-16 sm:h-10 sm:w-20" />
          <Skeleton className="h-5 w-6 sm:h-6 sm:w-8" />
        </div>

        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </Card>
  );
};
