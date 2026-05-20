import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserStatus = "activated" | "deactivated";

export interface UserAddress {
  street: string;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
}

export interface UserCompany {
  _id: string;
  name: string;
  address: UserAddress;
}

export interface ProfilePicture {
  _id: string;
  filename: string;
  key: string;
  location: string;
  mimetype: string;
  size: number;
}

export interface CategoryPreference {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent: string | null;
  isActive: boolean;
}

export interface User {
  _id: string;
  name: string | null;
  email: string;
  bio: string | null;
  profilePicture: ProfilePicture | null;
  categoryPreference: CategoryPreference[] | null;
  badges: string[];
  company: UserCompany | null;
  uid: string | null;
  iata: string | null;
  clia: string | null;
  identityStatus: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersPagination {
  itemsPerPage: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
  pagination: UsersPagination;
}

export interface UsersParams {
  search?: string;
  status?: UserStatus | "";
  page?: number;
  limit?: number;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const userKeys = {
  all: ["users"] as const,
  list: (params: UsersParams) => [...userKeys.all, "list", params] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

interface UserByIdResponse {
  success: boolean;
  message: string;
  data: User;
}

const fetchUsers = async (params: UsersParams): Promise<UsersResponse> => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const { data } = await API.get<UsersResponse>(`/users?${query.toString()}`);
  return data;
};

const blockUser = (userId: string) => API.patch(`/users/${userId}/deactivate`);
const unblockUser = (userId: string) => API.patch(`/users/${userId}/activate`);
const fetchUserById = async (userId: string): Promise<User> => {
  const { data } = await API.get<UserByIdResponse>(`/users/${userId}`);
  return data.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useUsers = (params: UsersParams) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    placeholderData: (prev) => prev,
  });

export const useUserById = (userId: string | null) =>
  useQuery({
    queryKey: userKeys.detail(userId ?? ""),
    queryFn: () => fetchUserById(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });

export const useBlockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: blockUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useUnblockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unblockUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
};
