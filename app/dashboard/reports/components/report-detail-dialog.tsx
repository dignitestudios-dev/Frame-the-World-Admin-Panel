"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useReportById, useUpdateReportStatus } from "@/lib/api/reports.api";
import { UserAvatar } from "../../users/components/user-avatar";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
});

interface ReportDetailDialogProps {
  reportId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ReportDetailDialog({ reportId, open, onClose }: ReportDetailDialogProps) {
  const { data: report, isLoading, isError } = useReportById(reportId);
  const { mutateAsync: updateStatus, isPending } = useUpdateReportStatus();

  useEffect(() => {
    if (isError && open) {
      toast.error("Failed to load report details.");
      onClose();
    }
  }, [isError, open, onClose]);

  const handleAction = async (action: "resolve" | "reject") => {
    if (!reportId) return;
    try {
      await updateStatus({ reportId, payload: { action } });
      toast.success(`Report ${action}d successfully`);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} report`);
    }
  };

  const reportedEntity = report?.entityId || report?.supportingEntityId;
  const reportedName = reportedEntity?.name || reportedEntity?.title || "Unknown";
  const reportedEmail = reportedEntity?.email || report?.supportingEntityType;
  const reportedAvatar = reportedEntity?.profilePicture?.location || reportedEntity?.cover?.location;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
          <DialogDescription>Review the details of the submitted report.</DialogDescription>
        </DialogHeader>

        {isLoading || !report ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <Badge variant={report.status === "pending" ? "secondary" : "default"} className="capitalize">
                  {report.status}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                Reported on {dateFormatter.format(new Date(report.createdAt))}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reporter Info */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Reported By</h4>
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    name={report.reporter.name} 
                    email={report.reporter.email} 
                    photoUrl={report.reporter.profilePicture?.location} 
                    size="lg" 
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{report.reporter.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{report.reporter.email}</p>
                    <Badge variant="outline" className="mt-1">{report.reporterType}</Badge>
                  </div>
                </div>
              </div>

              {/* Reported Entity Info */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Reported Entity</h4>
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    name={reportedName} 
                    email={reportedEmail} 
                    photoUrl={reportedAvatar} 
                    size="lg" 
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{reportedName}</p>
                    <p className="text-sm text-muted-foreground truncate">{reportedEmail}</p>
                    <Badge variant="outline" className="mt-1">{report.entityType}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-semibold">Reason</h4>
              <p className="font-medium text-sm">{report.reason}</p>
              
              <h4 className="text-sm font-semibold mt-4">Description</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {report.description || "No additional description provided."}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Close
          </Button>
          {report?.status === "pending" && (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => handleAction("reject")} disabled={isPending}>
                Reject Report
              </Button>
              <Button variant="default" onClick={() => handleAction("resolve")} disabled={isPending}>
                Resolve Report
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
