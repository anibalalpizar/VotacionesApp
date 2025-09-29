import { cookies } from "next/headers"
import type { User, LoginRequest, LoginResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userOrEmail: credentials.identification,
        password: credentials.password,
      }),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      // Store user session in httpOnly cookie
      const cookieStore = await cookies()
      cookieStore.set("user-session", JSON.stringify(data.user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      if (data.token) {
        cookieStore.set("auth-token", data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      }
    }

    return data
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      message: "Error de conexión. Intente nuevamente.",
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const userSession = cookieStore.get("user-session")

    if (!userSession) {
      return null
    }

    return JSON.parse(userSession.value) as User
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("user-session")
  cookieStore.delete("auth-token")
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")
    return authToken?.value || null
  } catch (error) {
    console.error("Get auth token error:", error)
    return null
  }
}

export async function hasRole(role: User["role"]): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role || false
}
