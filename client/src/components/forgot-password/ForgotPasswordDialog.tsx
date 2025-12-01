"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { forgotPasswordAction } from "@/lib/actions"

export function ForgotPasswordDialog() {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await forgotPasswordAction(formData)

      if (result.success) {
        const passwordMatch = result.message.match(/Tu contraseña temporal es: (.+)/)
        const temporalPassword = passwordMatch ? passwordMatch[1] : null

        if (temporalPassword) {
          toast.success(
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Contraseña temporal generada</p>
              <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                <code className="flex-1 text-sm font-mono">{temporalPassword}</code>
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
              <p className="text-xs text-muted-foreground">
                Usa esta contraseña para iniciar sesión y cámbiala de inmediato.
              </p>
            </div>,
            {
              duration: 10000,
            }
          )
        } else {
          toast.success(result.message)
        }

        setOpen(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm underline-offset-2 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Restablecer Contraseña</DialogTitle>
            <DialogDescription>
              Introduzca su dirección de correo electrónico para recibir una
              contraseña temporal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ejemplo@correo.com"
                required
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar Contraseña Temporal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}