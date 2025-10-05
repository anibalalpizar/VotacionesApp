import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { CreateElectionForm } from "@/components/elections/create-election-form"

export default function CreateElectionPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Crear Elección</h1>
          <p className="text-muted-foreground mt-2">
            Complete el formulario para crear una nueva elección en el sistema
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
        >
          <CreateElectionForm />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Crear Elección - Sistema de Votación",
  description: "Cree una nueva elección en el sistema de votación electrónica",
}
