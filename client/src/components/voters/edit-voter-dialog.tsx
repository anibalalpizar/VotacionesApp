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
import { Loader2, Pencil, Save, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateVoterAction } from "@/lib/actions"

interface EditVoterDialogProps {
  voter: {
    userId: number
    identification: string
    fullName: string
    email: string
    role: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditVoterDialog({
  voter,
  open,
  onOpenChange,
  onSuccess,
}: EditVoterDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    identification: "",
    fullName: "",
    email: "",
    role: "VOTER",
  })

  useEffect(() => {
    if (voter && open) {
      setFormData({
        identification: voter.identification,
        fullName: voter.fullName,
        email: voter.email,
        role: voter.role,
      })
    }
  }, [voter, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!voter) return

    setIsSubmitting(true)
    try {
      const result = await updateVoterAction(voter.userId, formData)

      if (result.success) {
        toast.success(result.message || "Votante actualizado exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message || "Error al actualizar el votante")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Votante
          </DialogTitle>
          <DialogDescription>
            Modifique la información del votante seleccionado
          </DialogDescription>
        </DialogHeader>

        {voter ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-identification">
                    Identificación <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-identification"
                    value={formData.identification}
                    onChange={(e) =>
                      handleChange("identification", e.target.value)
                    }
                    placeholder="Ej: 123456789"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">
                    Rol <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VOTER">VOTER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fullName">
                  Nombre Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Ej: Juan Pérez González"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">
                  Correo Electrónico <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Ej: juan.perez@ejemplo.com"
                  required
                  disabled={isSubmitting}
                />
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