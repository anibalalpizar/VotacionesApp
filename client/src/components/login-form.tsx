"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/actions"
import Image from "next/image"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    console.log("[v0] handleSubmit called")
    setIsLoading(true)

    try {
      console.log("[v0] Calling loginAction")
      const result = await loginAction(formData)
      console.log("[v0] loginAction result:", result)

      if (result && !result.success) {
        console.log("[v0] Login failed, showing error:", result.message)
        toast.error(result.message)
      } else if (result && result.success) {
        console.log("[v0] Login successful but no redirect happened")
        toast.success("Inicio de sesión exitoso")
      }
    } catch (error) {
      console.log("[v0] Error in handleSubmit:", error)
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.includes("NEXT_REDIRECT")
      ) {
        console.log("[v0] Redirect detected - login was successful")
        toast.success("Inicio de sesión exitoso")
      } else {
        console.log("[v0] Unexpected error:", error)
        toast.error("Error inesperado. Intente nuevamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Bienvenido de nuevo</h1>
                <p className="text-muted-foreground text-balance">
                  Ingrese a su cuenta del sistema
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="identification">Número de Identificación</Label>
                <Input
                  id="identification"
                  name="identification"
                  type="text"
                  placeholder="12345678"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"}
                    </span>
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </div>
          </form>

          <div className="bg-muted relative hidden md:block">
            <Image
              width={400}
              height={400}
              src="/login.png"
              alt="Imagen de bienvenida"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.9]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
