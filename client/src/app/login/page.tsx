import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

interface LoginPageProps {
  searchParams: Promise<{ registered?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Suspense
          fallback={
            <div>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            </div>
          }
        >
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
