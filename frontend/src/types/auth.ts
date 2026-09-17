// ============================================================
// Company OS — Authentication Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  refresh_token?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface TokenPayload {
  sub?: string;
  exp?: number;
  type?: string;
}
