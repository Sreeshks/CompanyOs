// ============================================================
// Company OS — Role & Permission Types
// ============================================================

export interface Permission {
  id: string;
  code: string;
  module: string;
  description?: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface RoleCreate {
  name: string;
  code: string;
  description?: string;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
}

export interface RolePermissionUpdate {
  permission_ids: string[];
}
