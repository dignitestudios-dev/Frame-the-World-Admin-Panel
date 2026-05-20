import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  _id: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    resetToken: string;
  };
}

export interface UpdatePasswordPayload {
  resetToken: string;
  password: string;
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
}

// ─── API functions ─────────────────────────────────────────────────────────────

export const loginRequest = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await API.post<AuthResponse>("/auth/admin/login", payload);
  return data;
};

export const forgotPasswordRequest = async (
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> => {
  const { data } = await API.post<ForgotPasswordResponse>(
    "/auth/admin/forgot-password",
    payload
  );
  return data;
};

export const verifyOtpRequest = async (
  payload: VerifyOtpPayload
): Promise<VerifyOtpResponse> => {
  const { data } = await API.post<VerifyOtpResponse>("/auth/verify-otp", payload);
  return data;
};

export const updatePasswordRequest = async (
  payload: UpdatePasswordPayload
): Promise<UpdatePasswordResponse> => {
  const { data } = await API.post<UpdatePasswordResponse>(
    "/auth/update-password",
    payload
  );
  return data;
};

export const logoutRequest = async (): Promise<void> => {
  try {
    await API.post("/auth/logout");
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  }
};

export const getProfileRequest = async (): Promise<AuthUser> => {
  const { data } = await API.get<{ data: AuthUser }>("/auth/profile");
  return data.data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useLoginMutation = () =>
  useMutation<AuthResponse, AxiosError<ApiError>, LoginPayload>({
    mutationFn: loginRequest,
  });

export const useForgotPasswordMutation = () =>
  useMutation<ForgotPasswordResponse, AxiosError<ApiError>, ForgotPasswordPayload>({
    mutationFn: forgotPasswordRequest,
  });

export const useVerifyOtpMutation = () =>
  useMutation<VerifyOtpResponse, AxiosError<ApiError>, VerifyOtpPayload>({
    mutationFn: verifyOtpRequest,
  });

export const useUpdatePasswordMutation = () =>
  useMutation<UpdatePasswordResponse, AxiosError<ApiError>, UpdatePasswordPayload>({
    mutationFn: updatePasswordRequest,
  });
