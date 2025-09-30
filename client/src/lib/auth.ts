import { cookies } from "next/headers"
import type { User, LoginRequest, LoginResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

export async function login(
  credentials: LoginRequest
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

      const userData = {
        userId: data.user.userId,
        identification: data.user.identification,
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
      }

      cookieStore.set("user-data", JSON.stringify(userData), {
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

      console.log(
        "[v0] Session cookies set successfully with user data:",
        userData
      )

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
    const userDataCookie = cookieStore.get("user-data")

    if (!authToken || !userDataCookie) {
      console.log("[v0] No auth token or user data found in cookies")
      return null
    }

    // Recuperar los datos del usuario desde la cookie
    const userData = JSON.parse(userDataCookie.value)
    console.log("[v0] User data from cookie:", userData)

    return {
      userId: userData.userId,
      identification: userData.identification,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role as User["role"],
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    return null
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("user-data")
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
    console.error("[v0] Get auth token error:", error)
    return null
  }
}

export async function hasRole(role: User["role"]): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    return user?.role === role || false
  } catch (error) {
    return false
  }
}
