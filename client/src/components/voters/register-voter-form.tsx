"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { Loader2, UserPlus } from "lucide-react"
import { registerVoterAction } from "@/lib/actions"

export function RegisterVoterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit() {
    if (!formRef.current) return

    const formData = new FormData(formRef.current)

    setIsLoading(true)

    try {
      const result = await registerVoterAction(formData)

      if (result.success) {
        toast.success(result.message)
        formRef.current?.reset()

        router.push("/dashboard/voters")
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Información del Votante
        </CardTitle>
        <CardDescription>
          Todos los campos son obligatorios. La identificación y email deben ser
          únicos. Se enviará una contraseña temporal al correo del votante.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} className="space-y-6">
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

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              disabled={isLoading}
              className="flex-1"
              onClick={handleSubmit}
            >
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
                formRef.current?.reset()
              }}
            >
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
