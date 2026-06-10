"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Images, BookImage, RefreshCw,
  ChevronLeft, ChevronRight, Lock, Globe, ImageIcon,
  CheckCircle2, Clock, ZoomIn, Search, X, Filter,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
// import "yet-another-react-lightbox/styles.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import {
  usePosts,
  useFrames,
  type Post,
  type Frame,
  type ContentPagination,
} from "@/lib/api/content.api";

const PAGE_LIMIT = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-white text-emerald-800 border-emerald-300" },
  pending:   { label: "Pending",   className: "bg-white text-amber-700 border-amber-300" },
  flagged:   { label: "Flagged",   className: "bg-white text-red-700 border-red-300" },
};
const getStatus = (s: string) =>
  STATUS_CONFIG[s.toLowerCase()] ?? {
    label: s,
    className: "bg-white text-muted-foreground border-border",
  };

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
        of{" "}
        <span className="font-medium text-foreground">{pagination.totalItems}</span>
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

// ─── Search + filter bar ──────────────────────────────────────────────────────

type PostStatusFilter = "all" | "completed" | "pending" | "flagged";
type FrameVisibilityFilter = "all" | "public";

function SearchBar({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-9 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center rounded-xl border bg-card overflow-hidden h-9 shrink-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 h-full text-xs font-medium transition-colors border-r last:border-r-0",
            value === opt.value
              ? "bg-primary text-white"
              : "text-muted-foreground hover:bg-muted/50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyData({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Search className="size-5 text-muted-foreground" />
      </div>
      <p className="font-medium">No matching results</p>
      <p className="text-sm text-muted-foreground">
        Try adjusting your search or filters.
      </p>
      <Button variant="outline" size="sm" className="mt-1" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, onView }: { post: Post; onView: () => void }) {
  if (!post.media?.location) return null;
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
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
              status.className
            )}
          >
            {post.status === "completed" ? (
              <CheckCircle2 className="size-2.5" />
            ) : (
              <Clock className="size-2.5" />
            )}
            {status.label}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3 space-y-1">
        {post.caption && (
          <p className="text-[11px] text-foreground/80 line-clamp-1">{post.caption}</p>
        )}
        <p className="text-[11px] text-muted-foreground">{fmtDate(post.createdAt)}</p>
      </div>
    </div>
  );
}

// ─── Frame card ───────────────────────────────────────────────────────────────

