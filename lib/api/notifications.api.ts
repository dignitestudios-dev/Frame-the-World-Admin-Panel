import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Only "all" is supported by the backend for now. */
export type NotificationTarget = "all";

export interface NotificationBroadcast {
  _id: string;
  title: string;
  message: string;
  recipientCount: number;
  createdAt: string;
}

export interface NotificationsPagination {
  itemsPerPage: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: NotificationBroadcast[];
  pagination: NotificationsPagination;
}

export interface NotificationsParams {
  page?: number;
  limit?: number;
}

export interface SendNotificationPayload {
  title: string;
  message: string;
  target?: NotificationTarget;
}

export interface SendNotificationResult {
  contentId: string;
  /** Users the notification was recorded for in-app — not guaranteed push deliveries. */
  recipientCount: number;
}

interface SendNotificationResponse {
  success: boolean;
  message: string;
  data: SendNotificationResult;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationsParams) => [...notificationKeys.all, "list", params] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchNotifications = async (params: NotificationsParams): Promise<NotificationsResponse> => {
  const { data } = await API.get<NotificationsResponse>("/admin/notifications", { params });
  return data;
};

const sendNotification = async (payload: SendNotificationPayload): Promise<SendNotificationResult> => {
  const { data } = await API.post<SendNotificationResponse>("/admin/notifications", {
    target: "all",
    ...payload,
  });
  return data.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useNotifications = (params: NotificationsParams) =>
  useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60,
  });

export const useSendNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};
