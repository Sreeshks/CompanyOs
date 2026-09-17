// ============================================================
// Company OS — Notifications, Dashboard, Approvals, Rejections, Audit, Master Data APIs
// ============================================================

import apiClient from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api';
import type { Notification } from '@/types/notification';
import type { DashboardSummary, StaffWorkload, MonthlyWork, RejectionOverview } from '@/types/dashboard';
import type { ClientApproval, ApprovalDecisionRequest, PublicContentReview, GenerateApprovalLinkRequest } from '@/types/approval';
import type { Rejection, RejectionResolveRequest } from '@/types/rejection';
import type { AuditLog } from '@/types/audit';
import type {
  Department, DepartmentCreate, Designation, DesignationCreate,
  BillingCompany, BillingCompanyCreate, Service, ServiceCreate,
  Package, PackageCreate, TaskType, TaskTypeCreate,
  ContentType, ContentTypeCreate,
} from '@/types/master-data';

// ── Notifications ───────────────────────────────────────────

export const notificationsApi = {
  list: async (unreadOnly = false) => {
    const res = await apiClient.get<ApiResponse<Notification[]>>('/notifications', {
      params: { unread_only: unreadOnly },
    });
    return res.data;
  },

  markRead: async (id: string) => {
    const res = await apiClient.patch<ApiResponse<boolean>>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await apiClient.post<ApiResponse<boolean>>('/notifications/mark-all-read');
    return res.data;
  },
};

// ── Dashboard ───────────────────────────────────────────────

export const dashboardApi = {
  getCompanyOverview: async () => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/company-overview');
    return res.data;
  },

  getTeamOverview: async () => {
    const res = await apiClient.get<ApiResponse<StaffWorkload[]>>('/dashboard/team-overview');
    return res.data;
  },

  getMonthlyWork: async () => {
    const res = await apiClient.get<ApiResponse<MonthlyWork[]>>('/dashboard/monthly-work');
    return res.data;
  },

  getRejectionOverview: async () => {
    const res = await apiClient.get<ApiResponse<RejectionOverview>>('/dashboard/rejection-overview');
    return res.data;
  },
};

// ── Approvals ───────────────────────────────────────────────

export const approvalsApi = {
  generateLink: async (data: GenerateApprovalLinkRequest) => {
    const res = await apiClient.post<ApiResponse<ClientApproval>>('/approvals/generate-link', data);
    return res.data;
  },

  getPublicReview: async (token: string) => {
    const res = await apiClient.get<ApiResponse<PublicContentReview>>(`/approvals/review/${token}`);
    return res.data;
  },

  submitDecision: async (token: string, data: ApprovalDecisionRequest) => {
    const res = await apiClient.post<ApiResponse<ClientApproval>>(`/approvals/review/${token}/decision`, data);
    return res.data;
  },
};

// ── Rejections ──────────────────────────────────────────────

export const rejectionsApi = {
  list: async (params?: { client_id?: string; status?: string }) => {
    const res = await apiClient.get<ApiResponse<Rejection[]>>('/rejections', { params });
    return res.data;
  },

  resolve: async (id: string, data?: RejectionResolveRequest) => {
    const res = await apiClient.post<ApiResponse<Rejection>>(`/rejections/${id}/resolve`, data || {});
    return res.data;
  },
};

// ── Audit Logs ──────────────────────────────────────────────

export interface AuditLogListParams extends PaginationParams {
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  action?: string;
}

export const auditLogsApi = {
  list: async (params?: AuditLogListParams) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>('/audit-logs', { params });
    return res.data;
  },
};

// ── Master Data ─────────────────────────────────────────────

export const masterDataApi = {
  // Departments
  getDepartments: async () => {
    const res = await apiClient.get<ApiResponse<Department[]>>('/departments');
    return res.data;
  },
  createDepartment: async (data: DepartmentCreate) => {
    const res = await apiClient.post<ApiResponse<Department>>('/departments', data);
    return res.data;
  },

  // Designations
  getDesignations: async () => {
    const res = await apiClient.get<ApiResponse<Designation[]>>('/designations');
    return res.data;
  },
  createDesignation: async (data: DesignationCreate) => {
    const res = await apiClient.post<ApiResponse<Designation>>('/designations', data);
    return res.data;
  },

  // Billing Companies
  getBillingCompanies: async () => {
    const res = await apiClient.get<ApiResponse<BillingCompany[]>>('/billing-companies');
    return res.data;
  },
  createBillingCompany: async (data: BillingCompanyCreate) => {
    const res = await apiClient.post<ApiResponse<BillingCompany>>('/billing-companies', data);
    return res.data;
  },

  // Services
  getServices: async () => {
    const res = await apiClient.get<ApiResponse<Service[]>>('/services');
    return res.data;
  },
  createService: async (data: ServiceCreate) => {
    const res = await apiClient.post<ApiResponse<Service>>('/services', data);
    return res.data;
  },

  // Packages
  getPackages: async (serviceId?: string) => {
    const res = await apiClient.get<ApiResponse<Package[]>>('/packages', {
      params: serviceId ? { service_id: serviceId } : undefined,
    });
    return res.data;
  },
  createPackage: async (data: PackageCreate) => {
    const res = await apiClient.post<ApiResponse<Package>>('/packages', data);
    return res.data;
  },

  // Task Types
  getTaskTypes: async () => {
    const res = await apiClient.get<ApiResponse<TaskType[]>>('/task-types');
    return res.data;
  },
  createTaskType: async (data: TaskTypeCreate) => {
    const res = await apiClient.post<ApiResponse<TaskType>>('/task-types', data);
    return res.data;
  },

  // Content Types
  getContentTypes: async () => {
    const res = await apiClient.get<ApiResponse<ContentType[]>>('/content-types');
    return res.data;
  },
  createContentType: async (data: ContentTypeCreate) => {
    const res = await apiClient.post<ApiResponse<ContentType>>('/content-types', data);
    return res.data;
  },
};
