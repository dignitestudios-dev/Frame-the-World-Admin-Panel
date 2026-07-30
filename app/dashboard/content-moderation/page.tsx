"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Images, BookImage, RefreshCw,
  ChevronLeft, ChevronRight, Lock, Globe, ImageIcon,
  CheckCircle2, Clock, ZoomIn, Search, X, Filter, MoreVertical, Trash2, Ban, Undo,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  usePosts,
  useFrames,
  useDeletePost,
  useBlockPost,
  useRestorePost,
  useDeleteFrame,
  useBlockFrame,
  useRestoreFrame,
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
  pending: { label: "Pending", className: "bg-white text-amber-700 border-amber-300" },
  flagged: { label: "Flagged", className: "bg-white text-red-700 border-red-300" },
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

type PostFilterTab = "all" | "completed" | "pending" | "rejected" | "deleted" | "blocked";
type FrameFilterTab = "all" | "deleted" | "blocked";

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

function PostCard({ 
  post, 
  onView,
  postTab,
  onAction
}: { 
  post: Post; 
  onView: () => void;
  postTab: PostFilterTab;
  onAction: (action: "delete" | "block" | "restore", postId: string) => void;
}) {
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
      <div className="flex items-start justify-between p-3 gap-2">
        <div className="space-y-1">
          {post.caption && (
            <p className="text-[11px] text-foreground/80 line-clamp-1">{post.caption}</p>
          )}
          <p className="text-[11px] text-muted-foreground">{fmtDate(post.createdAt)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1 mt-0">
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(postTab === "all" || postTab === "completed" || postTab === "pending") && (
              <>
                <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => onAction("delete", post._id)}>
                  <Trash2 className="size-4 mr-2" /> Delete
                </DropdownMenuItem>
                <DropdownMenuItem className="text-amber-600 focus:bg-amber-50 focus:text-amber-700" onClick={() => onAction("block", post._id)}>
                  <Ban className="size-4 mr-2" /> Block
                </DropdownMenuItem>
              </>
            )}
            {(postTab === "deleted" || postTab === "blocked") && (
              <DropdownMenuItem className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700" onClick={() => onAction("restore", post._id)}>
                <Undo className="size-4 mr-2" /> Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Frame card ───────────────────────────────────────────────────────────────

function FrameCard({ 
  frame, 
  onClick,
  frameTab,
  onAction
}: { 
  frame: Frame; 
  onClick?: () => void;
  frameTab: FrameFilterTab;
  onAction: (action: "delete" | "block" | "restore", frameId: string) => void;
}) {
  if (!frame.cover?.location) return null;
  const postsCount = frame.posts?.length ?? frame.totalPosts ?? 0;
  const isClickable = postsCount >= 1;
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
        {/* Action Menu */}
        <div className="absolute left-2 top-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="size-7 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm border-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(frameTab === "all") && (
                <>
                  <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => onAction("delete", frame._id)}>
                    <Trash2 className="size-4 mr-2" /> Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-amber-600 focus:bg-amber-50 focus:text-amber-700" onClick={() => onAction("block", frame._id)}>
                    <Ban className="size-4 mr-2" /> Block
                  </DropdownMenuItem>
                </>
              )}
              {(frameTab === "deleted" || frameTab === "blocked") && (
                <DropdownMenuItem className="text-green-600 focus:bg-green-50 focus:text-green-700" onClick={() => onAction("restore", frame._id)}>
                  <RefreshCw className="size-4 mr-2" /> Restore
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
          {postsCount} {postsCount === 1 ? "post" : "posts"}
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
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [frameToDelete, setFrameToDelete] = useState<string | null>(null);
  const [postToBlock, setPostToBlock] = useState<string | null>(null);
  const [frameToBlock, setFrameToBlock] = useState<string | null>(null);

  // Posts filters
  const [postFilter, setPostFilter] = useState<PostFilterTab>("all");

  // Frames filters
  const [frameFilter, setFrameFilter] = useState<FrameFilterTab>("all");
  const [frameSearch, setFrameSearch] = useState("");
  const [debouncedFrameSearch, setDebouncedFrameSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFrameSearch(frameSearch), 500);
    return () => clearTimeout(timer);
  }, [frameSearch]);

  const postsParams: any = { page: postsPage, limit: PAGE_LIMIT };
  if (postFilter === "deleted") postsParams.isDeleted = true;
  else if (postFilter === "blocked") postsParams.isBlockedByAdmin = true;
  else if (postFilter !== "all") postsParams.status = postFilter;

  const {
    data: postsData,
    isLoading: postsLoading,
    isFetching: postsFetching,
    refetch: refetchPosts,
  } = usePosts(postsParams);

  const { mutateAsync: deletePost, isPending: isDeleting } = useDeletePost();
  const { mutateAsync: blockPost, isPending: isBlockingPost } = useBlockPost();
  const { mutateAsync: restorePost } = useRestorePost();

  const handlePostAction = async (action: "delete" | "block" | "restore", postId: string) => {
    if (action === "delete") {
      setPostToDelete(postId);
      return;
    }
    if (action === "block") {
      setPostToBlock(postId);
      return;
    }

    try {
      if (action === "restore") await restorePost(postId);
      toast.success(`Post ${action}d successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} post`);
    }
  };

  const framesParams: any = { page: framesPage, limit: PAGE_LIMIT };
  if (frameFilter === "deleted") framesParams.isDeleted = true;
  else if (frameFilter === "blocked") framesParams.isBlockedByAdmin = true;
  if (debouncedFrameSearch) framesParams.search = debouncedFrameSearch;

  const {
    data: framesData,
    isLoading: framesLoading,
    isFetching: framesFetching,
    refetch: refetchFrames,
  } = useFrames(framesParams);

  const posts = postsData?.data?.posts ?? [];
  const frames = framesData?.data?.frames ?? [];
  const isLoading = postsLoading || framesLoading;
  const isFetching = postsFetching || framesFetching;

  const { mutateAsync: deleteFrame, isPending: isDeletingFrame } = useDeleteFrame();
  const { mutateAsync: blockFrame, isPending: isBlockingFrame } = useBlockFrame();
  const { mutateAsync: restoreFrame } = useRestoreFrame();

  const handleFrameAction = async (action: "delete" | "block" | "restore", frameId: string) => {
    if (action === "delete") {
      setFrameToDelete(frameId);
      return;
    }
    if (action === "block") {
      setFrameToBlock(frameId);
      return;
    }

    try {
      if (action === "restore") await restoreFrame(frameId);
      toast.success(`Frame ${action}d successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} frame`);
    }
  };

  const filteredPosts = posts;

  const filteredFrames = frames;

  const hasPostFilters = postFilter !== "all";
  const hasFrameFilters = frameFilter !== "all" || frameSearch !== "";

  const clearPostFilters = () => { setPostFilter("all"); };
  const clearFrameFilters = () => { setFrameFilter("all"); setFrameSearch(""); };

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
              value={postsData?.data?.pagination?.totalItems ?? 0}
              description="All user-uploaded posts"
              icon={Images}
              gradient
            />
            <StatCard
              label="Total Frames"
              value={framesData?.data?.pagination?.totalItems ?? 0}
              description="All created frames"
              icon={BookImage}
              gradient
            />
            <StatCard
              label="Total Content"
              value={
                (postsData?.data?.pagination?.totalItems ?? 0) +
                (framesData?.data?.pagination?.totalItems ?? 0)
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
            {!isLoading && postsData?.data && (
              <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground">
                {postsData.data.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="frames" className="gap-1.5">
            <BookImage className="size-3.5" /> Frames
            {!isLoading && framesData?.data && (
              <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground">
                {framesData.data.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Posts tab ── */}
        <TabsContent value="posts" className="mt-6 space-y-4">
          {/* Search + filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="size-3.5 text-muted-foreground" />
            </div>
            <FilterChips<PostFilterTab>
              value={postFilter}
              onChange={(v) => { setPostFilter(v); setPostsPage(1); }}
              options={[
                { value: "all", label: "All Posts" },
                { value: "completed", label: "Completed" },
                { value: "pending", label: "Pending" },
                { value: "rejected", label: "Rejected" },
                { value: "deleted", label: "Deleted" },
                { value: "blocked", label: "Blocked" },
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

          <div className={cn("transition-opacity", postsFetching && "opacity-60")}>
            {postsLoading ? (
              <GridSkeleton />
            ) : posts.length === 0 ? (
              <EmptyData
                icon={Images}
                title="No Posts Found"
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
                        postTab={postFilter}
                        onAction={handlePostAction}
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


          <Pager
            pagination={postsData?.data?.pagination}
            page={postsPage}
            isFetching={postsFetching}
            onPage={(p) => { setPostsPage(p); clearPostFilters(); }}
          />
        </TabsContent>

        {/* ── Frames tab ── */}
        <TabsContent value="frames" className="mt-6 space-y-4">
          {/* Search + filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <SearchBar
              id="frame-search"
              value={frameSearch}
              onChange={(v) => { setFrameSearch(v); setFramesPage(1); }}
              placeholder="Search by frame title…"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="size-3.5 text-muted-foreground" />
            </div>
            <FilterChips<FrameFilterTab>
              value={frameFilter}
              onChange={(v) => { setFrameFilter(v); setFramesPage(1); }}
              options={[
                { value: "all", label: "All Frames" },
                { value: "deleted", label: "Deleted" },
                { value: "blocked", label: "Blocked" },
              ]}
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

          <div className={cn("transition-opacity", framesFetching && "opacity-60")}>
            {framesLoading ? (
              <GridSkeleton />
            ) : frames.length === 0 ? (
              <EmptyData
                icon={BookImage}
                title="No Frames Found"
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
                    frameTab={frameFilter}
                    onAction={handleFrameAction}
                    onClick={() =>
                      router.push(`/dashboard/frames/${frame._id}/posts`)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <Pager
            pagination={framesData?.data?.pagination}
            page={framesPage}
            isFetching={framesFetching}
            onPage={(p) => { setFramesPage(p); }}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!postToDelete} onOpenChange={(open) => {
        if (!isDeleting && !open) setPostToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault(); // Prevent the dialog from closing immediately
                if (postToDelete) {
                  try {
                    await deletePost(postToDelete);
                    toast.success("Post deleted successfully");
                    setPostToDelete(null); // Close dialog on success
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || "Failed to delete post");
                  }
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!frameToDelete} onOpenChange={(open) => {
        if (!isDeletingFrame && !open) setFrameToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the frame.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingFrame}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeletingFrame}
              onClick={async (e) => {
                e.preventDefault(); // Prevent the dialog from closing immediately
                if (frameToDelete) {
                  try {
                    await deleteFrame(frameToDelete);
                    toast.success("Frame deleted successfully");
                    setFrameToDelete(null); // Close dialog on success
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || "Failed to delete frame");
                  }
                }
              }}
            >
              {isDeletingFrame ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!postToBlock} onOpenChange={(open) => {
        if (!isBlockingPost && !open) setPostToBlock(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to block this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This post will be hidden from public view until restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlockingPost}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isBlockingPost}
              onClick={async (e) => {
                e.preventDefault();
                if (postToBlock) {
                  try {
                    await blockPost(postToBlock);
                    toast.success("Post blocked successfully");
                    setPostToBlock(null);
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || "Failed to block post");
                  }
                }
              }}
            >
              {isBlockingPost ? "Blocking..." : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!frameToBlock} onOpenChange={(open) => {
        if (!isBlockingFrame && !open) setFrameToBlock(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to block this frame?</AlertDialogTitle>
            <AlertDialogDescription>
              This frame will be hidden from public view until restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlockingFrame}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isBlockingFrame}
              onClick={async (e) => {
                e.preventDefault();
                if (frameToBlock) {
                  try {
                    await blockFrame(frameToBlock);
                    toast.success("Frame blocked successfully");
                    setFrameToBlock(null);
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || "Failed to block frame");
                  }
                }
              }}
            >
              {isBlockingFrame ? "Blocking..." : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
