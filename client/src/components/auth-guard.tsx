import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: User["role"]
  requiredRoles?: User["role"][]
  fallbackPath?: string
}

export async function AuthGuard({
  children,
  requiredRole,
  requiredRoles,
  fallbackPath = "/login",
}: AuthGuardProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(fallbackPath)
  }

  const rolesToCheck = requiredRoles || (requiredRole ? [requiredRole] : null)

  if (rolesToCheck && !rolesToCheck.includes(user.role)) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
