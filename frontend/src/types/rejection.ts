// ============================================================
// Company OS — Rejection Types
// ============================================================

export interface Rejection {
  id: string;
  client_id: string;
  client_name?: string;
  content_id: string;
  content_name?: string;
  content_type?: string;
  reason: string;
  rejected_by?: string;
  rejected_at: string;
  resolved_at?: string;
  resolution_status: string;
  notes?: string;
}

export interface RejectionResolveRequest {
  resolution_notes?: string;
}
