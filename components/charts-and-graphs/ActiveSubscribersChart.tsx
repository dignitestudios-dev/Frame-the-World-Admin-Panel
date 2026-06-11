"use client";

import { useState } from "react";
import { TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  useActiveSubscribers,
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
    // "2026-05-11" → "May 11"
    const [, month, day] = id.split("-");
    const date = new Date(Number(id.split("-")[0]), Number(month) - 1, Number(day));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (period === "monthly") {
    // "2026-05" → "May '26"
    const [year, month] = id.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  // yearly: just return the year
  return id;
}

// ─── Chart config ─────────────────────────────────────────────────────────────

const chartConfig = {
  count: {
    label: "Subscribers",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-52 w-full animate-pulse">
      {/* Y-axis stubs */}
      <div className="flex h-full gap-3">
        <div className="flex flex-col justify-between py-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2.5 w-6 rounded bg-muted" />
          ))}
        </div>

        {/* Chart area */}
        <div className="relative flex-1">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full border-t border-dashed border-muted" />
            ))}
          </div>

          {/* SVG area wave */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 400 160"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="skelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* filled area */}
            <path
              d="M0 130 C40 110, 60 60, 100 70 S160 100, 200 55 S270 20, 310 40 S370 80, 400 60 L400 160 L0 160 Z"
              fill="url(#skelGrad)"
              className="text-muted-foreground"
            />
            {/* stroke line */}
            <path
              d="M0 130 C40 110, 60 60, 100 70 S160 100, 200 55 S270 20, 310 40 S370 80, 400 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-muted-foreground/40"
            />
            {/* data point dots */}
            {([
              [0, 130], [100, 70], [200, 55], [310, 40], [400, 60],
            ] as [number, number][]).map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" className="fill-muted-foreground/30" />
            ))}
          </svg>

          {/* X-axis stubs */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-1">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-2.5 w-10 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActiveSubscribersChart() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");
  const { data, isLoading } = useActiveSubscribers(period);

  const chartData =
    data?.map((point) => ({
      label: formatLabel(point._id, period),
      count: point.count,
    })) ?? [];

  const total = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="relative overflow-hidden border shadow-sm">
      {/* Brand accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Title + total */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
              <Users className="size-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Active Subscribers
              </CardTitle>
              <CardDescription className="text-xs">
                {period === "daily"
                  ? "Day-by-day subscriber activity"
                  : period === "monthly"
                  ? "Month-over-month growth"
                  : "Year-over-year comparison"}
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

        {/* Total badge */}
        {!isLoading && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-3xl font-bold tracking-tight">
              {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
              <TrendingUp className="size-3" />
              {period === "daily"
                ? "this period"
                : period === "monthly"
                ? "this month"
                : "this year"}
            </div>
          </div>
        )}
        {isLoading && <Skeleton className="mt-3 h-9 w-24" />}
      </CardHeader>

      <CardContent className="pb-5">
        {isLoading ? (
          <ChartSkeleton />
        ) : chartData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No Data For This Period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="subscriberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
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
                  cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="count"
                  type="monotone"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#subscriberGrad)"
                  dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--background)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
