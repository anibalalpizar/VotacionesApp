"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Pencil, Save, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateElectionAction } from "@/lib/actions"
import EditElectionDialogSkeleton from "./edit-election-dialog-skeleton"

interface EditElectionDialogProps {
  election: {
    electionId: string
    name: string
    startDateUtc: string
    endDateUtc: string
    status: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditElectionDialog({
  election,
  open,
  onOpenChange,
  onSuccess,
}: EditElectionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    status: "Scheduled",
  })

  useEffect(() => {
    if (election && open) {
      setIsLoading(true)

      setTimeout(() => {
        const startDate = new Date(election.startDateUtc)
        const endDate = new Date(election.endDateUtc)

        setFormData({
          name: election.name,
          startDate: startDate.toISOString().split("T")[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endDate: endDate.toISOString().split("T")[0],
          endTime: endDate.toTimeString().slice(0, 5),
          status: election.status,
        })
        setIsLoading(false)
      }, 300)
    }
  }, [election, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!election) return

    const startDateUtc = new Date(
      `${formData.startDate}T${formData.startTime}:00.000Z`
    ).toISOString()
    const endDateUtc = new Date(
      `${formData.endDate}T${formData.endTime}:00.000Z`
    ).toISOString()

    setIsSubmitting(true)
    try {
      const result = await updateElectionAction(election.electionId, {
        name: formData.name,
        startDateUtc,
        endDateUtc,
      })

      if (result.success) {
        toast.success(result.message || "Elección actualizada exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message || "Error al actualizar la elección")
      }
    } catch (error) {
      toast.error("Error de conexión al actualizar")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isDraft = election?.status === "Scheduled"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Elección
          </DialogTitle>
          <DialogDescription>
            Modifique la información de la elección seleccionada
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <EditElectionDialogSkeleton />
        ) : election ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {!isDraft && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Las fechas solo pueden editarse cuando la elección está en
                    estado &quot;Borrador&quot;.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Nombre de la Elección{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ej: Elecciones Presidenciales 2025"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">
                    Fecha de Inicio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    required
                    disabled={isSubmitting || !isDraft}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">
                    Hora de Inicio (UTC){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleChange("startTime", e.target.value)}
                    required
                    disabled={isSubmitting || !isDraft}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">
                    Fecha de Fin <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    required
                    disabled={isSubmitting || !isDraft}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">
                    Hora de Fin (UTC){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleChange("endTime", e.target.value)}
                    required
                    disabled={isSubmitting || !isDraft}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
