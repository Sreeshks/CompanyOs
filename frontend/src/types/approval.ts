// ============================================================
// Company OS — Approval Types
// ============================================================

export interface ClientApproval {
  id: string;
  content_id: string;
  client_id: string;
  approval_status: string;
  rejection_reason?: string;
  approved_at?: string;
  approved_by?: string;
  access_token: string;
  token_expires_at: string;
  created_at: string;
}

export interface ApprovalDecisionRequest {
  decision: string;
  rejection_reason?: string;
  approved_by_name?: string;
}

export interface PublicContentReview {
  content_id: string;
  file_name: string;
  display_name: string;
  client_name: string;
  target_month?: string;
  approval_status: string;
  rejection_reason?: string;
  preview_url?: string;
  token_valid: boolean;
}

export interface GenerateApprovalLinkRequest {
  content_id: string;
  expires_days?: number;
}
