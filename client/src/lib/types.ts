export interface User {
  userId: number
  identification: string
  fullName: string
  email: string
  role: "ADMIN" | "VOTER" | "AUDITOR"
  createdAt: string
  isFirstTime?: boolean
}

export interface LoginRequest {
  UserOrEmail: string
  Password: string
}

export interface UserDto {
  userId: number
  identification: string
  fullName: string
  email: string
  role: string
  isFirstTime: boolean
}

export interface LoginResponse {
  token: string
  expiresIn: number
  user: UserDto
}

export interface ErrorResponse {
  error: string
}

export interface ChangePasswordRequest {
  userId: number
  temporalPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  message: string
  isFirstTime: boolean
}