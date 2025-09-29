import { AuthGuard } from "@/components/auth-guard"
import { getCurrentUser } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Vote, Users, Calendar, Shield } from "lucide-react"

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

  const IconComponent = config.icon

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

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <IconComponent className="size-3" />
            {user?.role === "Admin" && "Administrador"}
            {user?.role === "Voter" && "Votante"}
            {user?.role === "Auditor" && "Auditor"}
          </Badge>
          <Badge variant="outline">ID: {user?.identification}</Badge>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estado del Sistema
              </CardTitle>
              <div className={`${config.color} rounded-full p-2`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Activo</div>
              <p className="text-xs text-muted-foreground">Sistema operativo</p>
            </CardContent>
          </Card>

          {/* Elections Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Elecciones</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === "Admin"
                  ? "Elecciones creadas"
                  : "Elecciones disponibles"}
              </p>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.role === "Admin" ? "Usuarios" : "Mi Actividad"}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.role === "Admin" ? "0" : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.role === "Admin"
                  ? "Usuarios registrados"
                  : "Votos emitidos"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              {user?.role === "Admin" && "Gestione el sistema electoral"}
              {user?.role === "Voter" && "Participe en el proceso electoral"}
              {user?.role === "Auditor" && "Supervise el proceso electoral"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {user?.role === "Admin" &&
                "Funciones de administración estarán disponibles próximamente."}
              {user?.role === "Voter" &&
                "No hay elecciones activas en este momento."}
              {user?.role === "Auditor" &&
                "Funciones de auditoría estarán disponibles próximamente."}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Dashboard - Sistema de Votación",
  description: "Panel principal del sistema de votación electrónica",
}
