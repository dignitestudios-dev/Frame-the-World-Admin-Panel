"use client";

import { Crown, Download, RefreshCw, ThumbsUp, Trophy, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLeaderboard, type UpvotedEntry, type DownloadedEntry } from "@/lib/api/leaderboard.api";
import type { LeaderboardUser } from "@/lib/api/leaderboard.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null) =>
  name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface PodiumAvatarProps {
  user: LeaderboardUser | null;
  size: "sm" | "md" | "lg";
  ringClass: string;
}

const SIZES = { sm: 48, md: 64, lg: 80 };

function PodiumAvatar({ user, size, ringClass }: PodiumAvatarProps) {
  const px = SIZES[size];
  const sizeClass = size === "lg" ? "size-20" : size === "md" ? "size-16" : "size-12";
  const textClass = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm";

  return (
    <div className={cn("relative rounded-full ring-4 overflow-hidden shrink-0", sizeClass, ringClass)}>
      {user?.profilePicture?.location ? (
        <Image
          src={user.profilePicture.location}
          alt={user.name ?? "User"}
          width={px}
          height={px}
          className="object-cover size-full"
        />
      ) : (
        <div className={cn("size-full flex items-center justify-center font-bold bg-brand-gradient text-white", textClass)}>
          {user ? getInitials(user.name) : <User className="size-4 opacity-60" />}
        </div>
      )}
    </div>
  );
}

// ─── Podium step ──────────────────────────────────────────────────────────────

interface PodiumStepProps {
  rank: 1 | 2 | 3;
  user: LeaderboardUser | null;
  score: number;
  scoreLabel: string;
  isLoading?: boolean;
  onNavigate?: (id: string) => void;
}

const PODIUM_CONFIG = {
  1: {
    order: "order-2",
    avatarSize: "lg" as const,
    platformH: "h-36",
    platformGrad: "from-amber-400 to-yellow-300",
    platformShadow: "shadow-amber-200",
    ringClass: "ring-amber-400",
    rankBg: "bg-amber-400 text-white",
    labelColor: "text-amber-600",
    glow: "drop-shadow-[0_0_18px_rgba(251,191,36,0.5)]",
    crown: true,
  },
  2: {
    order: "order-1",
    avatarSize: "md" as const,
    platformH: "h-24",
    platformGrad: "from-slate-400 to-slate-300",
    platformShadow: "shadow-slate-200",
    ringClass: "ring-slate-400",
    rankBg: "bg-slate-400 text-white",
    labelColor: "text-slate-500",
    glow: "drop-shadow-[0_0_10px_rgba(148,163,184,0.4)]",
    crown: false,
  },
  3: {
    order: "order-3",
    avatarSize: "sm" as const,
    platformH: "h-16",
    platformGrad: "from-orange-400 to-amber-300",
    platformShadow: "shadow-orange-200",
    ringClass: "ring-orange-400",
    rankBg: "bg-orange-400 text-white",
    labelColor: "text-orange-500",
    glow: "drop-shadow-[0_0_10px_rgba(251,146,60,0.4)]",
    crown: false,
  },
} as const;

function PodiumStep({ rank, user, score, scoreLabel, isLoading, onNavigate }: PodiumStepProps) {
  const cfg = PODIUM_CONFIG[rank];

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center gap-2", cfg.order)}>
        <Skeleton className={cn("rounded-full", cfg.avatarSize === "lg" ? "size-20" : cfg.avatarSize === "md" ? "size-16" : "size-12")} />
        <Skeleton className="h-3 w-20 mt-1" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className={cn("w-24 rounded-t-xl", cfg.platformH)} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-1.5 flex-1 max-w-[140px]", cfg.order)}>
      {cfg.crown && (
        <Crown className="size-6 text-amber-400 fill-amber-300 -mb-1" />
      )}

      {/* Clickable avatar + info */}
      <button
        type="button"
        onClick={() => user && onNavigate?.(user._id)}
        disabled={!user}
        className={cn(
          "flex flex-col items-center gap-1.5 group",
          user && "cursor-pointer",
          !user && "cursor-default",
        )}
        title={user ? `View ${user.name ?? "user"}'s profile` : undefined}
      >
        <div className={cn(cfg.glow, "transition-transform group-hover:scale-105")}>
          <PodiumAvatar user={user} size={cfg.avatarSize} ringClass={cfg.ringClass} />
        </div>

        <span className={cn("mt-1 text-xs font-bold px-2 py-0.5 rounded-full", cfg.rankBg)}>
          #{rank}
        </span>

        <p className={cn(
          "text-sm font-semibold text-center leading-tight line-clamp-1 max-w-[120px]",
          user && "group-hover:text-primary transition-colors",
        )}>
          {user?.name ?? "Anonymous"}
        </p>
      </button>

      <p className={cn("text-xs font-medium", cfg.labelColor)}>
        {score.toLocaleString()} {scoreLabel}
      </p>

      <div
        className={cn(
          "w-full rounded-t-2xl bg-gradient-to-b mt-1 flex items-center justify-center shadow-lg",
          cfg.platformH,
          cfg.platformGrad,
          cfg.platformShadow,
        )}
      >
        <span className="text-white font-black text-2xl opacity-30">{rank}</span>
      </div>
    </div>
  );
}

