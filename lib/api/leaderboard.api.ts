import { useQuery } from "@tanstack/react-query";
import { API } from "./axios";
import type { ProfilePicture } from "./users.api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardUser {
  _id: string;
  name: string;
  profilePicture: ProfilePicture | null;
}

export interface UpvotedEntry {
  upvotes: number;
  user: LeaderboardUser | null;
  rank: number;
}

export interface DownloadedEntry {
  downloads: number;
  user: LeaderboardUser | null;
  rank: number;
}

export interface LeaderboardData {
  topUpvotedUsers: UpvotedEntry[];
  topDownloadedUsers: DownloadedEntry[];
}

interface LeaderboardResponse {
  success: boolean;
  message: string;
  data: LeaderboardData;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  data: () => ["leaderboard", "data"] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchLeaderboard = async (): Promise<LeaderboardData> => {
  const { data } = await API.get<LeaderboardResponse>("/posts/leaderboard");
  return data.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useLeaderboard = () =>
  useQuery({
    queryKey: leaderboardKeys.data(),
    queryFn: fetchLeaderboard,
    staleTime: 1000 * 60 * 2,
  });
