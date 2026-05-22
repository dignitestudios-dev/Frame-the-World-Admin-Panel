"use client";

import {
  ArrowDownToLine,
  ArrowUp,
  FileImage,
  RefreshCw,
  ShieldCheck,
  ThumbsUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { useAnalyticsOverview } from "@/lib/api/analytics.api";
import { ActiveSubscribersChart } from "@/components/charts-and-graphs/ActiveSubscribersChart";
import { PostsCreatedChart } from "@/components/charts-and-graphs/PostsCreatedChart";
import { PostUpvotesChart } from "@/components/charts-and-graphs/PostUpvotesChart";
import { PostDownloadsChart } from "@/components/charts-and-graphs/PostDownloadsChart";

const STAT_CARDS = [
  {
    key: "totalUsers" as const,
    label: "Total Users",
    description: "All registered accounts",
    icon: Users,
  },
  {
    key: "verifiedAgents" as const,
    label: "Verified Agents",
    description: "Identity-approved agents",
    icon: ShieldCheck,
  },
  {
    key: "activeSubscribers" as const,
    label: "Active Subscribers",
    description: "Currently subscribed users",
    icon: ArrowUp,
  },
  {
    key: "totalPosts" as const,
    label: "Total Posts",
    description: "All published content",
    icon: FileImage,
  },
  {
    key: "totalUpvotes" as const,
    label: "Total Upvotes",
    description: "Engagement across posts",
    icon: ThumbsUp,
  },
  {
    key: "totalDownloads" as const,
    label: "Total Downloads",
    description: "Content downloaded",
    icon: ArrowDownToLine,
  },
] as const;

export default function DashboardPage() {
  const { data, isLoading, isFetching, refetch } = useAnalyticsOverview();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Key metrics across the platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : STAT_CARDS.map(({ key, label, description, icon }) => (
              <StatCard
                key={key}
                label={label}
                value={data?.[key] ?? 0}
                description={description}
                icon={icon}
                gradient
              />
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActiveSubscribersChart />
        <PostsCreatedChart />
        <PostUpvotesChart />
        <PostDownloadsChart />
      </div>
    </div>
  );
}

