import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanProviderId {
  provider: "apple" | "google" | "stripe";
  productId: string;
  priceId: string | null;
}

export interface Plan {
  _id: string;
  key: string;
  label: string;
  displayPrice: number;
  currency: string;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  details: string[];
  providerIds: PlanProviderId[];
  createdAt: string;
  updatedAt: string;
}

interface PlansResponse {
  success: boolean;
  message: string;
  data: { plans: Plan[] };
}

export interface PromoRestrictions {
  first_time_transaction: boolean;
  minimum_amount: number | null;
  minimum_amount_currency: string | null;
}

export interface PromoCode {
  id: string;
  code: string;
  active: boolean;
  created: number; // unix timestamp
  expiresAt: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  restrictions: PromoRestrictions;
  coupon: { coupon: string; type: string };
  customer: string | null;
}

interface PromoCodesResponse {
  success: boolean;
  message: string;
  // some backends return the array directly in `data`, others namespace it under groups like `monthly` and `yearly`
  data: PromoCode[] | Record<string, PromoCode[] | undefined>;
  pagination?: {
    itemsPerPage: number;
    currentPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export type DiscountType = "percent" | "amount";
export type DurationType = "once" | "forever" | "repeating";

export interface CreatePromoCodePayload {
  planId: string;
  code: string;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: DurationType;
  durationInMonths?: number;
  maxRedemptions?: number;
  expiresAt?: string;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const promoKeys = {
  plans: ["promo", "plans"] as const,
  list: ["promo", "codes"] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchPlans = async (): Promise<Plan[]> => {
  const { data } = await API.get<PlansResponse>("/subscriptions/plans");
  return data.data.plans;
};

const fetchPromoCodes = async (): Promise<PromoCode[]> => {
  const { data } = await API.get<PromoCodesResponse>(
    "/subscriptions/stripe/promo-code"
  );

  // Support multiple response shapes:
  // - { data: PromoCode[] }
  // - { data: { monthly: PromoCode[], yearly: PromoCode[], ... }, pagination: {...} }
  if (Array.isArray(data.data)) return data.data as PromoCode[];

  // If data.data is an object with groups (monthly, yearly, ...), merge all arrays
  if (data.data && typeof data.data === "object") {
    const groups = Object.values(data.data) as Array<PromoCode[] | undefined>;
    const combined: PromoCode[] = [];
    for (const g of groups) {
      if (Array.isArray(g)) combined.push(...g);
    }

    // Deduplicate by id while preserving first-seen order
    const seen = new Map<string, PromoCode>();
    for (const p of combined) {
      if (!seen.has(p.id)) seen.set(p.id, p);
    }
    return Array.from(seen.values());
  }

  // Fallback: return empty list
  return [];
};

const createPromoCode = async (
  payload: CreatePromoCodePayload
): Promise<PromoCode> => {
  const { data } = await API.post<{ success: boolean; data: PromoCode }>(
    "/subscriptions/stripe/promo-code",
    payload
  );
  return data.data;
};

const updatePromoCodeStatus = async (
  promoCodeId: string,
  active: boolean
): Promise<PromoCode> => {
  const { data } = await API.patch<{ success: boolean; data: PromoCode }>(
    `/subscriptions/stripe/promo-code/${promoCodeId}/status`,
    { active }
  );
  return data.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const usePlans = () =>
  useQuery({
    queryKey: promoKeys.plans,
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 10,
  });

export const usePromoCodes = () =>
  useQuery({
    queryKey: promoKeys.list,
    queryFn: fetchPromoCodes,
    staleTime: 1000 * 60 * 2,
  });

export const useCreatePromoCode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromoCodePayload) => createPromoCode(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promoKeys.list });
    },
  });
};

export const useUpdatePromoCodeStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ promoCodeId, active }: { promoCodeId: string; active: boolean }) =>
      updatePromoCodeStatus(promoCodeId, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promoKeys.list });
    },
  });
};
