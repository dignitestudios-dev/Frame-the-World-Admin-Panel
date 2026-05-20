"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useBadges,
  useUpdateBadge,
  type Badge as BadgeType,
  type UpdateBadgePayload,
} from "@/lib/api/badges.api";

const PAGE_LIMIT = 20;

// ─── Skeleton grid ────────────────────────────────────────────────────────────

const GridSkeleton = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="mt-2 h-8 w-full rounded-full" />
      </div>
    ))}
  </div>
);

// ─── Edit dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  badge: BadgeType | null;
  open: boolean;
  onClose: () => void;
}

function EditBadgeDialog({ badge, open, onClose }: EditDialogProps) {
  const { mutate: updateBadge, isPending } = useUpdateBadge();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateBadgePayload>({
    values: badge ? { name: badge.name, description: badge.description } : undefined,
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: UpdateBadgePayload) => {
    if (!badge) return;
    updateBadge(
      { id: badge._id, payload: data },
      {
        onSuccess: () => {
          toast.success("Badge updated successfully");
          handleClose();
        },
        onError: () => {
          toast.error("Failed to update badge. Please try again.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient">
              <Pencil className="size-3.5 text-white" />
            </div>
            Edit Badge
          </DialogTitle>
        </DialogHeader>

        {badge && (
          <div className="flex items-center gap-4 rounded-xl bg-muted/40 p-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
              <Image
                src={badge.icon.location}
                alt={badge.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{badge.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="badge-name">Badge Name</Label>
            <Input
              id="badge-name"
              placeholder="e.g. Rising Star"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="badge-description">Description</Label>
            <Textarea
              id="badge-description"
              placeholder="Describe what earns this badge…"
              rows={3}
              className="resize-none"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className="bg-brand-gradient text-white gap-2"
            >
              {isPending ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Badge card ───────────────────────────────────────────────────────────────

function BadgeCard({ badge, onEdit }: { badge: BadgeType; onEdit: (b: BadgeType) => void }) {
  return (
    <div className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Subtle gradient top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-brand-gradient opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Active badge */}
      <div className="absolute right-3 top-3">
        <Badge
          className={cn(
            "px-2 py-0.5 text-[10px] font-semibold",
            badge.isActive
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-200"
              : "bg-muted text-muted-foreground"
          )}
          variant="outline"
        >
          {badge.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Icon */}
      <div className="relative size-20 overflow-hidden rounded-full border-4 border-primary/10 bg-muted shadow-inner">
        <Image
          src={badge.icon.location}
          alt={badge.name}
          fill
          className="object-cover p-1"
          sizes="80px"
        />
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="font-semibold leading-tight">{badge.name}</p>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-center text-xs text-muted-foreground leading-relaxed">
        {badge.description}
      </p>

      {/* Edit button */}
      <Button
        variant="outline"
        size="sm"
        className="mt-1 w-full gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        onClick={() => onEdit(badge)}
      >
        <Pencil className="size-3.5" />
        Edit Badge
      </Button>
    </div>
  );
}

// ─── Pager ────────────────────────────────────────────────────────────────────

function Pager({
  page,
  totalPages,
  isFetching,
  onPage,
}: {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={page === 1 || isFetching}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="size-3.5" /> Prev
      </Button>
      <span className="text-sm font-medium tabular-nums">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={page === totalPages || isFetching}
        onClick={() => onPage(page + 1)}
      >
        Next <ChevronRight className="size-3.5" />
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BadgesManagementPage() {
  const [page, setPage] = useState(1);
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null);

  const { data, isLoading, isFetching, refetch } = useBadges(page, PAGE_LIMIT);

  const badges = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient">
            <Award className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Badge Management</h1>
            <p className="text-sm text-muted-foreground">
              View and update badge names and descriptions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pagination && (
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{pagination.totalItems}</span> badges
            </span>
          )}
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
        </div>
      </div>

      {/* Grid */}
      <div className={cn("transition-opacity duration-150", isFetching && !isLoading && "opacity-60")}>
        {isLoading ? (
          <GridSkeleton />
        ) : badges.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Sparkles className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No badges found</p>
            <p className="text-sm text-muted-foreground">Badges will appear here once created.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {badges.map((badge) => (
              <BadgeCard key={badge._id} badge={badge} onEdit={setEditingBadge} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <Pager
          page={page}
          totalPages={pagination.totalPages}
          isFetching={isFetching}
          onPage={setPage}
        />
      )}

      {/* Edit dialog */}
      <EditBadgeDialog
        badge={editingBadge}
        open={!!editingBadge}
        onClose={() => setEditingBadge(null)}
      />
    </div>
  );
}
