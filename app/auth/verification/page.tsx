"use client";

import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { OtpInputGroup } from "@/components/auth/otp-input-group";
import { useVerifyOtpMutation, type ApiError } from "@/lib/api/auth.api";

const OTP_LENGTH = 5;

// ─── Resend timer sub-component ───────────────────────────────────────────────

const ResendTimer = ({ onResend, isPending }: { onResend: () => void; isPending: boolean }) => {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds === 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  if (seconds > 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Resend OTP in <span className="font-semibold text-foreground">{seconds}s</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => { onResend(); setSeconds(60); }}
      disabled={isPending}
      className="w-full text-center text-sm text-primary hover:underline disabled:opacity-50"
    >
      Resend OTP
    </button>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const VerificationPage = () => {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [apiError, setApiError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("ftw_reset_email");
    if (!stored) {
      router.replace("/auth/forgot-password");
    } else {
      setEmail(stored);
    }
  }, [router]);

  const { mutate: verifyOtp, isPending } = useVerifyOtpMutation();

  const handleOtpChange = (next: string[]) => {
    setOtp(next);
    setApiError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < OTP_LENGTH) return;

    setApiError(null);
    verifyOtp(
      { email, otp: otpCode },
      {
        onSuccess: ({ data, message }) => {
          sessionStorage.setItem("ftw_reset_token", data.resetToken);
          toast.success(message ?? "OTP verified successfully");
          router.push("/auth/reset-password");
        },
        onError: (error: AxiosError<ApiError>) => {
          const msg =
            error.response?.data?.message ?? "Invalid OTP. Please try again.";
          setApiError(msg);
          setOtp(Array(OTP_LENGTH).fill(""));
          toast.error(msg);
        },
      }
    );
  };

  const handleResend = () => {
    toast.info("Resending OTP…");
    // Re-trigger forgot password from the stored email
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Verify Your Email</h2>
        <p className="text-muted-foreground">
          We&apos;ve sent a {OTP_LENGTH}-digit code to{" "}
          {email ? (
            <span className="font-semibold text-foreground">{email}</span>
          ) : (
            "your email"
          )}
          . Enter it below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthErrorBanner message={apiError} />

        <OtpInputGroup otp={otp} onChange={handleOtpChange} length={OTP_LENGTH} />

        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          disabled={!isComplete || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>

        <ResendTimer onResend={handleResend} isPending={isPending} />

        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default VerificationPage;

