const BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        localStorage.setItem(this.tokenKey, data.data.token);
        localStorage.setItem(this.userKey, JSON.stringify(data.data.user));
      } else if (!response.ok) {
        // Handle HTTP error responses
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            `Registration failed (${response.status})`,
        };
      }

      return data;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Registration failed";
            return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        localStorage.setItem(this.tokenKey, data.data.token);
        localStorage.setItem(this.userKey, JSON.stringify(data.data.user));
      } else if (!response.ok) {
        // Handle HTTP error responses
        return {
          success: false,
          error:
            data.error || data.message || `Login failed (${response.status})`,
        };
      }

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Login failed";
            return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return data.success ? data.data.user : null;
    } catch (error) {
            return null;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
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

