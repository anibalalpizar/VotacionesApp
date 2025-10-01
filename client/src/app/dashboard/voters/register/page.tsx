"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UserPlus } from "lucide-react"
import { registerVoterAction } from "@/lib/actions"

export default function RegisterVoterPage() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)

    try {
      const result = await registerVoterAction(formData)

      if (result.success) {
        toast.success(result.message)
        // Reset form
        const form = document.getElementById("voter-form") as HTMLFormElement
        form?.reset()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Error inesperado. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Registrar Votante</h1>
        <p className="text-muted-foreground mt-2">
          Complete el formulario para registrar un nuevo votante en el sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Información del Votante
          </CardTitle>
          <CardDescription>
            Todos los campos son obligatorios. La identificación y email deben ser únicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="voter-form" action={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="identification">Identificación</Label>
                <Input
                  id="identification"
                  name="identification"
                  type="text"
                  placeholder="Ej: 1234567890"
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Ej: Juan Pérez García"
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Ej: juan.perez@email.com"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                required
                disabled={isLoading}
                className="w-full"
              />
              {/* <p className="text-sm text-muted-foreground">La contraseña debe tener al menos 6 caracteres</p> */}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar Votante
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  const form = document.getElementById("voter-form") as HTMLFormElement
                  form?.reset()
                }}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}