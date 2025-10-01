export interface User {
  userId: number
  identification: string
  fullName: string
  email: string
  role: "ADMIN" | "VOTER" | "AUDITOR"
  createdAt: string
}

export interface LoginRequest {
  UserOrEmail: string
  Password: string
}

export interface LoginResponse {
  token: string
  role: string
  expiresIn: number
}

export interface ErrorResponse {
  error: string
}
