"use client";

import {
  Building2,
  Calendar,
  FileText,
  Hash,
  Images,
  Mail,
  MapPin,
  ShieldCheck,
  Tag,
  UserX,
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
import { UserAvatar } from "./user-avatar";
import { IdentityStatusBadge } from "./identity-status-badge";
import { StatusToggle } from "./status-toggle";
import RejectionReasonDialog from "./rejection-reason-dialog";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

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
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-sm text-right font-medium">{value}</div>
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

interface UserDetailDialogProps {
  user: User | null;
  open: boolean;
  isLoading?: boolean;
  togglingId: string | null;
  onClose: () => void;
  onToggleBlock: (user: User) => void;
}

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
  const isSetting = (setStatusMutation as any).isPending ?? false;
// console.log(isSetting)
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

  return (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <p className="mt-1 text-xs text-muted-foreground italic line-clamp-2">
                    &ldquo;{user.bio}&rdquo;
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <IdentityStatusBadge status={user.identityStatus ?? null} />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {user.identityStatus === "pending" && (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleApprove} disabled={isSetting || showRejectDialog}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={isSetting || showRejectDialog}>
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
              router.push(`/dashboard/users/${user._id}/content`);
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
            {/* buttons moved to profile header for consistent placement */}
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
                <div className="flex gap-2">
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
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
