import { apiCall } from "./apiService";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "agent" | "admin" | "management";
  department?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: "agent" | "admin" | "management";
      phone?: string;
      department?: string;
    };
  };
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "agent" | "admin" | "management";
  phone?: string;
  department?: string;
}

class AuthService {
  private tokenKey = "auth_token";
  private userKey = "auth_user";

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiCall<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (response.success && response.data) {
      localStorage.setItem(this.tokenKey, response.data.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.data.user));
    }

    return response;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiCall<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (response.success && response.data) {
      localStorage.setItem(this.tokenKey, response.data.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.data.user));
    }

    return response;
  }

  async getCurrentUser(): Promise<User | null> {
    const response = await apiCall<any>("/auth/me", {
      method: "GET",
    });

    return response.success ? response.data.user : null;
  }

  async logout(): Promise<void> {
    try {
      await apiCall("/auth/logout", {
        method: "POST",
      });
    } finally {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  getStoredUser(): User | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();