function FrameCard({ frame, onClick }: { frame: Frame; onClick?: () => void }) {
  if (!frame.cover?.location) return null;
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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-2.5 pt-12">
          <p title={frame.title} className="text-sm font-semibold text-white leading-snug line-clamp-2">
            {frame.title}
          </p>
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
        <p className="text-[11px] text-muted-foreground">
          {fmtDate(frame.cover?.createdAt ?? "")}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isClickable
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          <ImageIcon className="size-2.5" />
          {frame.totalPosts ?? 0} {frame.totalPosts === 1 ? "post" : "posts"}
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

  // Posts filters
  const [postStatus, setPostStatus] = useState<PostStatusFilter>("all");

  // Frames filters
  const [frameSearch, setFrameSearch] = useState("");
  const [frameVisibility, setFrameVisibility] = useState<FrameVisibilityFilter>("all");

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

  // ── Client-side filtering ──────────────────────────────────────────────────

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (postStatus !== "all" && p.status.toLowerCase() !== postStatus) return false;
      return true;
    });
  }, [posts, postStatus]);

  const filteredFrames = useMemo(() => {
    return frames.filter((f) => {
      if (frameSearch) {
        const q = frameSearch.toLowerCase();
        if (!f.title?.toLowerCase().includes(q)) return false;
      }
      if (frameVisibility === "public" && f.isPrivate) return false;
      return true;
    });
  }, [frames, frameSearch, frameVisibility]);

  const hasPostFilters = postStatus !== "all";
  const hasFrameFilters = frameSearch !== "" || frameVisibility !== "all";

  const clearPostFilters = () => { setPostStatus("all"); };
  const clearFrameFilters = () => { setFrameSearch(""); setFrameVisibility("all"); };

  // Rebuild slide index from filtered posts for lightbox
  const slides = filteredPosts
    .filter((p) => p.media?.location)
    .map((p) => ({ src: p.media!.location, alt: "Post image" }));

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
            <p className="text-sm text-muted-foreground">
              Monitor and review posts and frames across the platform
            </p>
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
              value={
                (postsData?.pagination.totalItems ?? 0) +
                (framesData?.pagination.totalItems ?? 0)
              }
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

        {/* ── Posts tab ── */}
        <TabsContent value="posts" className="mt-6 space-y-4">
          {/* Search + filter bar */}
          {!postsLoading && posts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="size-3.5 text-muted-foreground" />
              </div>
              <FilterChips<PostStatusFilter>
                value={postStatus}
                onChange={setPostStatus}
                options={[
                  { value: "all",       label: "All" },
                  { value: "completed", label: "Completed" },
                  { value: "pending",   label: "Pending" },
                  { value: "flagged",   label: "Flagged" },
                ]}
              />
              {hasPostFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearPostFilters}
                >
                  <X className="size-3.5" /> Clear
                </Button>
              )}
            </div>
          )}

          <div className={cn("transition-opacity", postsFetching && "opacity-60")}>
            {postsLoading ? (
              <GridSkeleton />
            ) : posts.length === 0 ? (
              <EmptyData
                icon={Images}
                title="No posts found"
                sub="Posts will appear here once uploaded."
              />
            ) : filteredPosts.length === 0 ? (
              <EmptySearch onClear={clearPostFilters} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filteredPosts.reduce<{ el: React.ReactNode[]; idx: number }>(
                  (acc, post) => {
                    const slideIdx = post.media?.location ? acc.idx : -1;
                    acc.el.push(
                      <PostCard
                        key={post._id}
                        post={post}
                        onView={() => slideIdx >= 0 && setLightboxIndex(slideIdx)}
                      />
                    );
                    if (post.media?.location) acc.idx += 1;
                    return acc;
                  },
                  { el: [], idx: 0 }
                ).el}
              </div>
            )}
          </div>

          {/* Result count when filtering */}
          {hasPostFilters && filteredPosts.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Showing {filteredPosts.length} of {posts.length} posts on this page
            </p>
          )}

          <Pager
            pagination={postsData?.pagination}
            page={postsPage}
            isFetching={postsFetching}
            onPage={(p) => { setPostsPage(p); clearPostFilters(); }}
          />
        </TabsContent>

        {/* ── Frames tab ── */}
        <TabsContent value="frames" className="mt-6 space-y-4">
          {/* Search + filter bar */}
          {!framesLoading && frames.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <SearchBar
                id="frame-search"
                value={frameSearch}
                onChange={setFrameSearch}
                placeholder="Search by frame title…"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="size-3.5 text-muted-foreground" />
              </div>
              <FilterChips<FrameVisibilityFilter>
                value={frameVisibility}
                onChange={setFrameVisibility}
                options={[]}
              />
              {hasFrameFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearFrameFilters}
                >
                  <X className="size-3.5" /> Clear
                </Button>
              )}
            </div>
          )}

          <div className={cn("transition-opacity", framesFetching && "opacity-60")}>
            {framesLoading ? (
              <GridSkeleton />
            ) : frames.length === 0 ? (
              <EmptyData
                icon={BookImage}
                title="No frames found"
                sub="Frames will appear here once created."
              />
            ) : filteredFrames.length === 0 ? (
              <EmptySearch onClear={clearFrameFilters} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filteredFrames.map((frame) => (
                  <FrameCard
                    key={frame._id}
                    frame={frame}
                    onClick={() =>
                      router.push(`/dashboard/frames/${frame._id}/posts`)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Result count when filtering */}
          {hasFrameFilters && filteredFrames.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Showing {filteredFrames.length} of {frames.length} frames on this page
            </p>
          )}

          <Pager
            pagination={framesData?.pagination}
            page={framesPage}
            isFetching={framesFetching}
            onPage={(p) => { setFramesPage(p); clearFrameFilters(); }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
