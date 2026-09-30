import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfilePicture {
  _id: string;
  key: string;
  location?: string;
  filename?: string;
  mimetype?: string;
}

export interface Reporter {
  _id: string;
  name: string;
  email: string;
  profilePicture: ProfilePicture | null;
}

export interface ReportedEntity {
  _id: string;
  name?: string | null;
  email?: string;
  title?: string;
  cover?: ProfilePicture | null;
  profilePicture?: ProfilePicture | null;
  isDeactivatedByAdmin?: boolean;
}

export interface Report {
  _id: string;
  reporter: Reporter;
  reporterType: string;
  entityId: ReportedEntity | null;
  entityType: string;
  supportingEntityId: any | null; // Can be detailed further if needed
  supportingEntityType: string;
  reason: string;
  description: string;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  adminNotes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsData {
  reports: Report[];
  // If there's pagination info in the future, it would go here
  totalPages?: number;
  totalItems?: number;
  currentPage?: number;
}

export interface ReportsResponse {
  success: boolean;
  message: string;
  data: ReportsData;
}

export interface ReportsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const reportKeys = {
  all: ["reports"] as const,
  list: (params: ReportsParams) => [...reportKeys.all, "list", params] as const,
  detail: (id: string) => [...reportKeys.all, "detail", id] as const,
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchReports = async (params: ReportsParams): Promise<ReportsResponse> => {
  const query = new URLSearchParams();
  
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  const { data } = await API.get<ReportsResponse>(`/admin/reports?${query.toString()}`);
  return data;
};

export interface ReportByIdResponse {
  success: boolean;
  message: string;
  data: {
    report: Report;
  };
}

const fetchReportById = async (reportId: string): Promise<Report> => {
  const { data } = await API.get<ReportByIdResponse>(`/admin/reports/${reportId}`);
  return data.data.report;
};

export interface UpdateReportStatusPayload {
  action: "resolve" | "reject";
}

const updateReportStatus = async ({ reportId, payload }: { reportId: string; payload: UpdateReportStatusPayload }) => {
  const { data } = await API.patch(`/admin/reports/${reportId}/status`, payload);
  return data;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useReports = (params: ReportsParams) =>
  useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => fetchReports(params),
    placeholderData: (prev) => prev,
  });

export const useReportById = (reportId: string | null) =>
  useQuery({
    queryKey: reportKeys.detail(reportId ?? ""),
    queryFn: () => fetchReportById(reportId!),
    enabled: Boolean(reportId),
    staleTime: 1000 * 60 * 2,
  });

export const useUpdateReportStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateReportStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.all }),
  });
};
