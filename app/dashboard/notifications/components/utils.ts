import { isAxiosError } from "axios";

export const TITLE_MAX_LENGTH = 100;
export const MESSAGE_MAX_LENGTH = 500;
/** Beyond this, most devices truncate the title on the lock screen. */
export const TITLE_TRUNCATE_HINT = 50;

export interface NotificationFormValues {
  title: string;
  message: string;
}

export const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export const formatRelative = (iso: string) => {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
};

export const getSendErrorMessage = (error: unknown): string => {
  const response = isAxiosError<{ message?: string }>(error) ? error.response : undefined;
  const status = response?.status;
  const backendMsg = response?.data?.message;
  if (status === 403) return "Your account doesn't have permission to send notifications.";
  if (status === 422) return backendMsg || "Title and message are required.";
  return backendMsg || "Failed to send notification. Please try again.";
};
