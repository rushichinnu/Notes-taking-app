export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
}

// Added for passwordless signup
export interface SignupRequest {
  email: string;
  name: string;
}

export interface LoginOTPRequest {
  email: string;
}

export interface VerifyLoginOTPRequest {
  loginSession: string;
  otp: string;
}
