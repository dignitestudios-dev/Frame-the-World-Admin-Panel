import type { UserStatus } from "@/lib/api/users.api";

const STATUS_CONFIG: Record<
  UserStatus,
  { label: string; className: string }
> = {
  activated: {
    label: "Activated",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  deactivated: {
    label: "Deactivated",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

interface UserStatusBadgeProps {
  status: UserStatus;
}

export const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <span className="mr-1.5 size-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
};
