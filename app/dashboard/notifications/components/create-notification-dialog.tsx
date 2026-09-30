"use client";

import { useState } from "react";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Eraser,
  RefreshCw,
  Send,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MESSAGE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TITLE_TRUNCATE_HINT,
  type NotificationFormValues,
} from "./utils";

interface CreateNotificationDialogProps {
  open: boolean;
  /** Step shown when the dialog opens. 2 jumps straight to review (used by "Send Again"). */
  initialStep?: Step;
  form: UseFormReturn<NotificationFormValues>;
  isSending: boolean;
  onClose: () => void;
  onSend: (values: NotificationFormValues) => void;
}

export type Step = 1 | 2;

const notBlank = (label: string) => (v: string) => v.trim() !== "" || `${label} is required`;

const CharCount = ({ value, max }: { value: number; max: number }) => (
  <span
    className={cn(
      "text-[11px] tabular-nums text-muted-foreground",
      value >= max && "text-destructive"
    )}
  >
    {value}/{max}
  </span>
);

const StepIndicator = ({ step }: { step: Step }) => (
  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
    {[
      { n: 1, label: "Compose" },
      { n: 2, label: "Review & Send" },
    ].map(({ n, label }, i) => (
      <div key={n} className="flex items-center gap-2">
        {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
        <div
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
            step === n
              ? "bg-primary text-white"
              : step > n
              ? "bg-emerald-500 text-white"
              : "bg-muted-foreground/20 text-muted-foreground"
          )}
        >
          {step > n ? <CheckCircle2 className="size-3" /> : n}
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            step === n ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
      </div>
    ))}
  </div>
);

export const CreateNotificationDialog = ({
  open,
  initialStep = 1,
  form,
  isSending,
  onClose,
  onSend,
}: CreateNotificationDialogProps) => {
  const [step, setStep] = useState<Step>(1);
  const [wasOpen, setWasOpen] = useState(open);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = form;

  const title = watch("title") ?? "";
  const message = watch("message") ?? "";
  const isDirty = title !== "" || message !== "";

  // Reset to the requested step each time the dialog opens; the draft itself is kept in the form.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStep(initialStep);
  }

  const goToReview = handleSubmit(() => setStep(2));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isSending && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient">
              <BellRing className="size-3.5 text-white" />
            </div>
            New Notification
          </DialogTitle>
          <DialogDescription>
            Broadcast a push notification to the Frame The World app.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator step={step} />

        {step === 1 ? (
          <form onSubmit={goToReview} noValidate className="space-y-5">
            {/* Audience */}
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">All users</p>
                  <p className="text-xs text-muted-foreground">
                    Every active account. Per-user and segment targeting isn&apos;t available yet.
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <CharCount value={title.length} max={TITLE_MAX_LENGTH} />
              </div>
              <Input
                id="notification-title"
                placeholder="e.g. New feature: video posts!"
                maxLength={TITLE_MAX_LENGTH}
                aria-invalid={Boolean(errors.title)}
                autoFocus
                {...register("title", { validate: notBlank("Title") })}
              />
              {errors.title ? (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              ) : (
                title.length > TITLE_TRUNCATE_HINT && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Titles over {TITLE_TRUNCATE_HINT} characters may be cut off on some devices.
                  </p>
                )
              )}
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <CharCount value={message.length} max={MESSAGE_MAX_LENGTH} />
              </div>
              <Textarea
                id="notification-message"
                placeholder="e.g. You can now share short videos alongside photos. Update the app to try it."
                rows={5}
                className="min-h-32 resize-none"
                maxLength={MESSAGE_MAX_LENGTH}
                aria-invalid={Boolean(errors.message)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    goToReview();
                  }
                }}
                {...register("message", { validate: notBlank("Message") })}
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="gap-2"
                onClick={() => reset({ title: "", message: "" })}
                disabled={!isDirty}
              >
                <Eraser className="size-4" />
                Clear
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2 bg-brand-gradient text-white">
                  Review
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</p>
                  <p className="break-words font-medium">{title.trim()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</p>
                  <p className="whitespace-pre-line break-words text-sm">{message.trim()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" /> Audience
                </span>
                <span className="font-medium">All users</span>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                It&apos;s sent to every active user right away and can&apos;t be edited or
                recalled. Check spelling and links first.
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSending}>
                Back
              </Button>
              <Button
                className="gap-2 bg-brand-gradient text-white"
                onClick={() => onSend(getValues())}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="size-4" /> Send to All Users
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
