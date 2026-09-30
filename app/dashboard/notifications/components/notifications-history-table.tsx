"use client";

import { BellOff, Eye, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NotificationBroadcast } from "@/lib/api/notifications.api";
import { dateTimeFormatter, formatRelative } from "./utils";

interface NotificationsHistoryTableProps {
  notifications: NotificationBroadcast[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onView: (notification: NotificationBroadcast) => void;
  onSendAgain: (notification: NotificationBroadcast) => void;
  onCreate: () => void;
}

const COLS = 4;

const SkeletonRows = () =>
  Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={`sk-${i}`}>
      <TableCell>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-3.5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
      <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-32 rounded-full" /></TableCell>
    </TableRow>
  ));

const StateRow = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <TableRow>
    <TableCell colSpan={COLS}>
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <BellOff className="size-5 text-muted-foreground" />
        </div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action}
      </div>
    </TableCell>
  </TableRow>
);

export const NotificationsHistoryTable = ({
  notifications,
  isLoading,
  isError,
  onRetry,
  onView,
  onSendAgain,
  onCreate,
}: NotificationsHistoryTableProps) => (
  <div className="overflow-auto rounded-xl border">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead>Notification</TableHead>
          <TableHead>Recipients</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <SkeletonRows />
        ) : isError ? (
          <StateRow
            title="Couldn't load history"
            description="Something went wrong while fetching sent notifications."
            action={<Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
          />
        ) : notifications.length === 0 ? (
          <StateRow
            title="No Notifications Sent Yet"
            description="Broadcasts you send will appear here."
            action={
              <Button size="sm" className="mt-1 gap-2 bg-brand-gradient text-white" onClick={onCreate}>
                <Plus className="size-4" /> New Notification
              </Button>
            }
          />
        ) : (
          notifications.map((n) => (
            <TableRow key={n._id} className="group transition-colors hover:bg-muted/30">
              <TableCell className="max-w-md whitespace-normal">
                <p className="truncate font-medium leading-tight">{n.title}</p>
                <p className="line-clamp-2 break-words text-xs text-muted-foreground">{n.message}</p>
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {n.recipientCount.toLocaleString()}
              </TableCell>
              <TableCell>
                <p className="text-sm">{formatRelative(n.createdAt)}</p>
                <p className="text-xs text-muted-foreground">
                  {dateTimeFormatter.format(new Date(n.createdAt))}
                </p>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onSendAgain(n)} title="Review and send this notification again">
                    <Repeat className="size-4" />
                    Send Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onView(n)}>
                    <Eye className="size-4" />
                    View
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
