import { Suspense } from "react"
import { Vote } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginPageProps {
  searchParams: Promise<{ registered?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const showRegisteredMessage = params.registered === "true"

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/login" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Vote className="size-4" />
          </div>
          Sistema de Votación UTN
        </a>

        {showRegisteredMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>Registro exitoso. Ahora puede iniciar sesión con sus credenciales.</AlertDescription>
          </Alert>
        )}

        <Suspense fallback={<div>Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

export const metadata = {
  title: "Iniciar Sesión - Sistema de Votación",
  description: "Acceda al sistema de votación electrónica",
}
