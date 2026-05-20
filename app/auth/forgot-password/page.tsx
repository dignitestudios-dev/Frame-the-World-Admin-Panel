"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { useForgotPasswordMutation, type ApiError } from "@/lib/api/auth.api";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const { mutate: sendOtp, isPending } = useForgotPasswordMutation();

  const onSubmit = ({ email }: FormValues) => {
    setApiError(null);
    sendOtp(
      { email },
      {
        onSuccess: ({ message }) => {
          sessionStorage.setItem("ftw_reset_email", email);
          toast.success(message ?? "OTP sent to your email");
          router.push("/auth/verification");
        },
        onError: (error: AxiosError<ApiError>) => {
          const msg =
            error.response?.data?.message ?? "Failed to send OTP. Please try again.";
          setApiError(msg);
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Forgot Password</h2>
        <p className="text-muted-foreground">
          Enter your email address and we&apos;ll send you an OTP to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthErrorBanner message={apiError} />

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            autoComplete="email"
            {...register("email", { onChange: () => setApiError(null) })}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" variant="gradient" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending OTP…
            </>
          ) : (
            "Send OTP"
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

export default ForgotPasswordPage;

