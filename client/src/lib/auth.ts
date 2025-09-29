import { cookies } from "next/headers"
import type { User, LoginRequest, LoginResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

export async function login(
  credentials: LoginRequest,
): Promise<{ success: boolean; message: string; data?: LoginResponse }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()
    console.log("[v0] Backend response:", data)

    if (response.ok) {
      const cookieStore = await cookies()

      const sessionData = {
        token: data.token,
        role: data.role,
        expiresIn: data.expiresIn,
      }

      cookieStore.set("user-session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.expiresIn,
      })

      cookieStore.set("auth-token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.expiresIn,
      })

      cookieStore.set("user-role", data.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.expiresIn,
      })

      console.log("[v0] Session cookies set successfully")

      return {
        success: true,
        message: "Inicio de sesión exitoso",
        data,
      }
    } else {
      return {
        success: false,
        message: data.error || "Credenciales inválidas",
      }
    }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return {
      success: false,
      message: "Error de conexión. Intente nuevamente.",
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")
    const userRole = cookieStore.get("user-role")

    if (!authToken || !userRole) {
      return null
    }

    // For now, return basic user info from token/cookies
    // In production, you might want to decode the JWT or call another endpoint
    return {
      userId: 1, // This should come from JWT decode
      identification: "ADMIN-001", // This should come from JWT decode
      fullName: "Usuario del Sistema", // This should come from JWT decode
      email: "user@utn.ac.cr", // This should come from JWT decode
      role: userRole.value as User["role"],
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("user-session")
  cookieStore.delete("auth-token")
  cookieStore.delete("user-role")
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
  try {
    const cookieStore = await cookies()
    const userRole = cookieStore.get("user-role")
    return userRole?.value === role || false
  } catch (error) {
    return false
  }
}
