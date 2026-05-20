import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;   // tailwind text-* class
  iconBg?: string;      // tailwind bg-* class
  gradient?: boolean;   // use brand gradient bg on icon
  isLoading?: boolean;
  className?: string;
}

export const StatCard = ({
  label,
  value,
  description,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  gradient = false,
  isLoading = false,
  className,
}: StatCardProps) => (
  <Card className={cn("relative overflow-hidden border shadow-sm transition-shadow hover:shadow-md", className)}>
    {/* Subtle top accent bar */}
    <div className={cn("absolute inset-x-0 top-0 h-0.5", gradient ? "bg-brand-gradient" : iconBg)} />

    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-9 w-24" />
          ) : (
            <p className="mt-1.5 text-4xl font-bold tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          )}
          {description && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            gradient ? "bg-brand-gradient text-white" : cn(iconBg, iconColor)
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const StatCardSkeleton = ({ className }: { className?: string }) => (
  <Card className={cn("relative overflow-hidden border shadow-sm", className)}>
    <div className="absolute inset-x-0 top-0 h-0.5 bg-muted" />
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="size-12 rounded-2xl" />
      </div>
    </CardContent>
  </Card>
);
