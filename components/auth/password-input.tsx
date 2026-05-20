"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}

export const PasswordInput = ({
  id,
  label,
  placeholder = "Enter your password",
  autoComplete = "current-password",
  error,
  registration,
}: PasswordInputProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-10"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
