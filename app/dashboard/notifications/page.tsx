"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BellRing, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useSendNotification,
  type NotificationBroadcast,
} from "@/lib/api/notifications.api";
import { UsersPaginationBar } from "../users/components/users-pagination";
import { CreateNotificationDialog, type Step } from "./components/create-notification-dialog";
import { NotificationsHistoryTable } from "./components/notifications-history-table";
import { NotificationDetailDialog } from "./components/notification-detail-dialog";
import { getSendErrorMessage, type NotificationFormValues } from "./components/utils";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<Step>(1);
  const [selected, setSelected] = useState<NotificationBroadcast | null>(null);

  const form = useForm<NotificationFormValues>({
    defaultValues: { title: "", message: "" },
  });

  const { data, isLoading, isFetching, isError, refetch } = useNotifications({ page, limit });
  const { mutateAsync: sendNotification, isPending: isSending } = useSendNotification();

  const notifications = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSend = async (values: NotificationFormValues) => {
    try {
      const result = await sendNotification({
        title: values.title.trim(),
        message: values.message.trim(),
        target: "all",
      });
      toast.success(
        `Notification sent to ${result.recipientCount.toLocaleString()} user${result.recipientCount === 1 ? "" : "s"}`
      );
      form.reset({ title: "", message: "" });
      setCreateOpen(false);
      setPage(1);
    } catch (error) {
      // Keep the dialog open on the review step so the admin can retry or go back and edit.
      toast.error(getSendErrorMessage(error));
    }
  };

  const openCreate = (step: Step, n?: NotificationBroadcast) => {
    if (n) form.reset({ title: n.title, message: n.message });
    setSelected(null);
    setCreateStep(step);
    setCreateOpen(true);
  };

  const handleReuse = (n: NotificationBroadcast) => openCreate(1, n);
  const handleSendAgain = (n: NotificationBroadcast) => openCreate(2, n);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
            <BellRing className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Push Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Send notifications to all app users and see what&apos;s been sent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="gap-2 bg-brand-gradient text-white" onClick={() => openCreate(1)}>
            <Plus className="size-4" />
            New Notification
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">History</h2>
          <p className="text-sm text-muted-foreground">One row per broadcast, newest first</p>
        </div>

        <NotificationsHistoryTable
          notifications={notifications}
          isLoading={isLoading || (isFetching && !data)}
          isError={isError && !data}
          onRetry={() => refetch()}
          onView={setSelected}
          onSendAgain={handleSendAgain}
          onCreate={() => openCreate(1)}
        />

        {(pagination?.totalItems ?? 0) > 0 && (
          <UsersPaginationBar
            pagination={pagination}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
      </div>

      <CreateNotificationDialog
        open={createOpen}
        initialStep={createStep}
        form={form}
        isSending={isSending}
        onClose={() => setCreateOpen(false)}
        onSend={handleSend}
      />

      <NotificationDetailDialog
        notification={selected}
        onClose={() => setSelected(null)}
        onReuse={handleReuse}
        onSendAgain={handleSendAgain}
      />
    </div>
  );
}
