"use client";

import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Hash,
  Images,
  Layers,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  UserX,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/lib/api/users.api";
import { useSetUserStatus } from "@/lib/api/users.api";
import { useUserSubscription, type SubscriptionDetails } from "@/lib/api/subscriptions.api";
import { UserAvatar } from "./user-avatar";
import { IdentityStatusBadge } from "./identity-status-badge";
import { StatusToggle } from "./status-toggle";
import RejectionReasonDialog from "./rejection-reason-dialog";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatSubscriptionDate = (dateVal?: string | number | Date | null) => {
  if (!dateVal) return null;
  try {
    let d: Date;
    if (typeof dateVal === "number") {
      d = new Date(dateVal < 10000000000 ? dateVal * 1000 : dateVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return null;
    return shortDateFormatter.format(d);
  } catch {
    return null;
  }
};

const formatDateRange = (
  startVal?: string | number | Date | null,
  endVal?: string | number | Date | null
): string | null => {
  if (!startVal && !endVal) return null;
  const start = startVal
    ? new Date(typeof startVal === "number" && startVal < 10000000000 ? startVal * 1000 : startVal)
    : null;
  const end = endVal
    ? new Date(typeof endVal === "number" && endVal < 10000000000 ? endVal * 1000 : endVal)
    : null;

  if (start && isNaN(start.getTime())) return null;
  if (end && isNaN(end.getTime())) return null;

  if (start && end) {
    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      const monthStr = start.toLocaleDateString("en-US", { month: "short" });
      return `${monthStr} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    }
    if (start.getFullYear() === end.getFullYear()) {
      const startMonth = start.toLocaleDateString("en-US", { month: "short" });
      const endMonth = end.toLocaleDateString("en-US", { month: "short" });
      return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${shortDateFormatter.format(start)} – ${shortDateFormatter.format(end)}`;
  }

  if (start) return shortDateFormatter.format(start);
  if (end) return `Ends ${shortDateFormatter.format(end)}`;
  return null;
};

const SUBSCRIPTION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  trialing: { label: "Trialing", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  canceled: { label: "Canceled", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" },
  cancelled: { label: "Canceled", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
  past_due: { label: "Past Due", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  unpaid: { label: "Unpaid", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" },
  incomplete: { label: "Incomplete", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground border-border" },
};

const SubscriptionStatusBadge = ({ status }: { status?: string | null }) => {
  const normalized = status?.toLowerCase() || "inactive";
  const config = SUBSCRIPTION_STATUS_CONFIG[normalized] || {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "None",
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
};

const getProviderLabel = (provider?: string | null) => {
  if (!provider) return "—";
  const p = provider.toLowerCase();
  if (p === "stripe") return "Stripe";
  if (p === "apple") return "Apple App Store";
  if (p === "google") return "Google Play";
  if (p === "manual") return "Manual / Admin";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
};

const planKeyLabel = (key?: string | null): string => {
  if (!key) return "—";
  const lower = key.toLowerCase();
  if (lower === "monthly") return "Monthly Plan";
  if (lower === "yearly") return "Yearly Plan";
  return key.charAt(0).toUpperCase() + key.slice(1) + " Plan";
};

const getPlanName = (subscription: SubscriptionDetails, isOnTrial?: boolean): string => {
  if (subscription.planKey) {
    return planKeyLabel(subscription.planKey);
  }
  if (typeof subscription.plan === "object" && subscription.plan?.label) {
    return subscription.plan.label;
  }
  if (typeof subscription.plan === "object" && subscription.plan?.name) {
    return subscription.plan.name;
  }
  if (subscription.planName) return subscription.planName;
  if (isOnTrial || subscription.status === "trialing") {
    return "Free Trial Plan";
  }
  if (typeof subscription.plan === "string" && subscription.plan) {
    return subscription.plan;
  }
  return "Subscription Plan";
};

const getPlanPrice = (subscription: SubscriptionDetails): string | null => {
  let amount = subscription.amount ?? subscription.displayPrice;
  let currency = subscription.currency || "USD";
  if (amount === undefined && typeof subscription.plan === "object" && subscription.plan?.displayPrice !== undefined) {
    amount = subscription.plan.displayPrice;
    currency = subscription.plan.currency || currency;
  }
  if (amount !== undefined) {
    const formattedAmount =
      amount > 999 && Number.isInteger(amount)
        ? (amount / 100).toFixed(2)
        : typeof amount === "number"
        ? amount.toFixed(2)
        : amount;
    return `$${formattedAmount} ${currency.toUpperCase()}`;
  }
  return null;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
    {children}
  </div>
);

const InfoRow = ({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
      {icon}
      <span>{label}</span>
    </div>
    <div
      className={`text-sm text-right font-medium max-w-[65%] min-w-0 ${valueClassName ?? "break-words"}`}
      title={typeof value === "string" ? value : undefined}
    >
      {value}
    </div>
  </div>
);

const DialogSkeletonContent = () => (
  <div className="space-y-5">
    <div className="flex items-center gap-4">
      <Skeleton className="size-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex justify-between py-2 border-b">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </div>
);

const REVIEW_STATUSES = [
  "pending",
  "needs_review",
  "verification_required",
  "review",
  "pending_verification",
  "awaiting_review",
] as const;

interface UserDetailDialogProps {
  user: User | null;
  open: boolean;
  isLoading?: boolean;
  togglingId: string | null;
  onClose: () => void;
  onToggleBlock: (user: User) => void;
}

const needsReview = (status?: string | null) => {
  if (!status) return true; // treat null/undefined as needing review
  return REVIEW_STATUSES.includes(status.toLowerCase() as typeof REVIEW_STATUSES[number]);
};

export const UserDetailDialog = ({
  user,
  open,
  isLoading,
  togglingId,
  onClose,
  onToggleBlock,
}: UserDetailDialogProps) => {
  const router = useRouter();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const setStatusMutation = useSetUserStatus();
  const setStatus = setStatusMutation.mutateAsync;
  const isSetting = setStatusMutation.status === "pending";

  const { data: subscriptionData, isLoading: isSubLoading } = useUserSubscription(
    user?._id,
    open && Boolean(user?._id)
  );

  const handleApprove = async () => {
    if (!user) return;
    try {
      await setStatus({ userId: user._id, status: "approved" });
      toast.success("Identity approved.");
      onClose();
    } catch {
      toast.error("Failed to update identity status. Please try again.");
    }
  };

  const handleConfirmReject = async (reason: string | null) => {
    if (!user) return;
    try {
      await setStatus({ userId: user._id, status: "rejected", rejectionReason: reason });
      toast.success("Identity rejected.");
      setShowRejectDialog(false);
      onClose();
    } catch {
      toast.error("Failed to update identity status. Please try again.");
    }
  };

  const sub = subscriptionData?.subscription;
  const isOnTrial = subscriptionData?.isOnTrial || sub?.status === "trialing";
  const periodStart = formatSubscriptionDate(
    sub?.currentPeriodStart ?? sub?.startDate
  );
  const periodEnd = formatSubscriptionDate(
    sub?.currentPeriodEnd ?? sub?.endDate
  );
  const trialRange = formatDateRange(sub?.trialStart, sub?.trialEnd);

  const autoRenewActive =
    sub?.autoRenewStatus !== undefined
      ? sub.autoRenewStatus
      : sub?.cancelAtPeriodEnd !== undefined
      ? !sub.cancelAtPeriodEnd
      : undefined;

  return (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-lg p-4 max-h-[90vh] overflow-y-auto overflow-x-hidden">
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
      </DialogHeader>

      {isLoading ? (
        <DialogSkeletonContent />
      ) : !user ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <UserX className="size-5 text-muted-foreground" />
          </div>
          <p className="font-medium">User not available</p>
        </div> 
      ) : (
        <div className="space-y-5">
          {/* ── Profile header ── */}
          <div className="flex items-start justify-between gap-4 rounded-xl bg-muted/40 p-4">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <UserAvatar
                name={user.name}
                email={user.email}
                photoUrl={user.profilePicture?.location}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base truncate">
                  {user.name ?? "Unnamed User"}
                </p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {user.bio && (
                  <div className="relative min-w-0 max-w-[350px]">
                    <p className="mt-1 text-xs text-muted-foreground italic break-words whitespace-normal">
                      &ldquo;{user.bio}&rdquo;
                    </p>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <IdentityStatusBadge status={user.identityStatus ?? null} />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {needsReview(user.identityStatus) && (
                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" size="sm" onClick={handleApprove} disabled={isSetting || showRejectDialog}>
                    Approve
                  </Button>
                  <Button className="cursor-pointer" size="sm" variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={isSetting || showRejectDialog}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── View Posts & Frames button ── */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              onClose();
              setTimeout(() => {
                router.push(`/dashboard/users/${user._id}/content`);
              }, 150);
            }}
          >
            <Images className="size-4" />
            View Posts &amp; Frames
          </Button>

          {/* ── Account status ── */}
          <Section title="Account Status">
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">Account Access</p>
                <p className="text-xs text-muted-foreground">Toggle to block or restore access</p>
              </div>
              <StatusToggle
                active={
                  typeof user.isDeactivatedByAdmin === "boolean"
                    ? !user.isDeactivatedByAdmin
                    : user.isActive
                }
                loading={togglingId === user._id}
                onToggle={() => onToggleBlock(user)}
              />
            </div>

            {user.isDeactivatedByAdmin && user.deactivationReason && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 mt-2">
                <UserX className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-destructive mb-0.5">Deactivation Reason</p>
                  <p className="text-sm text-destructive/80 break-words">{user.deactivationReason}</p>
                </div>
              </div>
            )}

            {user.identityStatus === "rejected" && user.rejectionReason && (
              <div className="flex items-start gap-2.5 rounded-lg border border-orange-400/20 bg-orange-400/5 px-4 py-3 mt-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orange-500 mb-0.5">Rejection Reason</p>
                  <p className="text-sm text-orange-500/80 break-words">{user.rejectionReason}</p>
                </div>
              </div>
            )}
          </Section>

          <Separator />

          {/* ── Subscription Details ── */}
          <Section title="Subscription">
            {isSubLoading ? (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
            ) : sub ? (
              <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
                {/* Header banner */}
                <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {isOnTrial ? (
                        <Sparkles className="size-3.5 text-blue-500" />
                      ) : (
                        <CreditCard className="size-3.5" />
                      )}
                    </div>
                    <span className="font-semibold text-sm truncate">
                      {getPlanName(sub, isOnTrial)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isOnTrial && (
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                        <Sparkles className="mr-1 size-2.5" /> On Trial
                      </span>
                    )}
                    <SubscriptionStatusBadge status={sub.status} />
                  </div>
                </div>

                {/* Subscription info rows */}
                <div className="p-3 space-y-1 text-sm">
                  {sub.planKey && (
                    <InfoRow
                      icon={<Tag className="size-3.5" />}
                      label="Plan Type"
                      value={planKeyLabel(sub.planKey)}
                    />
                  )}
                  {getPlanPrice(sub) && (
                    <InfoRow
                      icon={<Tag className="size-3.5" />}
                      label="Price"
                      value={getPlanPrice(sub)}
                    />
                  )}
                  {(sub.platform || sub.provider) && (
                    <InfoRow
                      icon={<Layers className="size-3.5" />}
                      label="Platform"
                      value={getProviderLabel(sub.platform || sub.provider)}
                    />
                  )}
                  {trialRange && (
                    <InfoRow
                      icon={<Sparkles className="size-3.5" />}
                      label="Trial Period"
                      value={<span className="whitespace-nowrap font-medium">{trialRange}</span>}
                      valueClassName="whitespace-nowrap"
                    />
                  )}
                  {!isOnTrial && periodStart && (
                    <InfoRow
                      icon={<Calendar className="size-3.5" />}
                      label="Current Period Start"
                      value={<span className="whitespace-nowrap">{periodStart}</span>}
                      valueClassName="whitespace-nowrap"
                    />
                  )}
                  {!isOnTrial && periodEnd && (
                    <InfoRow
                      icon={<Clock className="size-3.5" />}
                      label={sub.cancelAtPeriodEnd ? "Expires On" : "Renews On"}
                      value={
                        <span className={`whitespace-nowrap ${sub.cancelAtPeriodEnd ? "text-amber-600 font-semibold" : ""}`}>
                          {periodEnd}
                        </span>
                      }
                      valueClassName="whitespace-nowrap"
                    />
                  )}
                  {autoRenewActive !== undefined && (
                    <InfoRow
                      icon={<RefreshCw className="size-3.5" />}
                      label="Auto Renew"
                      value={
                        autoRenewActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium whitespace-nowrap">
                            <CheckCircle2 className="size-3" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium whitespace-nowrap">
                            <AlertCircle className="size-3" /> Disabled
                          </span>
                        )
                      }
                      valueClassName="whitespace-nowrap"
                    />
                  )}
                  {subscriptionData?.isTrialConsumed !== undefined && (
                    <InfoRow
                      icon={<Sparkles className="size-3.5" />}
                      label="Trial Consumed"
                      value={
                        subscriptionData.isTrialConsumed ? (
                          <span className="text-xs font-medium text-amber-600 whitespace-nowrap">Yes (Consumed)</span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600 whitespace-nowrap">No (Available)</span>
                        )
                      }
                      valueClassName="whitespace-nowrap"
                    />
                  )}
                  {(sub.stripeSubscriptionId || sub.originalTransactionId || sub.transactionId) && (
                    <InfoRow
                      icon={<Hash className="size-3.5" />}
                      label="Transaction ID"
                      value={
                        <span className="font-mono text-xs">
                          {sub.stripeSubscriptionId || sub.originalTransactionId || sub.transactionId}
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-3.5 text-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <CreditCard className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Free Plan</p>
                      <p className="text-xs text-muted-foreground">No active subscription</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Not Subscribed
                  </span>
                </div>
                {subscriptionData?.isTrialConsumed !== undefined && (
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <span className="text-muted-foreground">Free Trial Eligibility</span>
                    <span className="font-medium">
                      {subscriptionData.isTrialConsumed ? (
                        <span className="text-amber-600">Trial Consumed (Used)</span>
                      ) : (
                        <span className="text-emerald-600">Eligible (Not Used)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Separator />

          {/* ── Contact & credentials ── */}
          <Section title="Details">
            <InfoRow
              icon={<Mail className="size-3.5" />}
              label="Email"
              value={user.email}
            />
            <InfoRow
              icon={<Calendar className="size-3.5" />}
              label="Joined"
              value={dateFormatter.format(new Date(user.createdAt))}
            />
            <InfoRow
              icon={<Hash className="size-3.5" />}
              label="IATA"
              value={
                user.iata ? (
                  <span className="font-mono text-xs">{user.iata}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
            <InfoRow
              icon={<Hash className="size-3.5" />}
              label="CLIA"
              value={
                user.clia ? (
                  <span className="font-mono text-xs">{user.clia}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
            {user?.badges?.length > 0 && (
              <InfoRow
                icon={<ShieldCheck className="size-3.5" />}
                label="Badges"
                value={<span className="font-semibold">{user.badges.length}</span>}
              />
            )}
          </Section>

          {/* ── Company ── */}
          {user.company && (
            <>
              <Separator />
              <Section title="Company">
                <InfoRow
                  icon={<Building2 className="size-3.5" />}
                  label="Name"
                  value={user.company.name}
                />
                <InfoRow
                  icon={<MapPin className="size-3.5" />}
                  label="Location"
                  value={
                    [
                      user.company.address.city,
                      user.company.address.state,
                      user.company.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
              </Section>
            </>
          )}

          {/* ── Category preferences ── */}
          {user.categoryPreference && user.categoryPreference.length > 0 && (
            <>
              <Separator />
              <Section title={`Category Preferences (${user.categoryPreference.length})`}>
                <div className="flex flex-wrap gap-2">
                  {user.categoryPreference.map((cat) => (
                    <span
                      key={cat._id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      <Tag className="size-3 shrink-0 opacity-70" />
                      {cat.name}
                    </span>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── Bio full ── */}
          {user.bio && (
            <>
              <Separator />
              <Section title="Bio">
                <div className="flex relative gap-2 min-w-0">
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground break-words break-all whitespace-normal flex-1 min-w-0">{user.bio}</p>
                </div>
              </Section>
            </>
          )}
          <RejectionReasonDialog
            open={showRejectDialog}
            submitting={isSetting}
            onClose={() => setShowRejectDialog(false)}
            onConfirm={handleConfirmReject}
          />
        </div>
      )}
      </DialogContent>
  </Dialog>
  );
};


