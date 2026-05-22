"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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
  usePostUpvotes,
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
  totalUpvotes: {
    label: "Upvotes",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-52 w-full animate-pulse">
      <div className="flex h-full gap-3">
        <div className="flex flex-col justify-between py-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2.5 w-6 rounded bg-muted" />
          ))}
        </div>

        <div className="relative flex-1">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full border-t border-dashed border-muted" />
            ))}
          </div>

          {/* Line path */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 400 160"
            preserveAspectRatio="none"
          >
            <path
              d="M0 140 L50 130 L100 80 L150 85 L200 140 L250 140 L300 140 L350 140 L400 140"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/40"
            />
            {([
              [0, 140], [50, 130], [100, 80], [150, 85],
              [200, 140], [250, 140], [300, 140], [400, 140],
            ] as [number, number][]).map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" className="fill-muted-foreground/30" />
            ))}
          </svg>

          {/* X-axis stubs */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-around">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-2.5 w-8 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PostUpvotesChart() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");
  const { data, isLoading } = usePostUpvotes(period);

  const chartData =
    data?.map((point) => ({
      label: formatLabel(point._id, period),
      totalUpvotes: point.totalUpvotes,
    })) ?? [];

  const total = chartData.reduce((sum, d) => sum + d.totalUpvotes, 0);
  const avg =
    chartData.length > 0 ? Math.round(total / chartData.length) : 0;

  return (
    <Card className="relative overflow-hidden border shadow-sm">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
              <ThumbsUp className="size-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Post Upvotes
              </CardTitle>
              <CardDescription className="text-xs">
                {period === "daily"
                  ? "Day-by-day upvote activity"
                  : period === "monthly"
                  ? "Monthly upvote trends"
                  : "Yearly upvote comparison"}
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

        {/* Stats row */}
        {isLoading ? (
          <Skeleton className="mt-3 h-9 w-24" />
        ) : (
          <div className="mt-3 flex items-end gap-4">
            <div>
              <span className="text-3xl font-bold tracking-tight">
                {total.toLocaleString()}
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">total</span>
            </div>
            {chartData.length > 1 && (
              <div className="mb-0.5 flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                ⌀ {avg.toLocaleString()} avg
              </div>
            )}
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
              <LineChart
                data={chartData}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
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
                {avg > 0 && (
                  <ReferenceLine
                    y={avg}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                )}
                <ChartTooltip
                  cursor={{ stroke: "var(--chart-4)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  dataKey="totalUpvotes"
                  type="monotone"
                  stroke="var(--chart-4)"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "var(--chart-4)", strokeWidth: 0 }}
                  activeDot={{
                    r: 5.5,
                    fill: "var(--chart-4)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
