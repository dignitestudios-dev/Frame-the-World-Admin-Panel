"use client";

import { Award, Medal, RefreshCw, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { useBadgesOverview } from "@/lib/api/badges.api";
import { UserAvatar } from "@/app/dashboard/users/components/user-avatar";

const RANK_STYLES: Record<number, string> = {
  0: "bg-amber-400 text-white",   // gold
  1: "bg-slate-400 text-white",   // silver
  2: "bg-orange-400 text-white",  // bronze
};

const SkeletonLeaderboard = () =>
  Array.from({ length: 8 }).map((_, i) => (
    <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
      <Skeleton className="size-7 rounded-full" />
      <Skeleton className="size-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  ));

export default function BadgesPage() {
  const { data, isLoading, isFetching, refetch } = useBadgesOverview();

  const topUsers = data?.top50UsersWithMostBadgesEarned ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient">
            <Award className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Badges &amp; Recognition</h1>
            <p className="text-sm text-muted-foreground">Badge assignment monitoring and user achievement analytics</p>
          </div>
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Users With Badges"
              value={data?.usersWithBadges ?? 0}
              description="Accounts with at least one badge"
              icon={Medal}
              gradient
            />
            <StatCard
              label="Top Earners Tracked"
              value={topUsers.length}
              description="Top 50 badge leaderboard"
              icon={Trophy}
              gradient
            />
            <StatCard
              label="Total Participants"
              value={topUsers.length}
              description="Users in leaderboard"
              icon={Users}
              gradient
            />
          </>
        )}
      </div>

      {/* Leaderboard */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-amber-500" />
              Top Badge Earners
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {isLoading ? "—" : `${topUsers.length} users`}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-6 py-2">
              <SkeletonLeaderboard />
            </div>
          ) : topUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Award className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium">No badge data yet</p>
              <p className="text-sm text-muted-foreground">Users will appear here once badges are earned.</p>
            </div>
          ) : (
            <div className="divide-y">
              {topUsers.map((user, i) => (
                <div
                  key={user._id}
                  className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/30"
                >
                  {/* Rank */}
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      RANK_STYLES[i] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </div>

                  {/* Avatar */}
                  <UserAvatar
                    name={user.name}
                    email={user.email}
                    photoUrl={user.profilePicture?.location}
                    size="sm"
                  />

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.name ?? "Unnamed User"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>

                  {/* Badge count */}
                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-primary/10 text-primary hover:bg-primary/15"
                  >
                    {user.badgeCount} {user.badgeCount === 1 ? "badge" : "badges"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

