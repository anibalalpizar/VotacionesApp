import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { CandidatesTable } from "@/components/candidates/candidates-table"
import { CandidatesTableSkeleton } from "@/components/candidates/candidates-table-skeleton"

export default function CandidatesListPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Lista de Candidatos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestione todos los candidatos registrados en el sistema
          </p>
        </div>
        <Suspense fallback={<CandidatesTableSkeleton />}>
          <CandidatesTable />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Lista de Candidatos",
  description: "Visualice y gestione todos los candidatos registrados",
}
