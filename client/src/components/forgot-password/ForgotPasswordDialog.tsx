"use client"

import { useState } from "react"
import { toast } from "sonner"
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
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)

    try {
      const result = await forgotPasswordAction(formData)

      if (result.success) {
        toast.success(result.message)
        setOpen(false)
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
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Enviando..."
                : "Enviar Contraseña Temporal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}