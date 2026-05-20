"use client";

import { useRef } from "react";

interface OtpInputGroupProps {
  otp: string[];
  onChange: (otp: string[]) => void;
  length?: number;
}

export const OtpInputGroup = ({ otp, onChange, length = 5 }: OtpInputGroupProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/\D/g, "");

    // Handle mobile paste via onChange (fires full string instead of onPaste)
    if (value.length > 1) {
      const next = [...otp];
      value.slice(0, length - index).split("").forEach((char, i) => {
        next[index + i] = char;
      });
      onChange(next);
      const lastFilled = Math.min(index + value.length, length - 1);
      inputRefs.current[lastFilled]?.focus();
      return;
    }

    const next = [...otp];
    next[index] = value;
    onChange(next);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...otp];
      if (otp[index]) {
        next[index] = "";
        onChange(next);
      } else if (index > 0) {
        next[index - 1] = "";
        onChange(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length - startIndex);
    if (!pasted) return;

    const next = [...otp];
    pasted.split("").forEach((char, i) => {
      next[startIndex + i] = char;
    });
    onChange(next);

    const lastFilled = Math.min(startIndex + pasted.length, length - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] ?? ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          className="w-12 h-12 text-center text-xl font-bold border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
