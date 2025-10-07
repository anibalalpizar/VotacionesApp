import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { CreateCandidateForm } from "@/components/candidates/create-candidate-form"

export default function CreateCandidatePage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Crear Candidato</h1>
          <p className="text-muted-foreground mt-2">
            Complete el formulario para crear un nuevo candidato
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
        >
          <CreateCandidateForm />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Crear Candidato - Sistema de Votación",
  description: "Cree un nuevo candidato en el sistema de votación electrónica",
}
