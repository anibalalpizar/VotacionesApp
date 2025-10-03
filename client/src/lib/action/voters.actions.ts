"use server"

export interface VoterRegistrationRequest {
  identification: string
  fullName: string
  email: string
}

export interface VoterRegistrationResponse {
  userId: number
  identification: string
  fullName: string
  email: string
  role: string
}

import { getAuthToken } from "../auth"

export async function registerVoterAction(formData: FormData) {
  console.log(
    "[v0] registerVoterAction called with formData:",
    Object.fromEntries(formData)
  )

  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para registrar votantes. Inicia sesión como administrador.",
    }
  }

  const identification = formData.get("identification") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string

  const voterData: VoterRegistrationRequest = {
    identification,
    fullName,
    email,
  }

  try {
    console.log("[v0] Sending voter registration request:", voterData)

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Voters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(voterData),
    })

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      let errorMessage = "Error al registrar el votante. Intente nuevamente."

      try {
        const errorData = await response.json()
        console.log("[v0] API error response:", errorData)

        // Extraer el mensaje de error del backend
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.title) {
          errorMessage = errorData.title
        }
      } catch (parseError) {
        // Si no se puede parsear como JSON, intentar leer como texto
        try {
          const errorText = await response.text()
          console.log("[v0] API error text:", errorText)
          if (errorText) {
            errorMessage = errorText
          }
        } catch {
          // Usar mensaje por defecto si no se puede leer la respuesta
        }
      }

      return {
        success: false,
        message: errorMessage,
      }
    }

    const result: VoterRegistrationResponse = await response.json()
    console.log("[v0] Voter registration successful:", result)

    return {
      success: true,
      message:
        "Votante registrado exitosamente. Se ha enviado una contraseña temporal por correo.",
      data: result,
    }
  } catch (error) {
    console.error("[v0] Network error during voter registration:", error)
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}