// ─── Rest-of-list row ─────────────────────────────────────────────────────────

interface ListRowProps {
  rank: number;
  user: LeaderboardUser | null;
  score: number;
  scoreLabel: string;
  icon: React.ReactNode;
  onNavigate?: (id: string) => void;
}

function ListRow({ rank, user, score, scoreLabel, icon, onNavigate }: ListRowProps) {
  return (
    <button
      type="button"
      onClick={() => user && onNavigate?.(user._id)}
      disabled={!user}
      className={cn(
        "flex w-full items-center gap-4 px-5 py-3 transition-colors text-left",
        user ? "hover:bg-muted/30 cursor-pointer" : "cursor-default",
      )}
    >
      <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
        #{rank}
      </span>
      <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-border">
        {user?.profilePicture?.location ? (
          <Image
            src={user.profilePicture.location}
            alt={user.name ?? "User"}
            width={36}
            height={36}
            className="object-cover size-full"
          />
        ) : (
          <div className="size-full flex items-center justify-center bg-brand-gradient text-white text-xs font-bold">
            {user ? getInitials(user.name) : "?"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", user && "group-hover:text-primary")}>
          {user?.name ?? "Anonymous"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
        {icon}
        {score.toLocaleString()}
        <span className="text-muted-foreground font-normal">{scoreLabel}</span>
      </div>
    </button>
  );
}

// ─── Tab panel ────────────────────────────────────────────────────────────────

type AnyEntry = (UpvotedEntry | DownloadedEntry);

interface LeaderboardPanelProps {
  entries: AnyEntry[];
  scoreKey: "upvotes" | "downloads";
  scoreLabel: string;
  icon: React.ReactNode;
  isLoading: boolean;
  onNavigate: (id: string) => void;
}

function LeaderboardPanel({ entries, scoreKey, scoreLabel, icon, isLoading, onNavigate }: LeaderboardPanelProps) {
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const getScore = (e: AnyEntry) => (scoreKey === "upvotes" ? (e as UpvotedEntry).upvotes : (e as DownloadedEntry).downloads);

  const podiumOrder: Array<{ rank: 1 | 2 | 3; entry: AnyEntry | undefined }> = [
    { rank: 2, entry: top3[1] },
    { rank: 1, entry: top3[0] },
    { rank: 3, entry: top3[2] },
  ];

  return (
    <div className="space-y-6">
      {/* Podium */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 via-background to-background p-8 pb-0">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-12 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute top-4 left-1/4 size-32 rounded-full bg-amber-300/10 blur-2xl" />

        <div className="relative flex items-end justify-center gap-3 sm:gap-6">
          {podiumOrder.map(({ rank, entry }) => (
            <PodiumStep
              key={rank}
              rank={rank}
              user={entry?.user ?? null}
              score={entry ? getScore(entry) : 0}
              scoreLabel={scoreLabel}
              isLoading={isLoading}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      {/* Rest of list */}
      {(isLoading || rest.length > 0) && (
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              {icon}
              Remaining Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {rest.map((entry) => (
                  <ListRow
                    key={entry.rank}
                    rank={entry.rank}
                    user={entry.user}
                    score={getScore(entry)}
                    scoreLabel={scoreLabel}
                    icon={icon}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const router = useRouter();
  const { data, isLoading, isFetching, refetch } = useLeaderboard();
  const [tab, setTab] = useState<"upvotes" | "downloads">("upvotes");

  const handleNavigate = (userId: string) => {
    router.push(`/dashboard/users?userId=${userId}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient">
            <Trophy className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Global rankings by upvotes and downloads</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="upvotes" className="gap-1.5">
            <ThumbsUp className="size-3.5" /> Upvotes
          </TabsTrigger>
          <TabsTrigger value="downloads" className="gap-1.5">
            <Download className="size-3.5" /> Downloads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upvotes" className="mt-6">
          <LeaderboardPanel
            entries={data?.topUpvotedUsers ?? []}
            scoreKey="upvotes"
            scoreLabel="upvotes"
            icon={<ThumbsUp className="size-3.5" />}
            isLoading={isLoading}
            onNavigate={handleNavigate}
          />
        </TabsContent>

        <TabsContent value="downloads" className="mt-6">
          <LeaderboardPanel
            entries={data?.topDownloadedUsers ?? []}
            scoreKey="downloads"
            scoreLabel="downloads"
            icon={<Download className="size-3.5" />}
            isLoading={isLoading}
            onNavigate={handleNavigate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
