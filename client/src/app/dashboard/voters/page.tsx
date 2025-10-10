import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { VotersTable } from "@/components/voters/voters-table"

export default function VotersListPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Lista de Votantes
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestione todos los votantes registrados en el sistema
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
        >
          <VotersTable />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Lista de Votantes - Sistema de Votación",
  description: "Visualice y gestione todos los votantes registrados",
}
