"use client"

import { useRef, useTransition } from "react"
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
import { Loader2, UserPlus, Copy } from "lucide-react"
import { registerVoterAction } from "@/lib/actions"

export function RegisterVoterForm() {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit() {
    if (!formRef.current) return

    const formData = new FormData(formRef.current)

    startTransition(async () => {
      const result = await registerVoterAction(formData)

      if (result.success) {
        const passwordMatch = result.message.match(
          /Tu contraseña temporal es: (.+)/
        )
        const temporalPassword = passwordMatch ? passwordMatch[1] : null

        if (temporalPassword) {
          toast.success(
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Votante registrado exitosamente</p>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">
                  Contraseña temporal generada:
                </p>
                <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                  <code className="flex-1 text-sm font-mono">
                    {temporalPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(temporalPassword)
                        toast.success("Contraseña copiada al portapapeles", {
                          duration: 2000,
                        })
                      } catch (err) {
                        toast.error("Error al copiar")
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Comparte esta contraseña con el votante para que pueda iniciar
                sesión.
              </p>
            </div>,
            {
              duration: 15000,
            }
          )
        } else {
          toast.success(result.message)
        }

        formRef.current?.reset()
        router.push("/dashboard/voters")
      } else {
        toast.error(result.message)
      }
    })
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
          únicos. Se generará una contraseña temporal que podrás copiar y
          compartir.
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
                disabled={isPending}
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
                disabled={isPending}
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
              disabled={isPending}
              className="w-full"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              disabled={isPending}
              className="flex-1"
              onClick={handleSubmit}
            >
              {isPending ? (
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
              disabled={isPending}
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
