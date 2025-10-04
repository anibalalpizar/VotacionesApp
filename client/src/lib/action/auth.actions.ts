"use server"

import { redirect } from "next/navigation"
import { login, logout } from "../auth"
import type { LoginRequest } from "../types"

export async function loginAction(formData: FormData) {
  console.log(
    "[v0] loginAction called with formData:",
    Object.fromEntries(formData)
  )

  const identification = formData.get("identification") as string
  const password = formData.get("password") as string

  if (!identification || !password) {
    console.log("[v0] Missing credentials")
    return {
      success: false,
      message: "Identificación y contraseña son requeridos",
    }
  }

  const credentials: LoginRequest = {
    UserOrEmail: identification,
    Password: password,
  }

  console.log("[v0] Calling login with credentials:", credentials)
  const result = await login(credentials)
  console.log("[v0] Login result:", result)

  if (result.success && result.data) {
    const isFirstTime = result.data.user.isFirstTime

    console.log("[v0] Login successful, isFirstTime:", isFirstTime)

    if (isFirstTime) {
      console.log(
        "[v0] First time login, redirecting to change-temporal-password"
      )
      redirect("/change-temporal-password")
    } else {
      console.log("[v0] Normal login, redirecting to dashboard")
      redirect("/dashboard")
    }
  }

  console.log("[v0] Login failed, returning result:", result)
  return result
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return {
      success: false,
      message: "El correo electrónico es requerido",
    }
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_URL}/api/Auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        message:
          data.message ||
          "Si el correo existe, se enviará una contraseña temporal.",
      }
    } else {
      const errorData = await response.json().catch(() => null)
      return {
        success: false,
        message: errorData?.detail || "Error al procesar la solicitud",
      }
    }
  } catch (error) {
    console.error("[forgotPassword] Error:", error)
    return {
      success: false,
      message: "Error de conexión con el servidor",
    }
  }
}

export async function logoutAction() {
  await logout()
  redirect("/login")
}
