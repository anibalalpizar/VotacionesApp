"use server"

import { redirect } from "next/navigation"
import { login, logout } from "../auth"
import type { LoginRequest } from "../types"

export async function loginAction(formData: FormData) {
  console.log("[v0] loginAction called with formData:", Object.fromEntries(formData))

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
      console.log("[v0] First time login, redirecting to change-temporal-password")
      redirect("/change-temporal-password")
    } else {
      console.log("[v0] Normal login, redirecting to dashboard")
      redirect("/dashboard")
    }
  }

  console.log("[v0] Login failed, returning result:", result)
  return result
}

export async function logoutAction() {
  await logout()
  redirect("/login")
}