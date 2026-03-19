import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  "aria-label"?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, "aria-label": ariaLabel, ...props }, ref) => {
  // Generate default aria-label if not provided
  const defaultAriaLabel = React.useMemo(() => {
    if (ariaLabel) return ariaLabel;
    const percentage = value ?? 0;
    return `Progress: ${Math.round(percentage)}%`;
  }, [ariaLabel, value]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      aria-label={defaultAriaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? 0}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
