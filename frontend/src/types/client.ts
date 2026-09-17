// ============================================================
// Company OS — Client Types
// ============================================================

export interface ClientStatus {
  id: string;
  name: string;
  code: string;
  description?: string;
  color: string;
  order_index: number;
  is_terminal: boolean;
  created_at: string;
}

export interface ClientStatusTransition {
  id: string;
  from_status_id: string;
  to_status_id: string;
  from_status_name?: string;
  to_status_name?: string;
  action: string;
  required_permission?: string;
}

export interface Client {
  id: string;
  client_code: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  billing_company_id?: string;
  service_id?: string;
  package_id?: string;
  payment_terms?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  salesperson_id?: string;
  notes?: string;
  status_id: string;
  status_name?: string;
  billing_company_name?: string;
  service_name?: string;
  package_name?: string;
  salesperson_name?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  business_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  billing_company_id?: string;
  service_id?: string;
  package_id?: string;
  payment_terms?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  salesperson_id?: string;
  notes?: string;
  status_id?: string;
}

export interface ClientUpdate {
  business_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  billing_company_id?: string;
  service_id?: string;
  package_id?: string;
  payment_terms?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  salesperson_id?: string;
  notes?: string;
}

export interface ClientStaffAssignment {
  id: string;
  client_id: string;
  task_type_id: string;
  task_type_name?: string;
  user_id: string;
  user_name?: string;
  assigned_at: string;
}

export interface ClientStaffAssignmentCreate {
  task_type_id: string;
  user_id: string;
}

export interface PipelineTransitionRequest {
  action?: string;
  to_status_id?: string;
  notes?: string;
}
