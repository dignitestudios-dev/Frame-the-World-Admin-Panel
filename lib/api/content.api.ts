import { useQuery } from "@tanstack/react-query";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContentMedia {
  _id?: string;
  fileName?: string;
  filename?: string; // some endpoints return lowercase
  key?: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  _id: string;
  media?: ContentMedia | null;
  status: string;
  caption?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Frame {
  _id: string;
  title: string;
  cover?: ContentMedia | null;
  totalPosts?: number;
  isPrivate?: boolean;
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
  data: Post[];
  pagination: ContentPagination;
}

interface FramesResponse {
  success: boolean;
  message: string;
  data: Frame[];
  pagination: ContentPagination;
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
  const { data } = await API.get<PostsResponse>(`/posts/all?${query.toString()}`);
  return data;
};

const fetchFrames = async (params: ContentParams): Promise<FramesResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.targetUserId) query.set("targetUserId", params.targetUserId);
  const { data } = await API.get<FramesResponse>(`/frames/all?${query.toString()}`);
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
