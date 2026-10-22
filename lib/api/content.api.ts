import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContentMedia {
  _id?: string;
  fileName?: string;
  filename?: string; // some endpoints return lowercase
  originalFilename?: string | null;
  key?: string;
  location: string;
  mimetype?: string; // e.g. "image/jpeg", "video/mp4"
  type?: "image" | "video" | string;
  status?: string; // "ready" once the upload has been processed
  size?: number;
  duration?: number; // seconds, videos only
  thumbnail?: string | {
    _id?: string;
    filename?: string;
    originalFilename?: string | null;
    key?: string;
    location?: string;
    mimetype?: string;
    size?: number;
    status?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export type PostMediaType = "image" | "video" | string;

export interface PostCategory {
  _id: string;
  name: string;
  slug?: string;
}

export interface PostUser {
  _id: string;
  name?: string;
  email?: string;
  profilePicture?: {
    _id?: string;
    key?: string;
    location?: string;
  };
}

export interface Post {
  _id: string;
  media?: ContentMedia | ContentMedia[] | null;
  mediaType?: PostMediaType;
  status: string;
  caption?: string | null;
  categories?: PostCategory[];
  country?: string;
  state?: string;
  createdBy?: PostUser;
  upvotes?: number;
  downloads?: number;
  framed?: number;
  isDeleted?: boolean;
  isBlockedByAdmin?: boolean;
  isContentReleaseAccepted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export function getPostMedia(post: Post): ContentMedia | null {
  if (!post.media) return null;
  if (Array.isArray(post.media)) {
    return post.media[0] ?? null;
  }
  return post.media;
}

export function getPostMediaUrl(post: Post): { previewUrl: string; fullUrl: string; isVideo: boolean } | null {
  const media = getPostMedia(post);
  if (!media?.location) return null;

  const isVideo =
    post.mediaType === "video" ||
    media.type === "video" ||
    Boolean(media.mimetype?.startsWith("video/")) ||
    media.location.toLowerCase().endsWith(".mp4") ||
    media.location.toLowerCase().endsWith(".mov") ||
    media.location.toLowerCase().endsWith(".webm");

  const thumbnailLocation = typeof media.thumbnail === "object" ? media.thumbnail?.location : undefined;
  const previewUrl = isVideo ? (thumbnailLocation || media.location) : media.location;
  const fullUrl = media.location;

  return { previewUrl, fullUrl, isVideo };
}

export interface Frame {
  _id: string;
  title: string;
  cover?: ContentMedia | null;
  totalPosts?: number;
  posts?: string[];
  isPrivate?: boolean;
  country?: string;
  state?: string;
  city?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: {
      key: string;
    };
  };
}

// FramePost = a post returned by GET /frames/:frameId/posts
// Has the same shape as Post
export type FramePost = Post;

export interface ContentPagination {
  itemsPerPage: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

interface PostsResponse {
  success: boolean;
  message: string;
  data: {
    posts: Post[];
    pagination: ContentPagination;
  };
}

interface FramesResponse {
  success: boolean;
  message: string;
  data: {
    frames: Frame[];
    pagination: ContentPagination;
  };
}

interface FramePostsResponse {
  success: boolean;
  message: string;
  data: FramePost[];
  pagination: ContentPagination;
}

export interface ContentParams {
  page?: number;
  limit?: number;
  targetUserId?: string;
  isDeleted?: boolean;
  isBlockedByAdmin?: boolean;
  status?: string;
  search?: string;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const contentKeys = {
  all: ["content"] as const,
  posts: (params: ContentParams) => ["content", "posts", params] as const,
  frames: (params: ContentParams) => ["content", "frames", params] as const,
  framePosts: (frameId: string, params: ContentParams) =>
    ["content", "frame-posts", frameId, params] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchPosts = async (params: ContentParams): Promise<PostsResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.targetUserId) query.set("targetUserId", params.targetUserId);
  if (params.isDeleted) query.set("isDeleted", "true");
  if (params.isBlockedByAdmin) query.set("isBlockedByAdmin", "true");
  if (params.status) query.set("status", params.status);
  const { data } = await API.get<PostsResponse>(`/admin/posts?${query.toString()}`);
  return data;
};

const fetchFrames = async (params: ContentParams): Promise<FramesResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.targetUserId) query.set("targetUserId", params.targetUserId);
  if (params.isDeleted) query.set("isDeleted", "true");
  if (params.isBlockedByAdmin) query.set("isBlockedByAdmin", "true");
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  const { data } = await API.get<FramesResponse>(`/admin/frames?${query.toString()}`);
  return data;
};

const fetchFramePosts = async (
  frameId: string,
  params: ContentParams
): Promise<FramePostsResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const { data } = await API.get<FramePostsResponse>(
    `/frames/${frameId}/posts?${query.toString()}`
  );
  return data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const usePosts = (params: ContentParams) =>
  useQuery({
    queryKey: contentKeys.posts(params),
    queryFn: () => fetchPosts(params),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 2,
  });

export const useFrames = (params: ContentParams) =>
  useQuery({
    queryKey: contentKeys.frames(params),
    queryFn: () => fetchFrames(params),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 2,
  });

export const useFramePosts = (frameId: string, params: ContentParams = {}) =>
  useQuery({
    queryKey: contentKeys.framePosts(frameId, params),
    queryFn: () => fetchFramePosts(frameId, params),
    enabled: !!frameId,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 2,
  });

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await API.patch(`/admin/posts/${postId}/delete`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contentKeys.all }),
  });
};

export const useBlockPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await API.patch(`/admin/posts/${postId}/block`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contentKeys.all }),
  });
};

export const useRestorePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await API.patch(`/admin/posts/${postId}/restore`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contentKeys.all }),
  });
};

export const useDeleteFrame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (frameId: string) => {
      const { data } = await API.patch(`/admin/frames/${frameId}/delete`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contentKeys.all }),
  });
};

export const useBlockFrame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (frameId: string) => {
      const { data } = await API.patch(`/admin/frames/${frameId}/block`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contentKeys.all }),
  });
};

export const useRestoreFrame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (frameId: string) => {
      const { data } = await API.patch(`/admin/frames/${frameId}/restore`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contentKeys.all }),
  });
};
