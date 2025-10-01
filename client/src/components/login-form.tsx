"use client"

import type React from "react"
import { toast } from "sonner"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/actions"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)

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
        // This shouldn't happen because redirect would have thrown
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
        // The redirect will happen automatically
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
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit}>
            <div className="grid gap-6">
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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
