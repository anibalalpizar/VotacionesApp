export interface User {
  userId: number
  identification: string
  fullName: string
  email: string
  role: "Admin" | "Voter" | "Auditor"
  createdAt: string
}

export interface LoginRequest {
  identification: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  user?: User
  token?: string
}
