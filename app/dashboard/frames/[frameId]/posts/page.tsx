"use client";

import React, { useState, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookImage,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  ZoomIn,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useFramePosts,
  type FramePost,
  type ContentPagination,
} from "@/lib/api/content.api";

const PAGE_LIMIT = 12;

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
        <span className="font-medium text-foreground">
          {pagination.totalItems}
        </span>
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

// ─── Frame post card ──────────────────────────────────────────────────────────

function FramePostCard({
  post,
  onView,
}: {
  post: FramePost;
  onView: () => void;
}) {
  const imgSrc = post.media?.location;
  if (!imgSrc) return null;

  const status = post.status ?? "unknown";
  const isCompleted = status === "completed";

  return (
    <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted"
        onClick={onView}
      >
        <Image
          src={imgSrc}
          alt="Post image"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Hover zoom overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex size-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/40">
            <ZoomIn className="size-5 text-white" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute left-2 top-2">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
            isCompleted
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-200"
              : "bg-amber-500/15 text-amber-600 border-amber-200"
          )}>
            {isCompleted
              ? <CheckCircle2 className="size-2.5" />
              : <Clock className="size-2.5" />}
            {isCompleted ? "Completed" : "Pending"}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3">
        {post.caption && (
          <p className="mb-1 truncate text-xs font-medium text-foreground">{post.caption}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FramePostsPage({
  params,
}: {
  params: Promise<{ frameId: string }>;
}) {
  const { frameId } = use(params);
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const { data, isLoading, isFetching, refetch } = useFramePosts(frameId, {
    page,
    limit: PAGE_LIMIT,
  });

  const posts = data?.data ?? [];
  const slides = posts
    .filter((p) => p.media?.location)
    .map((p) => ({ src: p.media!.location, alt: "Post image" }));

  return (
    <div className="space-y-6 p-6">
      {/* Lightbox */}
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient">
              <BookImage className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Frame Posts</h1>
              <p className="text-sm text-muted-foreground">
                {data
                  ? `${data.pagination.totalItems} post${data.pagination.totalItems !== 1 ? "s" : ""} in this frame`
                  : "Loading…"}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Grid */}
      <div className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
        {isLoading ? (
          <GridSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <BookImage className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No posts in this frame</p>
            <p className="text-sm text-muted-foreground">
              This frame doesn&apos;t have any posts yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {posts.reduce<{ el: React.ReactNode[]; idx: number }>(
              (acc, post) => {
                const hasMedia = !!post.media?.location;
                const slideIdx = hasMedia ? acc.idx : -1;
                acc.el.push(
                  <FramePostCard
                    key={post._id}
                    post={post}
                    onView={() => slideIdx >= 0 && setLightboxIndex(slideIdx)}
                  />
                );
                if (hasMedia) acc.idx += 1;
                return acc;
              },
              { el: [], idx: 0 }
            ).el}
          </div>
        )}
      </div>

      <Pager
        pagination={data?.pagination}
        page={page}
        isFetching={isFetching}
        onPage={setPage}
      />
    </div>
  );
}
