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

    if (response.ok) {
      const cookieStore = await cookies()

      const userData = {
        userId: data.user.userId,
        identification: data.user.identification,
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
        isFirstTime: data.user.isFirstTime,
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
      return null
    }

    const userData = JSON.parse(userDataCookie.value)

    return {
      userId: userData.userId,
      identification: userData.identification,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role as User["role"],
      createdAt: new Date().toISOString(),
      isFirstTime: userData.isFirstTime,
    }
  } catch (error) {
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
