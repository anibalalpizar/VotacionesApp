import { AuthGuard } from "@/components/auth-guard"
import { AuditorDashboard } from "@/components/dashboard/auditor-dashboard"
import { Shield } from "lucide-react"

export default async function AuditPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Auditoría del Sistema
              </h2>
              <p className="text-muted-foreground">
                Supervise y audite todos los eventos del sistema electoral
              </p>
            </div>
          </div>
        </div>

        <AuditorDashboard />
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Auditoría - Sistema de Votación",
  description: "Panel de auditoría del sistema de votación electrónica",
}
