"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  initial?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string | null) => void;
}

export const DeactivationReasonDialog = ({ open, initial = "", submitting = false, onClose, onConfirm }: Props) => {
  const [reason, setReason] = useState(initial ?? "");

  useEffect(() => {
    if (open) setReason(initial ?? "");
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Deactivation reason</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-3">Provide a brief reason for deactivating this account. This will be recorded for audit purposes.</p>
          <Textarea
            placeholder="Enter reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button size="sm" onClick={() => onConfirm(reason.trim() === "" ? null : reason)} disabled={submitting}>
            {submitting ? "Deactivating…" : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeactivationReasonDialog;
