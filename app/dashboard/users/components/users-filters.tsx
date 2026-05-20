"use client";

import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserStatus } from "@/lib/api/users.api";

interface UsersFiltersProps {
  search: string;
  status: UserStatus | "";
  isSearchPending: boolean;
  isFetching: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: UserStatus | "") => void;
}

export const UsersFilters = ({
  search,
  status,
  isSearchPending,
  isFetching,
  onSearchChange,
  onStatusChange,
}: UsersFiltersProps) => (
  <div className="flex flex-wrap items-center justify-end gap-2">
    {/* Active filter chips */}
    {(search || status) && (
      <div className="flex flex-wrap items-center gap-2 mr-auto">
        {search && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            &quot;{search}&quot;
            <button onClick={() => onSearchChange("")} className="ml-1 hover:opacity-70">
              <X className="size-3" />
            </button>
          </span>
        )}
        {status && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
            {status}
            <button onClick={() => onStatusChange("")} className="ml-1 hover:opacity-70">
              <X className="size-3" />
            </button>
          </span>
        )}
      </div>
    )}

    {/* Status filter */}
    <Select
      value={status || "all"}
      onValueChange={(v) => onStatusChange(v === "all" ? "" : (v as UserStatus))}
      disabled={isFetching}
    >
      <SelectTrigger className="h-9 w-40">
        <SelectValue placeholder="All Statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="activated">Activated</SelectItem>
        <SelectItem value="deactivated">Deactivated</SelectItem>
      </SelectContent>
    </Select>

    {/* Search */}
    <div className="relative w-56">
      {isSearchPending || (isFetching && search) ? (
        <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name or email…"
        className="h-9 pl-9 pr-8"
      />
      {search && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onSearchChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  </div>
);
