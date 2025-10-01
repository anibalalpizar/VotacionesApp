import { AuthGuard } from "@/components/auth-guard"
import { getCurrentUser } from "@/lib/auth"
import { Vote, Users, Shield } from "lucide-react"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  console.log("[v0] User role from backend:", user?.role)

  const roleConfig = {
    ADMIN: {
      title: "Panel de Administración",
      description:
        "Gestione elecciones, candidatos y supervise el proceso electoral",
      color: "bg-red-500",
      icon: Shield,
    },
    VOTER: {
      title: "Panel de Votante",
      description:
        "Participe en las elecciones activas y consulte su historial",
      color: "bg-blue-500",
      icon: Vote,
    },
    AUDITOR: {
      title: "Panel de Auditoría",
      description: "Supervise y audite el proceso electoral",
      color: "bg-green-500",
      icon: Users,
    },
  }

  const config = user?.role
    ? roleConfig[user.role] || roleConfig.VOTER
    : roleConfig.VOTER

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Bienvenido, {user?.fullName} {user?.role}
          </h2>
          <p className="text-muted-foreground">{config.description}</p>
        </div>
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Dashboard - Sistema de Votación",
  description: "Panel principal del sistema de votación electrónica",
}
