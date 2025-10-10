import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { RegisterVoterForm } from "@/components/voters/register-voter-form"

export default function RegisterVoterPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Registrar Votante
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete el formulario para registrar un nuevo votante en el sistema
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
        >
          <RegisterVoterForm />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Registrar Votante - Sistema de Votación",
  description:
    "Registre un nuevo votante en el sistema de votación electrónica",
}
