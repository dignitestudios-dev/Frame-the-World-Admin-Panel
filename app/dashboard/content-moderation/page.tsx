"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Images, BookImage, RefreshCw,
  ChevronLeft, ChevronRight, Lock, Globe, ImageIcon, CheckCircle2, Clock, ZoomIn,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import { usePosts, useFrames, type Post, type Frame, type ContentPagination } from "@/lib/api/content.api";

const PAGE_LIMIT = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-emerald-500/15 text-emerald-600 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-500/15 text-amber-600 border-amber-200" },
  flagged: { label: "Flagged", className: "bg-red-500/15 text-red-600 border-red-200" },
};
const getStatus = (s: string) =>
  STATUS_CONFIG[s.toLowerCase()] ?? { label: s, className: "bg-muted text-muted-foreground border-border" };

// ─── Skeleton grid ────────────────────────────────────────────────────────────

const GridSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-2xl border">
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <div className="space-y-2 p-3">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Pagination bar ───────────────────────────────────────────────────────────

interface PagerProps {
  pagination: ContentPagination | undefined;
  page: number;
  isFetching: boolean;
  onPage: (p: number) => void;
}

function Pager({ pagination, page, isFetching, onPage }: PagerProps) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {(page - 1) * pagination.itemsPerPage + 1}–
          {Math.min(page * pagination.itemsPerPage, pagination.totalItems)}
        </span>{" "}
        of <span className="font-medium text-foreground">{pagination.totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={page === 1 || isFetching}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="size-3.5" /> Prev
        </Button>
        <span className="text-xs font-medium">
          {page} / {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={page === pagination.totalPages || isFetching}
          onClick={() => onPage(page + 1)}
        >
          Next <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, onView }: { post: Post; onView: () => void }) {
  const status = getStatus(post.status);
  return (
    <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image */}
      <div
        className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted"
        onClick={onView}
      >
        <Image
          src={post.media.location}
          alt="Post media"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex size-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/40">
            <ZoomIn className="size-5 text-white" />
          </div>
        </div>
        {/* Status overlay badge */}
        <div className="absolute left-2 top-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm", status.className)}>
            {post.status === "completed" ? <CheckCircle2 className="size-2.5" /> : <Clock className="size-2.5" />}
            {status.label}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3">
        <p className="text-[11px] text-muted-foreground">{fmtDate(post.createdAt)}</p>
      </div>
    </div>
  );
}

// ─── Frame card ───────────────────────────────────────────────────────────────

function FrameCard({ frame, onClick }: { frame: Frame; onClick?: () => void }) {
  const isClickable = (frame.totalPosts ?? 0) >= 1;
  return (
    <div
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isClickable && "cursor-pointer"
      )}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Image with overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={frame.cover.location}
          alt={frame.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Hover overlay — only if clickable */}
        {isClickable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex size-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/40">
              <Images className="size-5 text-white" />
            </div>
          </div>
        )}
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 pb-2.5 pt-8">
          <p className="truncate text-sm font-semibold text-white">{frame.title}</p>
        </div>
        {/* Top badges */}
        <div className="absolute right-2 top-2 flex gap-1.5">
          {frame.isPrivate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Lock className="size-2.5" /> Private
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Globe className="size-2.5" /> Public
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between p-3">
        <p className="text-[11px] text-muted-foreground">{fmtDate(frame.cover.createdAt)}</p>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          isClickable
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}>
          <ImageIcon className="size-2.5" />
          {frame.totalPosts} {frame.totalPosts === 1 ? "post" : "posts"}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentModerationPage() {
  const router = useRouter();
  const [postsPage, setPostsPage] = useState(1);
  const [framesPage, setFramesPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const {
    data: postsData,
    isLoading: postsLoading,
    isFetching: postsFetching,
    refetch: refetchPosts,
  } = usePosts({ page: postsPage, limit: PAGE_LIMIT });

  const {
    data: framesData,
    isLoading: framesLoading,
    isFetching: framesFetching,
    refetch: refetchFrames,
  } = useFrames({ page: framesPage, limit: PAGE_LIMIT });

  const posts = postsData?.data ?? [];
  const frames = framesData?.data ?? [];
  const isLoading = postsLoading || framesLoading;
  const isFetching = postsFetching || framesFetching;

  const slides = posts.map((p) => ({ src: p.media.location, alt: "Post image" }));

  return (
    <div className="space-y-6 p-6">
      {/* YARL Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        plugins={[Zoom, Fullscreen]}
        zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
        styles={{ container: { backgroundColor: "rgba(0,0,0,0.95)" } }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient">
            <ShieldCheck className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content Moderation</h1>
            <p className="text-sm text-muted-foreground">Monitor and review posts and frames across the platform</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchPosts(); refetchFrames(); }}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Posts"
              value={postsData?.pagination.totalItems ?? 0}
              description="All user-uploaded posts"
              icon={Images}
              gradient
            />
            <StatCard
              label="Total Frames"
              value={framesData?.pagination.totalItems ?? 0}
              description="All created frames"
              icon={BookImage}
              gradient
            />
            <StatCard
              label="Total Content"
              value={(postsData?.pagination.totalItems ?? 0) + (framesData?.pagination.totalItems ?? 0)}
              description="Posts + frames combined"
              icon={ShieldCheck}
              gradient
            />
          </>
        )}
      </div>

      {/* Content tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="posts" className="gap-1.5">
            <Images className="size-3.5" /> Posts
            {!isLoading && postsData && (
              <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground">
                {postsData.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="frames" className="gap-1.5">
            <BookImage className="size-3.5" /> Frames
            {!isLoading && framesData && (
              <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground">
                {framesData.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Posts */}
        <TabsContent value="posts" className="mt-6 space-y-4">
          <div className={cn("transition-opacity", postsFetching && "opacity-60")}>
            {postsLoading ? (
              <GridSkeleton />
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-20 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Images className="size-5 text-muted-foreground" />
                </div>
                <p className="font-medium">No posts found</p>
                <p className="text-sm text-muted-foreground">Posts will appear here once uploaded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {posts.map((post, i) => (
                  <PostCard key={post._id} post={post} onView={() => setLightboxIndex(i)} />
                ))}
              </div>
            )}
          </div>
          <Pager
            pagination={postsData?.pagination}
            page={postsPage}
            isFetching={postsFetching}
            onPage={setPostsPage}
          />
        </TabsContent>

        {/* Frames */}
        <TabsContent value="frames" className="mt-6 space-y-4">
          <div className={cn("transition-opacity", framesFetching && "opacity-60")}>
            {framesLoading ? (
              <GridSkeleton />
            ) : frames.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-20 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <BookImage className="size-5 text-muted-foreground" />
                </div>
                <p className="font-medium">No frames found</p>
                <p className="text-sm text-muted-foreground">Frames will appear here once created.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {frames.map((frame) => (
                  <FrameCard
                    key={frame._id}
                    frame={frame}
                    onClick={() => router.push(`/dashboard/frames/${frame._id}/posts`)}
                  />
                ))}
              </div>
            )}
          </div>
          <Pager
            pagination={framesData?.pagination}
            page={framesPage}
            isFetching={framesFetching}
            onPage={setFramesPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

