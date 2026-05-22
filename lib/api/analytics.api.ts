import { useQuery } from "@tanstack/react-query";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  totalUsers: number;
  verifiedAgents: number;
  activeSubscribers: number;
  totalPosts: number;
  totalUpvotes: number;
  totalDownloads: number;
}

interface AnalyticsOverviewResponse {
  success: boolean;
  message: string;
  data: AnalyticsOverview;
}

export type AnalyticsPeriod = "daily" | "monthly" | "yearly";

export interface AnalyticsDataPoint {
  _id: string;
  count: number;
}

export interface UpvotesDataPoint {
  _id: string;
  totalUpvotes: number;
}

export interface DownloadsDataPoint {
  _id: string;
  totalDownloads: number;
}

interface AnalyticsChartResponse {
  success: boolean;
  message: string;
  data: AnalyticsDataPoint[];
}

interface UpvotesChartResponse {
  success: boolean;
  message: string;
  data: UpvotesDataPoint[];
}

interface DownloadsChartResponse {
  success: boolean;
  message: string;
  data: DownloadsDataPoint[];
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const analyticsKeys = {
  overview: ["analytics", "overview"] as const,
  activeSubscribers: (period: AnalyticsPeriod) =>
    ["analytics", "active-subscribers", period] as const,
  postsCreated: (period: AnalyticsPeriod) =>
    ["analytics", "posts-created", period] as const,
  postUpvotes: (period: AnalyticsPeriod) =>
    ["analytics", "post-upvotes", period] as const,
  postDownloads: (period: AnalyticsPeriod) =>
    ["analytics", "post-downloads", period] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const { data } = await API.get<AnalyticsOverviewResponse>("/analytics/overview");
  return data.data;
};

const fetchActiveSubscribers = async (
  period: AnalyticsPeriod
): Promise<AnalyticsDataPoint[]> => {
  const { data } = await API.get<AnalyticsChartResponse>(
    `/analytics/active-subscribers?period=${period}`
  );
  return data.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useAnalyticsOverview = () =>
  useQuery({
    queryKey: analyticsKeys.overview,
    queryFn: fetchAnalyticsOverview,
    staleTime: 1000 * 60 * 2,
  });

export const useActiveSubscribers = (period: AnalyticsPeriod) =>
  useQuery({
    queryKey: analyticsKeys.activeSubscribers(period),
    queryFn: () => fetchActiveSubscribers(period),
    staleTime: 1000 * 60 * 5,
  });

const fetchPostsCreated = async (
  period: AnalyticsPeriod
): Promise<AnalyticsDataPoint[]> => {
  const { data } = await API.get<AnalyticsChartResponse>(
    `/analytics/posts-created?period=${period}`
  );
  return data.data;
};

export const usePostsCreated = (period: AnalyticsPeriod) =>
  useQuery({
    queryKey: analyticsKeys.postsCreated(period),
    queryFn: () => fetchPostsCreated(period),
    staleTime: 1000 * 60 * 5,
  });

const fetchPostUpvotes = async (
  period: AnalyticsPeriod
): Promise<UpvotesDataPoint[]> => {
  const { data } = await API.get<UpvotesChartResponse>(
    `/analytics/post-upvotes?period=${period}`
  );
  return data.data;
};

export const usePostUpvotes = (period: AnalyticsPeriod) =>
  useQuery({
    queryKey: analyticsKeys.postUpvotes(period),
    queryFn: () => fetchPostUpvotes(period),
    staleTime: 1000 * 60 * 5,
  });

const fetchPostDownloads = async (
  period: AnalyticsPeriod
): Promise<DownloadsDataPoint[]> => {
  const { data } = await API.get<DownloadsChartResponse>(
    `/analytics/post-downloads?period=${period}`
  );
  return data.data;
};

export const usePostDownloads = (period: AnalyticsPeriod) =>
  useQuery({
    queryKey: analyticsKeys.postDownloads(period),
    queryFn: () => fetchPostDownloads(period),
    staleTime: 1000 * 60 * 5,
  });
