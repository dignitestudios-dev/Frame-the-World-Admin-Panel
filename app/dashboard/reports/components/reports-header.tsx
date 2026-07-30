import { RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportsHeaderProps {
  isFetching: boolean;
  onRefresh: () => void;
}

export function ReportsHeader({ isFetching, onRefresh }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage user-submitted reports for users, posts, and frames.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-9"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
