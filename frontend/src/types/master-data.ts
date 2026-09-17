// ============================================================
// Company OS — Master Data Types
// ============================================================

export interface Department {
  id: string;
  name: string;
  code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentCreate {
  name: string;
  code: string;
  active?: boolean;
}

export interface DepartmentUpdate {
  name?: string;
  active?: boolean;
}

export interface Designation {
  id: string;
  name: string;
  code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignationCreate {
  name: string;
  code: string;
  active?: boolean;
}

export interface DesignationUpdate {
  name?: string;
  active?: boolean;
}

export interface BillingCompany {
  id: string;
  name: string;
  short_code: string;
  vat_applicable: boolean;
  tax_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BillingCompanyCreate {
  name: string;
  short_code: string;
  vat_applicable?: boolean;
  tax_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface BillingCompanyUpdate {
  name?: string;
  vat_applicable?: boolean;
  tax_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface TaskType {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskTypeCreate {
  name: string;
  code: string;
  description?: string;
  active?: boolean;
}

export interface TaskTypeUpdate {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface PackageTask {
  id: string;
  task_type_id: string;
  task_type_name?: string;
  sequence: number;
  is_required: boolean;
}

export interface PackageTaskCreate {
  task_type_id: string;
  sequence?: number;
  is_required?: boolean;
}

export interface Package {
  id: string;
  service_id: string;
  name: string;
  description?: string;
  price: number;
  duration?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  package_tasks: PackageTask[];
}

export interface PackageCreate {
  service_id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: string;
  active?: boolean;
  tasks?: PackageTaskCreate[];
}

export interface PackageUpdate {
  name?: string;
  description?: string;
  price?: number;
  duration?: string;
  active?: boolean;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  type: string;
  description?: string;
  recurring: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  packages: Package[];
}

export interface ServiceCreate {
  name: string;
  code: string;
  type: string;
  description?: string;
  recurring?: boolean;
  active?: boolean;
}

export interface ServiceUpdate {
  name?: string;
  type?: string;
  description?: string;
  recurring?: boolean;
  active?: boolean;
}

export interface ContentType {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface ContentTypeCreate {
  name: string;
  code: string;
  description?: string;
  active?: boolean;
}
