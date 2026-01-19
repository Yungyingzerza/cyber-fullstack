export interface User {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: 'admin' | 'viewer';
  tenant_id: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
