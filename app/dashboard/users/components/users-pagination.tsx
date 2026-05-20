"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UsersPagination } from "@/lib/api/users.api";
import { useState } from "react";

interface UsersPaginationBarProps {
  pagination: UsersPagination | undefined;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const UsersPaginationBar = ({
  pagination,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: UsersPaginationBarProps) => {
  const [gotoInput, setGotoInput] = useState("");
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.currentPage ?? page;
  const totalItems = pagination?.totalItems ?? 0;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);

  const gotoValue = parseInt(gotoInput, 10);
  const isGotoInvalid = gotoInput !== "" && (!gotoValue || gotoValue < 1 || gotoValue > totalPages);

  const handleGotoChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") { setGotoInput(""); return; }
    const num = parseInt(digits, 10);
    // Cap at totalPages while typing
    setGotoInput(String(Math.min(num, totalPages)));
  };

  const handleGoto = () => {
    const parsed = parseInt(gotoInput, 10);
    if (!parsed || parsed < 1) return;
    onPageChange(Math.min(parsed, totalPages));
    setGotoInput("");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
      {/* Left: rows per page + count */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">Rows per page</p>
        <Select
          value={String(limit)}
          onValueChange={(v) => { onLimitChange(Number(v)); onPageChange(1); }}
        >
          <SelectTrigger className="h-9 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {totalItems > 0 && (
          <span className="text-sm text-muted-foreground">
            {start}–{end} of {totalItems.toLocaleString()}
          </span>
        )}
      </div>

      {/* Right: nav + goto */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>

        {/* Go to page */}
        <div className="flex items-center gap-2">
          <Input
            value={gotoInput}
            onChange={(e) => handleGotoChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGoto()}
            placeholder={`1–${totalPages}`}
            className={`h-9 w-20 text-center ${isGotoInvalid ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          <Button variant="outline" size="sm" className="h-9" onClick={handleGoto} disabled={isGotoInvalid || gotoInput === ""}>
            Go
          </Button>
        </div>
      </div>
    </div>
  );
};
