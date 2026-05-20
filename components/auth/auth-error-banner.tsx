import { AlertCircle } from "lucide-react";

interface AuthErrorBannerProps {
  message: string | null;
}

export const AuthErrorBanner = ({ message }: AuthErrorBannerProps) => {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-full bg-destructive/10 border border-destructive/30 px-4 py-2.5 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};
