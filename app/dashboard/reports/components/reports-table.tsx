"use client";

import { SearchX, Eye } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/lib/api/reports.api";
import { UserAvatar } from "../../users/components/user-avatar";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface ReportsTableProps {
  reports: Report[];
  isLoading: boolean;
  isFetching: boolean;
  onViewReport: (reportId: string) => void;
}

const COLS = 6;

const SkeletonRows = () =>
  Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={`sk-${i}`}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-16 rounded-full" /></TableCell>
    </TableRow>
  ));

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={COLS}>
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-5 text-muted-foreground" />
        </div>
        <p className="font-medium">No Reports Found</p>
        <p className="text-sm text-muted-foreground">There are currently no reports to review.</p>
      </div>
    </TableCell>
  </TableRow>
);

export const ReportsTable = ({
  reports,
  isLoading,
  isFetching,
  onViewReport,
}: ReportsTableProps) => {
  return (
    <div className="overflow-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Reporter</TableHead>
            <TableHead>Reported Entity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading || isFetching ? (
            <SkeletonRows />
          ) : reports.length === 0 ? (
            <EmptyState />
          ) : (
            reports.map((report) => {
              const reportedEntity = report.entityId || report.supportingEntityId;
              const reportedName = reportedEntity?.name || reportedEntity?.title || "Unknown";
              const reportedEmail = reportedEntity?.email || report.supportingEntityType;
              const reportedAvatar = reportedEntity?.profilePicture?.location || reportedEntity?.cover?.location;

              return (
                <TableRow key={report._id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={report.reporter.name}
                        email={report.reporter.email}
                        photoUrl={report.reporter.profilePicture?.location}
                      />
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate max-w-40">
                          {report.reporter.name ?? "Unnamed"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-40">
                          {report.reporter.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={reportedName}
                        email={reportedEmail}
                        photoUrl={reportedAvatar}
                      />
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate max-w-40">
                          {reportedName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-40">
                          {reportedEmail}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{report.reason}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]" title={report.description}>
                        {report.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === "pending" ? "secondary" : "default"} className="capitalize">
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right">
                    {dateFormatter.format(new Date(report.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onViewReport(report._id)}>
                      <Eye className="size-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
