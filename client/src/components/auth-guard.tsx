import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: User["role"]
  fallbackPath?: string
}

export async function AuthGuard({ children, requiredRole, fallbackPath = "/login" }: AuthGuardProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(fallbackPath)
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect based on user role as per HU-1 requirements
    if (user.role === "Admin") {
      redirect("/dashboard") // Admin goes to main dashboard
    } else if (user.role === "Voter") {
      redirect("/dashboard") // Voter goes to main dashboard
    } else {
      redirect("/dashboard") // Auditor also goes to main dashboard
    }
  }

  return <>{children}</>
}
