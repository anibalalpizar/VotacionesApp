import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { ElectionsTable } from "@/components/elections/elections-table"

export default function ElectionsListPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Lista de Elecciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestione todas las elecciones registradas en el sistema
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
        >
          <ElectionsTable />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Lista de Elecciones - Sistema de Votación",
  description: "Visualice y gestione todas las elecciones registradas",
}
