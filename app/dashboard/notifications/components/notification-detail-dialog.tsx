"use client";

import { Calendar, Copy, Hash, Info, Repeat, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NotificationBroadcast } from "@/lib/api/notifications.api";
import { dateTimeFormatter } from "./utils";

interface NotificationDetailDialogProps {
  notification: NotificationBroadcast | null;
  onClose: () => void;
  onReuse: (notification: NotificationBroadcast) => void;
  onSendAgain: (notification: NotificationBroadcast) => void;
}

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-right text-sm font-medium">{value}</div>
  </div>
);

export const NotificationDetailDialog = ({ notification, onClose, onReuse, onSendAgain }: NotificationDetailDialogProps) => (
  <Dialog open={Boolean(notification)} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Notification Details</DialogTitle>
      </DialogHeader>

      {notification && (
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
            <p className="font-semibold break-words">{notification.title}</p>
            <p className="whitespace-pre-line break-words text-sm text-muted-foreground">
              {notification.message}
            </p>
          </div>

          <div>
            <InfoRow
              icon={<Users className="size-4" />}
              label="Recipients"
              value={notification.recipientCount.toLocaleString()}
            />
            <InfoRow
              icon={<Calendar className="size-4" />}
              label="Sent"
              value={dateTimeFormatter.format(new Date(notification.createdAt))}
            />
            <InfoRow
              icon={<Hash className="size-4" />}
              label="ID"
              value={<span className="font-mono text-xs">{notification._id}</span>}
            />
          </div>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Recipients is the number of users who got it in their in-app notifications. Users with
            no registered device or with push turned off are counted but don&apos;t get a push.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
        {notification && (
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => onReuse(notification)}>
              <Copy className="size-4" />
              Edit as Draft
            </Button>
            <Button size="sm" className="gap-2 bg-brand-gradient text-white" onClick={() => onSendAgain(notification)}>
              <Repeat className="size-4" />
              Send Again
            </Button>
          </>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
