// ============================================================
// Company OS — Document Types
// ============================================================

export interface DocumentType {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
}

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_index: number;
}

export interface DocumentItemCreate {
  description: string;
  quantity?: number;
  unit_price?: number;
}

export interface Document {
  id: string;
  document_type_id: string;
  document_type_name?: string;
  document_type_code?: string;
  document_number: string;
  client_id: string;
  client_name?: string;
  billing_company_id: string;
  billing_company_name?: string;
  issue_date: string;
  due_date?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  file_reference?: string;
  metadata?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items: DocumentItem[];
}

export interface DocumentCreate {
  document_type_id: string;
  client_id: string;
  billing_company_id: string;
  issue_date: string;
  due_date?: string;
  currency?: string;
  file_reference?: string;
  metadata?: Record<string, unknown>;
  items?: DocumentItemCreate[];
}

export interface DocumentStatusUpdate {
  status: string;
}
