import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "./axios";
import type { ProfilePicture } from "./users.api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BadgeTopUser {
  _id: string;
  name: string | null;
  email: string;
  profilePicture: ProfilePicture | null;
  badgeCount: number;
}

export interface BadgesOverview {
  usersWithBadges: number;
  top50UsersWithMostBadgesEarned: BadgeTopUser[];
}

interface BadgesOverviewResponse {
  success: boolean;
  message: string;
  data: BadgesOverview;
}

export interface BadgeIcon {
  _id: string;
  fileName: string;
  key: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BadgesPagination {
  itemsPerPage: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

interface BadgesListResponse {
  success: boolean;
  message: string;
  data: Badge[];
  pagination: BadgesPagination;
}

export interface UpdateBadgePayload {
  name: string;
  description: string;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const badgesKeys = {
  overview: ["badges", "overview"] as const,
  list: (page: number, limit: number) => ["badges", "list", page, limit] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchBadgesOverview = async (): Promise<BadgesOverview> => {
  const { data } = await API.get<BadgesOverviewResponse>("/badges/overview");
  return data.data;
};

const fetchBadges = async (
  page: number,
  limit: number
): Promise<BadgesListResponse> => {
  const { data } = await API.get<BadgesListResponse>("/badges", {
    params: { page, limit },
  });
  return data;
};

const updateBadge = async (
  id: string,
  payload: UpdateBadgePayload
): Promise<Badge> => {
  const { data } = await API.patch<{ success: boolean; data: Badge }>(
    `/badges/${id}`,
    payload
  );
  return data.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useBadgesOverview = () =>
  useQuery({
    queryKey: badgesKeys.overview,
    queryFn: fetchBadgesOverview,
    staleTime: 1000 * 60 * 2,
  });

export const useBadges = (page: number, limit: number) =>
  useQuery({
    queryKey: badgesKeys.list(page, limit),
    queryFn: () => fetchBadges(page, limit),
    staleTime: 1000 * 60 * 2,
  });

export const useUpdateBadge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBadgePayload }) =>
      updateBadge(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["badges", "list"] });
    },
  });
};
