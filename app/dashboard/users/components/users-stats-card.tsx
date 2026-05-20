import { Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";

interface UsersStatsCardProps {
  totalItems: number;
  isLoading: boolean;
}

export const UsersStatsCard = ({ totalItems, isLoading }: UsersStatsCardProps) => (
  <StatCard
    label="Total Users"
    value={totalItems}
    description="All registered accounts"
    icon={Users}
    gradient
    isLoading={isLoading}
    className="w-full max-w-xs"
  />
);
