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

// ─── Query keys ───────────────────────────────────────────────────────────────

export const analyticsKeys = {
  overview: ["analytics", "overview"] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const { data } = await API.get<AnalyticsOverviewResponse>("/analytics/overview");
  return data.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useAnalyticsOverview = () =>
  useQuery({
    queryKey: analyticsKeys.overview,
    queryFn: fetchAnalyticsOverview,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
