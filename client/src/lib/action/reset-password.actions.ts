"use server"

import { getCurrentUser } from "../auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

interface ChangePasswordRequest {
  userId: number
  temporalPassword: string
  newPassword: string
}

export async function changePasswordAction(formData: FormData) {
  const temporalPassword = formData.get("temporalPassword") as string
  const newPassword = formData.get("newPassword") as string

  if (!temporalPassword || !newPassword) {
    return {
      success: false,
      message: "Contraseña temporal y nueva contraseña son requeridos",
    }
  }

  const user = await getCurrentUser()

  if (!user) {
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

  try {
    const response = await fetch(`${API_BASE_URL}/api/Auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: "Contraseña cambiada exitosamente",
      }
    } else {
      return {
        success: false,
        message: data.error || data.message || "Error al cambiar la contraseña",
      }
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Intente nuevamente.",
    }
  }
}
