"use server"

import { getCurrentUser } from "../auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

interface ChangePasswordRequest {
  userId: number
  temporalPassword: string
  newPassword: string
}

export async function changePasswordAction(formData: FormData) {
  console.log("[v0] changePasswordAction called with formData:", Object.fromEntries(formData))

  const temporalPassword = formData.get("temporalPassword") as string
  const newPassword = formData.get("newPassword") as string

  if (!temporalPassword || !newPassword) {
    console.log("[v0] Missing required fields")
    return {
      success: false,
      message: "Contraseña temporal y nueva contraseña son requeridos",
    }
  }

  const user = await getCurrentUser()
  
  if (!user) {
    console.log("[v0] No authenticated user found")
    return {
      success: false,
      message: "Usuario no autenticado",
    }
  }

  const requestBody: ChangePasswordRequest = {
    userId: user.userId,
    temporalPassword,
    newPassword,
  }

  console.log("[v0] Calling change-password with body:", requestBody)

  try {
    const response = await fetch(`${API_BASE_URL}/api/Auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    console.log("[v0] Backend response:", data)

    if (response.ok) {
      console.log("[v0] Password changed successfully")
      return {
        success: true,
        message: "Contraseña cambiada exitosamente",
      }
    } else {
      console.log("[v0] Password change failed:", data)
      return {
        success: false,
        message: data.error || data.message || "Error al cambiar la contraseña",
      }
    }
  } catch (error) {
    console.error("[v0] Change password error:", error)
    return {
      success: false,
      message: "Error de conexión. Intente nuevamente.",
    }
  }
}