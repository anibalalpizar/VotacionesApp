"use server"

export interface VoterRegistrationRequest {
  identification: string
  fullName: string
  email: string
  password: string
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
  console.log("[v0] registerVoterAction called with formData:", Object.fromEntries(formData))

  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "No tienes autorización para registrar votantes. Inicia sesión como administrador.",
    }
  }

  const identification = formData.get("identification") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validation
  if (!identification || !fullName || !email || !password) {
    return {
      success: false,
      message: "Todos los campos son requeridos",
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      success: false,
      message: "El formato del email no es válido",
    }
  }

  // Password validation (minimum 6 characters)
  if (password.length < 6) {
    return {
      success: false,
      message: "La contraseña debe tener al menos 6 caracteres",
    }
  }

  const voterData: VoterRegistrationRequest = {
    identification,
    fullName,
    email,
    password,
  }

  try {
    console.log("[v0] Sending voter registration request:", voterData)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

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
      const errorText = await response.text()
      console.log("[v0] API error response:", errorText)

      // Handle specific error cases
      if (response.status === 401) {
        return {
          success: false,
          message: "No tienes autorización para registrar votantes.",
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: "Acceso denegado. Solo los administradores pueden registrar votantes.",
        }
      }

      if (response.status === 409) {
        return {
          success: false,
          message: "Ya existe un votante con esta identificación.",
        }
      }

      if (response.status === 400) {
        return {
          success: false,
          message: "Datos inválidos. Verifique la información ingresada.",
        }
      }

      return {
        success: false,
        message: "Error al registrar el votante. Intente nuevamente.",
      }
    }

    const result: VoterRegistrationResponse = await response.json()
    console.log("[v0] Voter registration successful:", result)

    return {
      success: true,
      message: "Votante registrado exitosamente",
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
