"use client";

import Image from "next/image";
import { Loader2, Play, ZoomIn } from "lucide-react";
import type { Slide } from "yet-another-react-lightbox";
import type { Post } from "@/lib/api/content.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const isVideoPost = (post: Post) =>
  post.mediaType === "video" ||
  post.media?.type === "video" ||
  Boolean(post.media?.mimetype?.startsWith("video/"));

export const formatDuration = (seconds?: number) => {
  if (!seconds || seconds < 0) return null;
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/** Lightbox slide for a post — needs the YARL `Video` plugin for video posts. */
export const postToSlide = (post: Post): Slide => {
  const src = post.media!.location;
  if (isVideoPost(post)) {
    return {
      type: "video",
      sources: [{ src, type: post.media?.mimetype ?? "video/mp4" }],
    };
  }
  return { src, alt: "Post image" };
};

/** Shared YARL `video` options so every lightbox plays videos the same way. */
export const lightboxVideoOptions = {
  controls: true,
  playsInline: true,
  autoPlay: true,
  preload: "metadata",
} as const;

// ─── Card cover ───────────────────────────────────────────────────────────────

/**
 * Fills a `relative` container with the post's media: an image, or for videos
 * the first frame (the API's `thumbnail` is an unpopulated id, not a URL),
 * plus a play icon, duration badge, and hover overlay.
 */
export function PostMediaCover({ post, sizes }: { post: Post; sizes: string }) {
  const media = post.media;
  if (!media?.location) return null;

  const isVideo = isVideoPost(post);
  const duration = formatDuration(media.duration);
  const isProcessing = isVideo && media.status !== undefined && media.status !== "ready";

  return (
    <>
      {isVideo ? (
        <video
          // #t= forces browsers (notably Safari) to paint a frame instead of a blank box
          src={`${media.location}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          disablePictureInPicture
          className="pointer-events-none absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <Image
          src={media.location}
          alt="Post media"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes={sizes}
        />
      )}

      {/* Always-visible play affordance so videos are recognisable at a glance */}
      {isVideo && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
          <div className="flex size-10 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/30 backdrop-blur-sm">
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin text-white" />
            ) : (
              <Play className="ml-0.5 size-4 fill-white text-white" />
            )}
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex size-11 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40 backdrop-blur-sm">
          {isVideo ? (
            <Play className="ml-0.5 size-5 fill-white text-white" />
          ) : (
            <ZoomIn className="size-5 text-white" />
          )}
        </div>
      </div>

      {/* Video badge: duration, or processing state */}
      {isVideo && (
        <div className="pointer-events-none absolute bottom-2 right-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
            <Play className="size-2.5 fill-white" />
            {isProcessing ? "Processing" : duration ?? "Video"}
          </span>
        </div>
      )}
    </>
  );
}
