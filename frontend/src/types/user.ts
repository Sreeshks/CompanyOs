// ============================================================
// Company OS — User Types
// ============================================================

export interface UserSkill {
  id: string;
  skill_name: string;
  created_at: string;
}

export interface User {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  role_id: string;
  designation_id?: string;
  department_id?: string;
  employment_type: string;
  status: string;
  joining_date?: string;
  created_at: string;
  updated_at: string;
  role_name?: string;
  designation_name?: string;
  department_name?: string;
  skills: UserSkill[];
}

export interface UserCreate {
  employee_code: string;
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role_id: string;
  designation_id?: string;
  department_id?: string;
  employment_type?: string;
  status?: string;
  joining_date?: string;
  skills?: string[];
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  role_id?: string;
  designation_id?: string;
  department_id?: string;
  employment_type?: string;
  status?: string;
  joining_date?: string;
  skills?: string[];
}

export interface UserStatusUpdate {
  status: string;
}

export interface UserResetPassword {
  new_password: string;
}
