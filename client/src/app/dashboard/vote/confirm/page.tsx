import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { VoteConfirmation } from "@/components/vote/vote-confirmation"
import { Loader2 } from "lucide-react"
import type { User } from "@/lib/types"

export default function VoteConfirmPage() {
  return (
    <AuthGuard requiredRoles={["ADMIN", "VOTER"] as User["role"][]}>
      <main className="min-h-screen bg-background">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-12 max-w-2xl">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando información...</p>
              </div>
            </div>
          }
        >
          <VoteConfirmation />
        </Suspense>
      </main>
    </AuthGuard>
  )
}

export const metadata = {
  title: "Confirmar Voto - Elección Activa",
  description: "Confirma tu voto antes de enviarlo",
}
