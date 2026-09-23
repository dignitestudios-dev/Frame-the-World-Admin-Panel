import { useQuery } from "@tanstack/react-query";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "cancelled"
  | "expired"
  | "past_due"
  | "unpaid"
  | "incomplete"
  | "inactive"
  | string;

export type SubscriptionProvider = "stripe" | "apple" | "google" | "manual" | "in-app" | string;

export interface SubscriptionPlan {
  _id?: string;
  id?: string;
  key?: string;
  label?: string;
  name?: string;
  displayPrice?: number;
  price?: number;
  currency?: string;
  durationDays?: number;
  duration?: string;
  interval?: string;
  details?: string[];
  isActive?: boolean;
}

export interface SubscriptionDetails {
  _id?: string;
  id?: string;
  platform?: string | null;
  provider?: string | null;
  planKey?: string | null;
  planName?: string | null;
  plan?: string | SubscriptionPlan | null;
  planId?: string | SubscriptionPlan | null;
  status: SubscriptionStatus;
  currentPeriodStart?: string | number | Date | null;
  currentPeriodEnd?: string | number | Date | null;
  startDate?: string | number | Date | null;
  endDate?: string | number | Date | null;
  trialStart?: string | number | Date | null;
  trialEnd?: string | number | Date | null;
  cancelAtPeriodEnd?: boolean;
  autoRenewStatus?: boolean;
  isAutoRenew?: boolean;
  autoRenew?: boolean;
  amount?: number;
  displayPrice?: number;
  currency?: string;
  originalTransactionId?: string;
  transactionId?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  productId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSubscriptionData {
  isSubscribed: boolean;
  isOnTrial: boolean;
  isTrialConsumed: boolean;
  subscription: SubscriptionDetails | null;
}

export interface SubscriptionApiResponse {
  success: boolean;
  message?: string;
  data: UserSubscriptionData | SubscriptionDetails | null;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  byUser: (userId: string) => [...subscriptionKeys.all, "user", userId] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

export const fetchUserSubscription = async (userId: string): Promise<UserSubscriptionData | null> => {
  try {
    const { data } = await API.get<SubscriptionApiResponse>(`/subscriptions/subscription/${userId}`);
    if (!data || !data.data) return null;

    // Standard shape: { isSubscribed, isOnTrial, isTrialConsumed, subscription }
    if (typeof data.data === "object" && "isSubscribed" in data.data) {
      return data.data as UserSubscriptionData;
    }

    // Direct subscription object fallback
    if (typeof data.data === "object") {
      const sub = data.data as SubscriptionDetails;
      return {
        isSubscribed: sub.status === "active" || sub.status === "trialing",
        isOnTrial: sub.status === "trialing",
        isTrialConsumed: Boolean(sub.trialEnd),
        subscription: sub,
      };
    }

    return null;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useUserSubscription = (userId: string | null | undefined, enabled = true) =>
  useQuery({
    queryKey: subscriptionKeys.byUser(userId ?? ""),
    queryFn: () => fetchUserSubscription(userId!),
    enabled: Boolean(userId) && enabled,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
