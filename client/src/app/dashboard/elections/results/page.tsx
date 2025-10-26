import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { ElectionResults } from "@/components/elections/election-results"
import ElectionsResultsSkeleton from "@/components/elections/elections-results-skeleton"

export default function ElectionResultsPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <Suspense fallback={<ElectionsResultsSkeleton />}>
        <ElectionResults />
      </Suspense>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Resultados de Elección - Sistema de Votación",
  description: "Visualice los resultados finales de la elección",
}
