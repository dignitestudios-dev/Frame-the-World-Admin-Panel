const IDENTITY_CONFIG: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
};

const DEFAULT_CONFIG = { label: "Unknown", className: "bg-muted text-muted-foreground border-border" };

export const IdentityStatusBadge = ({ status }: { status: string | null }) => {
  const config = (status ? IDENTITY_CONFIG[status.toLowerCase()] : null) ?? DEFAULT_CONFIG;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${config.className}`}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
};
