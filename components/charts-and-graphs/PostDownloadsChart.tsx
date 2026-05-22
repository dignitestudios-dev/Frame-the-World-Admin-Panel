"use client";

import { useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
  usePostDownloads,
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
  totalDownloads: {
    label: "Downloads",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  const rows = [90, 65, 80, 50, 20, 45, 30, 55];
  return (
    <div className="h-52 w-full animate-pulse space-y-2 pt-1">
      {rows.map((pct, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2.5 w-12 shrink-0 rounded bg-muted" />
          <div
            className="h-5 rounded-r-sm bg-muted"
            style={{ width: `${pct}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PostDownloadsChart() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");
  const { data, isLoading } = usePostDownloads(period);

  const chartData =
    data?.map((point) => ({
      label: formatLabel(point._id, period),
      totalDownloads: point.totalDownloads,
    })) ?? [];

  const total = chartData.reduce((sum, d) => sum + d.totalDownloads, 0);
  const maxVal = Math.max(...chartData.map((d) => d.totalDownloads), 0);

  return (
    <Card className="relative overflow-hidden border shadow-sm">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
              <ArrowDownToLine className="size-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Post Downloads
              </CardTitle>
              <CardDescription className="text-xs">
                {period === "daily"
                  ? "Day-by-day download activity"
                  : period === "monthly"
                  ? "Monthly download trends"
                  : "Yearly download comparison"}
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

        {isLoading ? (
          <Skeleton className="mt-3 h-9 w-24" />
        ) : (
          <div className="mt-3 flex items-end gap-3">
            <span className="text-3xl font-bold tracking-tight">
              {total.toLocaleString()}
            </span>
            <span className="mb-1 text-xs text-muted-foreground">
              total downloads
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
                layout="vertical"
                data={chartData}
                margin={{ left: 8, right: 36, top: 4, bottom: 4 }}
                barCategoryGap="25%"
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={64}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="totalDownloads" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  <LabelList
                    dataKey="totalDownloads"
                    position="right"
                    style={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill="var(--chart-3)"
                      fillOpacity={
                        chartData.length === 1
                          ? 1
                          : 0.35 + 0.65 * (entry.totalDownloads / (maxVal || 1))
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
