"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Hash,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Tag,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { StatusToggle } from "@/app/dashboard/users/components/status-toggle";
import {
  usePlans,
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCodeStatus,
  type Plan,
  type PromoCode,
  type CreatePromoCodePayload,
  type DiscountType,
  type DurationType,
} from "@/lib/api/promo-codes.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROMO_CODE_MAX_LENGTH = 20;

const fmtUnix = (ts: number) =>
  format(new Date(ts * 1000), "MMM d, yyyy");

const fmtExpiry = (ts: number | null) =>
  ts ? fmtUnix(ts) : "No expiry";

const planKeyLabel = (key?: string): string => {
  if (!key) return "—";
  const lower = key.toLowerCase();
  if (lower === "monthly") return "Monthly";
  if (lower === "yearly") return "Yearly";
  // capitalise first letter for any other key
  return key.charAt(0).toUpperCase() + key.slice(1);
};

// ─── Plan selector card ───────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-150",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
      )}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary">
          <CheckCircle2 className="size-3 text-white" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-brand-gradient" : "bg-muted"
        )}>
          <Tag className={cn("size-4", selected ? "text-white" : "text-muted-foreground")} />
        </div>
        <div>
          <p className="font-semibold">{plan.label}</p>
          <p className="text-xs text-muted-foreground">{plan.durationDays} days</p>
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold">${plan.displayPrice}</span>
        <span className="text-sm text-muted-foreground">/{plan.key}</span>
      </div>
      <div className="mt-2 space-y-1">
        {plan.details.slice(0, 2).map((d, i) => (
          <p key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" />
            {d}
          </p>
        ))}
      </div>
    </button>
  );
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface PromoFormValues {
  code: string;
  discountType: DiscountType;
  percentOff: string;
  amountOff: string;
  duration: DurationType;
  durationInMonths: string;
  maxRedemptions: string;
  expiresAt: string;
}

// ─── Create promo dialog ──────────────────────────────────────────────────────

function CreatePromoDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { mutate: createPromo, isPending } = useCreatePromoCode();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<PromoFormValues>({
    defaultValues: {
      code: "",
      discountType: "percent",
      percentOff: "",
      amountOff: "",
      duration: "once",
      durationInMonths: "",
      maxRedemptions: "",
      expiresAt: "",
    },
  });

  const discountType = watch("discountType");

  const handleClose = () => {
    reset();
    setStep(1);
    setSelectedPlan(null);
    onClose();
  };

  const onSubmit = (values: PromoFormValues) => {
    if (!selectedPlan) return;

    const payload: CreatePromoCodePayload = {
      planId: selectedPlan._id,
      code: values.code.toUpperCase().trim(),
      duration: values.duration,
    };

    if (values.discountType === "percent") {
      payload.percentOff = Number(values.percentOff);
    } else {
      payload.amountOff = Math.round(Number(values.amountOff) * 100); // dollars → cents
      payload.currency = selectedPlan.currency.toLowerCase();
    }

    if (values.maxRedemptions) {
      payload.maxRedemptions = Number(values.maxRedemptions);
    }

    if (values.expiresAt) {
      payload.expiresAt = new Date(values.expiresAt).toISOString();
    }

    createPromo(payload, {
      onSuccess: () => {
        toast.success(`Promo code "${payload.code}" created successfully`);
        handleClose();
      },
      onError: (error: unknown) => {
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
        };
        const rawMsg = axiosError?.response?.data?.message ?? "";
        const status = axiosError?.response?.status;

        // Friendly duplicate error
        if (
          status === 422 ||
          rawMsg.toLowerCase().includes("already exists") ||
          rawMsg.toLowerCase().includes("duplicate") ||
          rawMsg.toLowerCase().includes("unprocessable")
        ) {
          // Try to determine if it's a duplicate-code error or a length error
          if (
            rawMsg.toLowerCase().includes("already exists") ||
            rawMsg.toLowerCase().includes("duplicate")
          ) {
            toast.error("Promo code already exists. Please use a unique code.");
          } else {
            toast.error(
              `Promo code cannot exceed ${PROMO_CODE_MAX_LENGTH} characters. Please shorten the code and try again.`
            );
          }
        } else {
          toast.error(rawMsg || "Failed to create promo code. Please try again.");
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient">
              <BadgePercent className="size-3.5 text-white" />
            </div>
            Create Promo Code
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
          {[
            { n: 1, label: "Select Plan" },
            { n: 2, label: "Configure Code" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                  step === n
                    ? "bg-primary text-white"
                    : step > n
                    ? "bg-emerald-500 text-white"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {step > n ? <CheckCircle2 className="size-3" /> : n}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  step === n ? "text-foreground" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Step 1 — Plan selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the subscription plan this promo code will apply to.
            </p>
            {plansLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="rounded-2xl border p-5 space-y-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {plans
                  .filter((p) => p.isActive)
                  .map((plan) => (
                    <PlanCard
                      key={plan._id}
                      plan={plan}
                      selected={selectedPlan?._id === plan._id}
                      onSelect={() => setSelectedPlan(plan)}
                    />
                  ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                disabled={!selectedPlan}
                onClick={() => setStep(2)}
                className="gap-2"
              >
                Continue <ChevronRight className="size-3.5" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2 — Configure promo code */}
        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Selected plan summary */}
            <div className="flex items-center gap-3 rounded-xl border bg-primary/5 px-4 py-3">
              <Tag className="size-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Applying to</p>
                <p className="font-semibold text-sm">
                  {selectedPlan?.label} — ${selectedPlan?.displayPrice}/{selectedPlan?.key}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setStep(1)}
              >
                Change
              </Button>
            </div>

            {/* Promo code */}
            <div className="space-y-1.5">
              <Label>
                Promo Code <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. SUMMER50"
                className="uppercase"
                maxLength={PROMO_CODE_MAX_LENGTH}
                {...register("code", {
                  required: "Code is required",
                  maxLength: {
                    value: PROMO_CODE_MAX_LENGTH,
                    message: `Promo code cannot exceed ${PROMO_CODE_MAX_LENGTH} characters.`,
                  },
                  pattern: {
                    value: /^[A-Za-z0-9_-]+$/,
                    message: "Alphanumeric, hyphens, underscores only",
                  },
                })}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                Max {PROMO_CODE_MAX_LENGTH} characters
              </p>
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Discount type */}
            <div className="space-y-2">
              <Label>Discount Type <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <>
                      <button
                        type="button"
                        onClick={() => field.onChange("percent")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-colors",
                          field.value === "percent"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        <BadgePercent className="size-4" /> Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("amount")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-colors",
                          field.value === "amount"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        <Zap className="size-4" /> Fixed Amount
                      </button>
                    </>
                  )}
                />
              </div>
              {discountType === "percent" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Percent Off (1–100) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      placeholder="e.g. 25"
                      className="pr-8"
                      {...register("percentOff", {
                        required: "Required",
                        min: { value: 1, message: "Min 1" },
                        max: { value: 100, message: "Max 100" },
                      })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  {errors.percentOff && (
                    <p className="text-xs text-destructive">{errors.percentOff.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Amount Off (in {selectedPlan?.currency.toUpperCase()}){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder="e.g. 10.00"
                      className="pl-7"
                      {...register("amountOff", {
                        required: "Required",
                        min: { value: 0.01, message: "Must be > 0" },
                        validate: (value) => {
                          if (!selectedPlan) return true;
                          const amount = Number(value);
                          return (
                            amount <= selectedPlan.displayPrice ||
                            `Discount amount cannot exceed the subscription price of $${selectedPlan.displayPrice.toFixed(2)}.`
                          );
                        },
                      })}
                    />
                  </div>
                  {errors.amountOff && (
                    <p className="text-xs text-destructive">{errors.amountOff.message}</p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Users className="size-3" /> Max Redemptions
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 100"
                  {...register("maxRedemptions", {
                    min: { value: 1, message: "Min 1" },
                    validate: (value) => {
                      if (!value) return true;
                      if (!Number.isInteger(Number(value))) {
                        return "Max Redemption must be a whole number.";
                      }
                      return true;
                    },
                  })}
                />
                {errors.maxRedemptions && (
                  <p className="text-xs text-destructive">
                    {errors.maxRedemptions.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <CalendarDays className="size-3" /> Expires At
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  type="date"
                  {...register("expiresAt", {
                    validate: (v) => {
                      if (!v) return true;
                      const selected = new Date(v);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return selected > today || "Past dates are not allowed.";
                    },
                  })}
                />
                {errors.expiresAt && (
                  <p className="text-xs text-destructive">{errors.expiresAt.message}</p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isPending}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-brand-gradient text-white gap-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" /> Create Code
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Promo code row ───────────────────────────────────────────────────────────

function PromoRow({
  promo,
  onView,
}: {
  promo: PromoCode;
  onView: (promo: PromoCode) => void;
}) {
  const isExpired = promo.expiresAt ? promo.expiresAt * 1000 < Date.now() : false;
  const statusActive = promo.active && !isExpired;
  const pct = promo.maxRedemptions
    ? Math.round((promo.timesRedeemed / promo.maxRedemptions) * 100)
    : null;

  const { mutate: toggleStatus, isPending: isToggling } = useUpdatePromoCodeStatus();

  const handleToggle = () => {
    toggleStatus(
      { promoCodeId: promo.id, active: !promo.active },
      {
        onSuccess: () => {
          toast.success(
            promo.active
              ? `Promo "${promo.code}" deactivated`
              : `Promo "${promo.code}" activated`
          );
        },
        onError: (error: unknown) => {
          const msg =
            (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
          toast.error(msg || "Failed to update status");
        },
      }
    );
  };

  const hasFirstTimeOnly = promo.restrictions?.first_time_transaction;
  const hasMinAmount =
    promo.restrictions?.minimum_amount != null &&
    promo.restrictions.minimum_amount > 0;

  return (
    <div className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md sm:grid-cols-[auto_1fr_auto_auto_auto_auto_auto]">
      {/* Status dot */}
      <div
        className={cn(
          "size-2.5 rounded-full shrink-0",
          statusActive
            ? "bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.4)]"
            : "bg-muted-foreground/30"
        )}
      />

      {/* Code + meta */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-widest">
            {promo.code}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "h-5 px-2 text-[10px] font-semibold",
              statusActive
                ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
                : "border-border bg-muted text-muted-foreground"
            )}
          >
            {statusActive ? "Active" : isExpired ? "Expired" : "Inactive"}
          </Badge>
          {/* Subscription type badge */}
          {promo.planKey && (
            <Badge
              variant="outline"
              className="h-5 px-2 text-[10px] font-semibold border-violet-200 bg-violet-500/10 text-violet-600"
            >
              {planKeyLabel(promo.planKey)}
            </Badge>
          )}
          {hasFirstTimeOnly && (
            <Badge
              variant="outline"
              className="h-5 px-2 text-[10px] font-semibold border-amber-200 bg-amber-500/10 text-amber-600"
            >
              <ShieldAlert className="size-2.5 mr-1" /> First-time only
            </Badge>
          )}
          {hasMinAmount && (
            <Badge
              variant="outline"
              className="h-5 px-2 text-[10px] font-semibold border-blue-200 bg-blue-500/10 text-blue-600"
            >
              Min ${((promo.restrictions.minimum_amount ?? 0) / 100).toFixed(2)}{" "}
              {promo.restrictions.minimum_amount_currency?.toUpperCase()}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            Created {fmtUnix(promo.created)}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            Expires {fmtExpiry(promo.expiresAt)}
          </span>
        </div>
      </div>

      {/* Subscription type — hidden on mobile */}
      <div className="hidden sm:block text-center min-w-16">
        <p className="text-[10px] text-muted-foreground mb-0.5">Plan</p>
        <p className="text-xs font-medium">{planKeyLabel(promo.planKey)}</p>
      </div>

      {/* Redemptions */}
      <div className="hidden sm:block text-center min-w-20">
        <p className="text-[10px] text-muted-foreground mb-0.5">Redeemed</p>
        <p className="text-sm font-semibold">
          {promo.timesRedeemed}
          {promo.maxRedemptions ? (
            <span className="text-muted-foreground font-normal">
              /{promo.maxRedemptions}
            </span>
          ) : (
            <span className="text-muted-foreground font-normal"> / ∞</span>
          )}
        </p>
        {pct !== null && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                pct >= 90
                  ? "bg-red-500"
                  : pct >= 60
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Status icon */}
      <div className="hidden sm:block shrink-0">
        {statusActive ? (
          <CheckCircle2 className="size-5 text-emerald-500" />
        ) : (
          <XCircle className="size-5 text-muted-foreground/50" />
        )}
      </div>

      {/* View + toggle */}
      <div className="shrink-0 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex gap-1.5"
          onClick={() => onView(promo)}
        >
          <Eye className="size-3.5" /> View
        </Button>
        <StatusToggle
          active={promo.active}
          loading={isToggling}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}

// ─── Promo Details Dialog ─────────────────────────────────────────────────────

function PromoDetailsDialog({
  open,
  promo,
  onClose,
}: {
  open: boolean;
  promo: PromoCode | null;
  onClose: () => void;
}) {
  if (!promo) return null;

  const isExpired = promo.expiresAt ? promo.expiresAt * 1000 < Date.now() : false;
  const statusActive = promo.active && !isExpired;

  const isPercent =
    promo.discountType === "percent" || promo.discountType === "percentOff";
  const isAmount =
    promo.discountType === "amount" || promo.discountType === "amountOff";

  const discountLabel = isPercent
    ? `${promo.discountValue ?? promo.percentOff ?? 0}%`
    : isAmount
    ? `$${((promo.discountValue ?? promo.amountOff ?? 0) / 100).toFixed(2)}`
    : "—";

  const discountTypeLabel = isPercent
    ? "Percentage"
    : isAmount
    ? "Fixed Amount"
    : "—";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient">
              <BadgePercent className="size-3.5 text-white" />
            </div>
            Promo Code Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status header */}
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 text-xs font-semibold",
                  statusActive
                    ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 inline-block size-1.5 rounded-full",
                    statusActive ? "bg-emerald-500" : "bg-muted-foreground/50"
                  )}
                />
                {statusActive ? "Active" : isExpired ? "Expired" : "Inactive"}
              </Badge>
              {promo.planKey && (
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs font-semibold border-violet-200 bg-violet-500/10 text-violet-600"
                >
                  {planKeyLabel(promo.planKey)} Plan
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                Created {fmtUnix(promo.created)}
              </span>
            </div>

            {/* Core details grid */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Promo Code</p>
                <p className="font-mono font-bold tracking-widest">{promo.code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Subscription Type</p>
                <p className="font-semibold">{planKeyLabel(promo.planKey)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Discount Type</p>
                <p className="font-semibold">{discountTypeLabel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Discount Value</p>
                <p className="font-semibold text-primary">{discountLabel}</p>
              </div>
            </div>
          </div>

          {/* Validity + redemptions */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="size-3" /> Validity
              </p>
              <p className="text-xs text-muted-foreground">
                Start: {fmtUnix(promo.created)}
              </p>
              <p className="font-semibold text-sm">
                Expires: {fmtExpiry(promo.expiresAt)}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3" /> Redemptions
              </p>
              <p className="font-semibold text-sm">
                {promo.timesRedeemed}
                {promo.maxRedemptions
                  ? ` / ${promo.maxRedemptions}`
                  : " / ∞ (unlimited)"}
              </p>
              {promo.maxRedemptions && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      Math.round(
                        (promo.timesRedeemed / promo.maxRedemptions) * 100
                      ) >= 90
                        ? "bg-red-500"
                        : Math.round(
                            (promo.timesRedeemed / promo.maxRedemptions) * 100
                          ) >= 60
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{
                      width: `${Math.min(
                        Math.round(
                          (promo.timesRedeemed / promo.maxRedemptions) * 100
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Restrictions */}
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <ShieldAlert className="size-3" /> Restrictions
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {promo.restrictions.first_time_transaction ? (
                  <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                ) : (
                  <XCircle className="size-4 text-muted-foreground/40 shrink-0" />
                )}
                <span>
                  {promo.restrictions.first_time_transaction
                    ? "First-time transaction only"
                    : "Applies to all customers"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {promo.restrictions.minimum_amount != null &&
                promo.restrictions.minimum_amount > 0 ? (
                  <>
                    <CheckCircle2 className="size-4 text-blue-500 shrink-0" />
                    <span>
                      Minimum spend $
                      {((promo.restrictions.minimum_amount ?? 0) / 100).toFixed(2)}{" "}
                      {promo.restrictions.minimum_amount_currency?.toUpperCase()}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-muted-foreground/40 shrink-0" />
                    <span>No minimum spend</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PromoCodesPaginationBarProps {
  pagination: {
    itemsPerPage: number;
    currentPage: number;
    totalItems: number;
    totalPages: number;
  } | undefined;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isFetching?: boolean;
}

function PromoCodesPaginationBar({
  pagination,
  page,
  limit,
  onPageChange,
  onLimitChange,
  isFetching = false,
}: PromoCodesPaginationBarProps) {
  const [gotoInput, setGotoInput] = useState("");
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.currentPage ?? page;
  const totalItems = pagination?.totalItems ?? 0;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);

  const gotoValue = parseInt(gotoInput, 10);
  const isGotoInvalid =
    gotoInput !== "" && (!gotoValue || gotoValue < 1 || gotoValue > totalPages);

  const handleGotoChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setGotoInput("");
      return;
    }
    const num = parseInt(digits, 10);
    setGotoInput(String(Math.min(num, totalPages)));
  };

  const handleGoto = () => {
    const parsed = parseInt(gotoInput, 10);
    if (!parsed || parsed < 1) return;
    onPageChange(Math.min(parsed, totalPages));
    setGotoInput("");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
      {/* Left: rows per page + count */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">Rows per page</p>
        <Select
          value={String(limit)}
          onValueChange={(v) => {
            onLimitChange(Number(v));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="h-9 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {totalItems > 0 && (
          <span className="text-sm text-muted-foreground">
            {start}–{end} of {totalItems.toLocaleString()}
          </span>
        )}
      </div>

      {/* Right: nav + goto */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-9 hover:text-white"
          disabled={currentPage <= 1 || isFetching}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 hover:text-white"
          disabled={currentPage >= totalPages || isFetching}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>

        {/* Go to page */}
        <div className="flex items-center gap-2">
          <Input
            value={gotoInput}
            onChange={(e) => handleGotoChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGoto()}
            placeholder={`1–${totalPages}`}
            className={`h-9 w-20 text-center ${
              isGotoInvalid
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 hover:text-white"
            onClick={handleGoto}
            disabled={isGotoInvalid || gotoInput === "" || isFetching}
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton list ────────────────────────────────────────────────────────────

const ListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
        <Skeleton className="size-2.5 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="hidden h-8 w-16 rounded-lg sm:block" />
        <Skeleton className="hidden h-8 w-20 rounded-lg sm:block" />
        <Skeleton className="size-5 rounded-full" />
      </div>
    ))}
  </div>
);

// ─── Filter / Search bar ──────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "inactive";
type PlanFilter = "all" | "monthly" | "yearly";

function FilterBar({
  search,
  onSearch,
  status,
  onStatus,
  plan,
  onPlan,
  onClear,
  hasFilters,
}: {
  search: string;
  onSearch: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  plan: PlanFilter;
  onPlan: (v: PlanFilter) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const planOptions: { value: PlanFilter; label: string }[] = [
    { value: "all", label: "All Plans" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          id="promo-search"
          placeholder="Search by code…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex items-center rounded-xl border bg-card overflow-hidden h-9">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatus(opt.value)}
            className={cn(
              "px-3 h-full text-xs font-medium transition-colors border-r last:border-r-0",
              status === opt.value
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Plan filter */}
      <div className="flex items-center rounded-xl border bg-card overflow-hidden h-9">
        {planOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPlan(opt.value)}
            className={cn(
              "px-3 h-full text-xs font-medium transition-colors border-r last:border-r-0",
              plan === opt.value
                ? "bg-violet-600 text-white"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-white"
          onClick={onClear}
        >
          <X className="size-3.5" /> Clear filters
        </Button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromoCodesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  const { data, isLoading, isFetching, refetch } = usePromoCodes(
    page,
    limit,
    statusFilter === "all" ? undefined : statusFilter,
    planFilter === "all" ? undefined : planFilter
  );
  const promoCodes = data?.promoCodes ?? [];
  const pagination = data?.pagination;

  // Stats local state to avoid skeletons during page transitions
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number } | null>(null);

  useEffect(() => {
    if (data) {
      setStats({
        total: data.pagination?.totalItems ?? data.promoCodes.length,
        active: data.promoCodes.filter((p) => p.active).length,
        inactive: data.promoCodes.filter((p) => !p.active).length,
      });
    }
  }, [data]);

  // Derived filtered list
  const filteredCodes = useMemo(() => {
    return promoCodes.filter((p) => {
      // Search
      if (search && !p.code.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Status
      if (statusFilter !== "all") {
        const isExpired = p.expiresAt ? p.expiresAt * 1000 < Date.now() : false;
        const isActive = p.active && !isExpired;
        if (statusFilter === "active" && !isActive) return false;
        if (statusFilter === "inactive" && (isActive || isExpired)) return false;
      }
      // Plan
      if (planFilter !== "all") {
        if ((p.planKey ?? "").toLowerCase() !== planFilter) return false;
      }
      return true;
    });
  }, [promoCodes, search, statusFilter, planFilter]);

  const hasFilters =
    search !== "" || statusFilter !== "all" || planFilter !== "all";

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: StatusFilter) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handlePlanFilterChange = (val: PlanFilter) => {
    setPlanFilter(val);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient">
            <BadgePercent className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Promo Codes</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage Stripe promotion codes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-brand-gradient text-white"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" /> New Promo Code
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {!stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Codes"
              value={stats.total}
              icon={Hash}
              gradient
            />
            <StatCard
              label="Active"
              value={stats.active}
              icon={CheckCircle2}
              iconBg="bg-emerald-500/10"
              iconColor="text-emerald-600"
              description={pagination ? "Active codes on this page" : "Currently active promo codes"}
            />
            <StatCard
              label="Inactive"
              value={stats.inactive}
              icon={XCircle}
              iconBg="bg-muted/60"
              iconColor="text-muted-foreground"
              description={pagination ? "Inactive codes on this page" : "Expired or deactivated codes"}
            />
          </>
        )}
      </div>

      {/* Search + Filters */}
      {!isLoading && promoCodes.length > 0 && (
        <FilterBar
          search={search}
          onSearch={handleSearchChange}
          status={statusFilter}
          onStatus={handleStatusFilterChange}
          plan={planFilter}
          onPlan={handlePlanFilterChange}
          onClear={clearFilters}
          hasFilters={hasFilters}
        />
      )}

      {/* List */}
      <div
        className={cn(
          "space-y-3 transition-opacity",
          isFetching && !isLoading && "opacity-60"
        )}
      >
        {isLoading || isFetching ? (
          <ListSkeleton />
        ) : promoCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <BadgePercent className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No Promo Codes Yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first promo code to start offering discounts.
            </p>
            <Button
              size="sm"
              className="mt-2 gap-2 bg-brand-gradient text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" /> Create First Code
            </Button>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <p className="font-medium">No matching promo codes</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
            <Button variant="outline" size="sm" className="mt-1" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCodes.map((p) => (
              <PromoRow key={p.id} promo={p} onView={setSelectedPromo} />
            ))}
            {hasFilters && (
              <p className="text-center text-xs text-muted-foreground pt-1">
                Showing {filteredCodes.length} of {promoCodes.length} promo codes
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <PromoCodesPaginationBar
          pagination={pagination}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isFetching={isFetching}
        />
      )}

      {/* Create dialog */}
      <CreatePromoDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* View details dialog */}
      <PromoDetailsDialog
        open={!!selectedPromo}
        promo={selectedPromo}
        onClose={() => setSelectedPromo(null)}
      />
    </div>
  );
}
