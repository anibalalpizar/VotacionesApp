"use server"

import { redirect } from "next/navigation"
import { login, logout } from "./auth"
import type { LoginRequest } from "./types"

export async function loginAction(formData: FormData) {
  const identification = formData.get("identification") as string
  const password = formData.get("password") as string

  if (!identification || !password) {
    return {
      success: false,
      message: "Identificación y contraseña son requeridos",
    }
  }

  const credentials: LoginRequest = { identification, password }
  const result = await login(credentials)

  console.log("Login result!!!!!!!!!:", result.success)
  if (result.success) {
    redirect("/dashboard")
  }

  return result
}

export async function logoutAction() {
  await logout()
  redirect("/login")
}
