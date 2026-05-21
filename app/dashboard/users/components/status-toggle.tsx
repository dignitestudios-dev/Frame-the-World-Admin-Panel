"use client";

import { Loader2 } from "lucide-react";

interface StatusToggleProps {
  active: boolean;
  loading?: boolean;
  onToggle: () => void;
}

export const StatusToggle = ({ active, loading, onToggle }: StatusToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={loading}
    className={`inline-flex min-w-36 items-center justify-between rounded-full border px-3 py-1 text-sm font-medium transition-all ${
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-100 text-slate-500"
    } ${loading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-90"}`}
  >
    <span className="text-xs font-semibold">
      {loading ? "Updating…" : active ? "Activated" : "Deactivated"}
    </span>
    <span
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        active ? "bg-linear-to-r from-emerald-600 to-emerald-400" : "bg-slate-300"
      }`}
    >
      {loading ? (
        <Loader2 className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
      ) : (
        <span
          className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-6" : "translate-x-1"
          }`}
        />
      )}
    </span>
  </button>
);
