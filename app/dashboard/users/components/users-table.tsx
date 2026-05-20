"use client";

import { Eye, Images, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
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
import type { User, UserStatus } from "@/lib/api/users.api";
import { UserAvatar } from "./user-avatar";
import { IdentityStatusBadge } from "./identity-status-badge";
import { StatusToggle } from "./status-toggle";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  isFetching: boolean;
  activeStatus: UserStatus | "";
  togglingId: string | null;
  onViewUser: (user: User) => void;
  onToggleBlock: (user: User) => void;
}

const COLS = 8;

const SkeletonRows = () =>
  Array.from({ length: 8 }).map((_, i) => (
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
      <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-8 w-36 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-3.5 w-16" /></TableCell>
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
        <p className="font-medium">No users found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filter.</p>
      </div>
    </TableCell>
  </TableRow>
);

export const UsersTable = ({
  users,
  isLoading,
  isFetching,
  togglingId,
  onViewUser,
  onToggleBlock,
}: UsersTableProps) => {
  const router = useRouter();
  return (
  <div className="overflow-auto rounded-xl border">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead>User</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>IATA / CLIA</TableHead>
          <TableHead>Identity</TableHead>
          <TableHead>Account Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading || isFetching ? (
          <SkeletonRows />
        ) : users.length === 0 ? (
          <EmptyState />
        ) : (
          users.map((user) => (
            <TableRow key={user._id} className="group hover:bg-muted/30 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={user.name}
                    email={user.email}
                    photoUrl={user.profilePicture?.location}
                  />
                  <div className="min-w-0">
                    <p className="font-medium leading-tight truncate max-w-[160px]">
                      {user.name ?? "Unnamed User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {user.company?.name ?? <span className="text-muted-foreground">—</span>}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-xs">
                  {user.iata && <span className="font-mono">IATA: {user.iata}</span>}
                  {user.clia && <span className="font-mono">CLIA: {user.clia}</span>}
                  {!user.iata && !user.clia && <span className="text-muted-foreground">—</span>}
                </div>
              </TableCell>
              <TableCell>
                <IdentityStatusBadge status={user.identityStatus ?? null} />
              </TableCell>
              <TableCell>
                <StatusToggle
                  active={user.isActive}
                  loading={togglingId === user._id}
                  onToggle={() => onToggleBlock(user)}
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {dateFormatter.format(new Date(user.createdAt))}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="View Posts & Frames"
                    onClick={() => router.push(`/dashboard/users/${user._id}/content`)}
                  >
                    <Images className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onViewUser(user)}>
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
};
