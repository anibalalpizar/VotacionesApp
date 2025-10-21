import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { CandidateList } from "@/components/vote/candidate-list"
import { Loader2 } from "lucide-react"

export default function VotePage() {
  return (
    <AuthGuard requiredRole="VOTER">
      <main className="min-h-screen bg-background">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-12 max-w-7xl">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando candidatos...</p>
              </div>
            </div>
          }
        >
          <CandidateList />
        </Suspense>
      </main>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Votar - Elección Activa",
  description: "Selecciona tu candidato de preferencia para emitir tu voto",
}
