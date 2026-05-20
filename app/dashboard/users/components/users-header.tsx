"use client";

import { RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsersHeaderProps {
  isFetching: boolean;
  onRefresh: () => void;
}

export const UsersHeader = ({ isFetching, onRefresh }: UsersHeaderProps) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
        <Users className="size-5" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all registered user accounts
        </p>
      </div>
    </div>

    <Button variant="outline" onClick={onRefresh} disabled={isFetching}>
      <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
      Refresh
    </Button>
  </div>
);
