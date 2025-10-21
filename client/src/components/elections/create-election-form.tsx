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
import { Loader2, CalendarPlus } from "lucide-react"
import { createElectionAction } from "@/lib/actions"

export function CreateElectionForm() {
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const now = new Date()
  const localDate = now.toISOString().split("T")[0]
  const localTime = now.toTimeString().slice(0, 5)

  async function handleSubmit() {
    if (!formRef.current) return

    const formData = new FormData(formRef.current)

    setIsLoading(true)

    try {
      const result = await createElectionAction(formData)

      if (result.success) {
        toast.success(result.message)
        formRef.current?.reset()

        router.push("/dashboard/elections")
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
          <CalendarPlus className="h-5 w-5" />
          Información de la Elección
        </CardTitle>
        <CardDescription>
          Todos los campos son obligatorios. El nombre debe ser único y las
          fechas deben estar en formato UTC.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Elección</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ej: Elecciones Presidenciales 2025"
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                disabled={isLoading}
                defaultValue={localDate}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Hora de Inicio (UTC)</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                required
                disabled={isLoading}
                defaultValue={localTime}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                required
                disabled={isLoading}
                defaultValue={localDate}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Hora de Fin (UTC)</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                required
                disabled={isLoading}
                defaultValue={localTime}
                className="w-full"
              />
            </div>
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
                  Creando...
                </>
              ) : (
                <>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Crear Elección
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
