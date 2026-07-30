"use client";

import { useState, useEffect } from "react";
import { ReportsHeader } from "./components/reports-header";
import { ReportsTable } from "./components/reports-table";
import { ReportsPaginationBar } from "./components/reports-pagination";
import { ReportDetailDialog } from "./components/report-detail-dialog";
import { useReports } from "@/lib/api/reports.api";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SearchBar({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-9 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (val: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
              isSelected
                ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

type ReportStatusTab = "all" | "pending" | "resolved" | "rejected";

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const [status, setStatus] = useState<ReportStatusTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useReports({
    page,
    limit,
    status: status !== "all" ? status : undefined,
    search: debouncedSearch || undefined,
  });

  const reports = data?.data.reports ?? [];

  return (
    <div className="space-y-6 p-6">
      <ReportsHeader isFetching={isFetching} onRefresh={() => refetch()} />

      <div className="flex flex-wrap items-center gap-2">
        <SearchBar
          id="report-search"
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by reported user name or email"
        />
        <div className="w-px h-4 bg-border mx-1" />
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="size-3.5 text-muted-foreground" />
        </div>
        <FilterChips<ReportStatusTab>
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { value: "all", label: "All Reports" },
            { value: "pending", label: "Pending" },
            { value: "resolved", label: "Resolved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        {(status !== "all" || search !== "") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setStatus("all"); setSearch(""); }}
          >
            <X className="size-3.5" /> Clear
          </Button>
        )}
      </div>

      <ReportsTable
        reports={reports}
        isLoading={isLoading}
        isFetching={isFetching}
        onViewReport={setSelectedReportId}
      />

      <ReportsPaginationBar
        data={data?.data}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <ReportDetailDialog
        reportId={selectedReportId}
        open={!!selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </div>
  );
}
