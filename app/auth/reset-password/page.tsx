"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { PasswordInput } from "@/components/auth/password-input";
import { useUpdatePasswordMutation, type ApiError } from "@/lib/api/auth.api";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

// ─── Password strength indicator ─────────────────────────────────────────────

const rules = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Number", test: (v: string) => /[0-9]/.test(v) },
  { label: "Special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  const passed = rules.filter((r) => r.test(password)).length;
  const colors = ["bg-destructive", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-green-500"];

  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-1">
        {rules.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < passed ? colors[passed] : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {rules.map((rule) => (
          <span
            key={rule.label}
            className={`text-xs ${rule.test(password) ? "text-green-500" : "text-muted-foreground"}`}
          >
            {rule.test(password) ? "✓" : "·"} {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ResetPasswordPage = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("ftw_reset_token");
    if (!token) {
      router.replace("/auth/forgot-password");
    } else {
      setResetToken(token);
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const { mutate: updatePassword, isPending } = useUpdatePasswordMutation();

  const onSubmit = ({ password }: FormValues) => {
    setApiError(null);
    updatePassword(
      { resetToken, password },
      {
        onSuccess: ({ message }) => {
          sessionStorage.removeItem("ftw_reset_email");
          sessionStorage.removeItem("ftw_reset_token");
          toast.success(message ?? "Password reset successfully");
          router.replace("/auth/login");
        },
        onError: (error: AxiosError<ApiError>) => {
          const msg =
            error.response?.data?.message ?? "Failed to reset password. Please try again.";
          setApiError(msg);
          toast.error(msg);
        },
      }
    );
  };

  const passwordValue = watch("password") ?? "";

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
        <p className="text-muted-foreground">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthErrorBanner message={apiError} />

        <div className="space-y-1">
          <PasswordInput
            id="password"
            label="New Password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            error={errors.password?.message}
            registration={register("password", { onChange: () => setApiError(null) })}
          />
          <PasswordStrength password={passwordValue} />
        </div>

        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          disabled={isPending || !resetToken}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting…
            </>
          ) : (
            "Reset Password"
          )}
        </Button>

        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordPage;

