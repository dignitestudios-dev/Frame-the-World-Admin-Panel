"use client";

import { useState } from "react";
import { FileImage } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  usePostsCreated,
  type AnalyticsPeriod,
} from "@/lib/api/analytics.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function formatLabel(id: string, period: AnalyticsPeriod): string {
  if (period === "daily") {
    const [y, m, d] = id.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (period === "monthly") {
    const [year, month] = id.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return id;
}

// ─── Chart config ─────────────────────────────────────────────────────────────

const chartConfig = {
  count: {
    label: "Posts",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  const bars = [45, 70, 55, 90, 35, 80, 60, 75];
  return (
    <div className="h-52 w-full animate-pulse">
      <div className="flex h-full gap-3">
        {/* Y-axis stubs */}
        <div className="flex flex-col justify-between py-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2.5 w-6 rounded bg-muted" />
          ))}
        </div>

        {/* Bars area */}
        <div className="relative flex-1">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full border-t border-dashed border-muted" />
            ))}
          </div>

          {/* Bar columns */}
          <div className="absolute inset-x-0 bottom-7 flex items-end justify-around gap-1.5 top-1">
            {bars.map((pct, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-muted"
                style={{ height: `${pct}%` }}
              />
            ))}
          </div>

          {/* X-axis stubs */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-around">
            {bars.map((_, i) => (
              <div key={i} className="h-2.5 w-8 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PostsCreatedChart() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");
  const { data, isLoading } = usePostsCreated(period);

  const chartData =
    data?.map((point) => ({
      label: formatLabel(point._id, period),
      count: point.count,
    })) ?? [];

  const total = chartData.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...chartData.map((d) => d.count), 0);

  return (
    <Card className="relative overflow-hidden border shadow-sm">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
              <FileImage className="size-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Posts Created
              </CardTitle>
              <CardDescription className="text-xs">
                {period === "daily"
                  ? "Day-by-day post creation"
                  : period === "monthly"
                  ? "Month-over-month posts"
                  : "Year-over-year posts"}
              </CardDescription>
            </div>
          </div>

          {/* Period toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-all",
                  period === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        {isLoading ? (
          <Skeleton className="mt-3 h-9 w-24" />
        ) : (
          <div className="mt-3 flex items-end gap-3">
            <span className="text-3xl font-bold tracking-tight">
              {total.toLocaleString()}
            </span>
            <span className="mb-1 text-xs text-muted-foreground">
              total posts
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-5">
        {isLoading ? (
          <ChartSkeleton />
        ) : chartData.length === 0 ? (
          <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
            No data for this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={28}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.count === maxCount
                          ? "var(--primary)"
                          : "var(--primary)"
                      }
                      fillOpacity={
                        chartData.length === 1
                          ? 1
                          : 0.4 + 0.6 * (entry.count / (maxCount || 1))
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
