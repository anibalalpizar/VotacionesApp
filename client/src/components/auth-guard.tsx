import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: User["role"]
  fallbackPath?: string
}

export async function AuthGuard({
  children,
  requiredRole,
  fallbackPath = "/login",
}: AuthGuardProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(fallbackPath)
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === "Admin") {
      redirect("/dashboard")
    } else if (user.role === "Voter") {
      redirect("/dashboard")
    } else {
      redirect("/dashboard")
    }
  }

  return <>{children}</>
}
