import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const WeatherWidgetSkeleton = () => {
  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-card to-muted/20 border-border relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32 sm:w-36 mb-1" />
            <Skeleton className="h-3 w-24 sm:w-28" />
          </div>
          <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 ml-2 flex-shrink-0" />
        </div>

        <div className="flex items-baseline gap-1 sm:gap-2 mb-3 sm:mb-4">
          <Skeleton className="h-10 w-16 sm:h-12 sm:w-20" />
          <Skeleton className="h-6 w-4 sm:h-7 sm:w-5" />
          <Skeleton className="h-5 w-12 sm:h-6 sm:w-16 ml-1 sm:ml-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <div className="min-w-0">
              <Skeleton className="h-3 w-12 mb-1" />
              <Skeleton className="h-3 w-8 sm:w-10" />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <div className="min-w-0">
              <Skeleton className="h-3 w-8 mb-1" />
              <Skeleton className="h-3 w-10 sm:w-12" />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <div className="min-w-0">
              <Skeleton className="h-3 w-12 mb-1" />
              <Skeleton className="h-3 w-8 sm:w-10" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
