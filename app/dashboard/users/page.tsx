"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  useUsers,
  useUserById,
  useBlockUser,
  useUnblockUser,
  type User,
  type UserStatus,
} from "@/lib/api/users.api";

import { UsersHeader } from "./components/users-header";
import { UsersStatsCard } from "./components/users-stats-card";
import { UsersFilters } from "./components/users-filters";
import { UsersTable } from "./components/users-table";
import { UsersPaginationBar } from "./components/users-pagination";
import { UserDetailDialog } from "./components/user-detail-dialog";

const DEBOUNCE_MS = 500;

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedUserId = searchParams.get("userId");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isSearchPending = searchInput !== debouncedSearch;

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useUsers({
    search: debouncedSearch,
    status,
    page,
    limit,
  });

  // Fetch linked user from URL param and auto-open dialog
  const { data: linkedUser } = useUserById(linkedUserId);
  useEffect(() => {
    if (linkedUser) setSelectedUser(linkedUser);
  }, [linkedUser]);

  const { mutateAsync: blockUser } = useBlockUser();
  const { mutateAsync: unblockUser } = useUnblockUser();

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const handleCloseDialog = () => {
    setSelectedUser(null);
    if (linkedUserId) router.replace("/dashboard/users");
  };

  const handleToggleBlock = async (user: User) => {
    setTogglingId(user._id);
    try {
      if (user.isActive) {
        await blockUser(user._id);
        toast.success(`${user.name ?? user.email} has been deactivated.`);
      } else {
        await unblockUser(user._id);
        toast.success(`${user.name ?? user.email} has been activated.`);
      }
      if (selectedUser?._id === user._id) {
        setSelectedUser((prev) => prev ? { ...prev, isActive: !prev.isActive } : null);
      }
    } catch {
      toast.error("Failed to update account status. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <UsersHeader isFetching={isFetching} onRefresh={() => refetch()} />

      <UsersStatsCard
        totalItems={pagination?.totalItems ?? 0}
        isLoading={isLoading}
      />

      <Card className="border shadow-sm">
        <CardContent className="py-0 px-4">
          <UsersFilters
            search={searchInput}
            status={status}
            isSearchPending={isSearchPending}
            isFetching={isFetching}
            onSearchChange={setSearchInput}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
          />
        </CardContent>
      </Card>

      <UsersTable
        users={users}
        isLoading={isLoading}
        isFetching={isFetching}
        activeStatus={status}
        togglingId={togglingId}
        onViewUser={setSelectedUser}
        onToggleBlock={handleToggleBlock}
      />

      <UsersPaginationBar
        pagination={pagination}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <UserDetailDialog
        user={selectedUser}
        open={Boolean(selectedUser)}
        togglingId={togglingId}
        onClose={handleCloseDialog}
        onToggleBlock={handleToggleBlock}
      />
    </div>
  );
}
