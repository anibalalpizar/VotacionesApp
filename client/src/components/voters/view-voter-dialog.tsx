"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UserCircle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getVoterByIdAction } from "@/lib/actions"
import { cn } from "@/lib/utils"

interface ViewVoterDialogProps {
  voterId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewVoterDialog({
  voterId,
  open,
  onOpenChange,
}: ViewVoterDialogProps) {
  const [voter, setVoter] = useState<{
    userId: number
    identification: string
    fullName: string
    email: string
    role: string
    createdAt: string
  } | null>(null)

  useEffect(() => {
    if (open && voterId) {
      loadVoterDetails()
    }
  }, [open, voterId])

  async function loadVoterDetails() {
    if (!voterId) return

    try {
      const result = await getVoterByIdAction(voterId)

      if (result.success && result.data) {
        setVoter(result.data)
      } else {
        toast.error(result.message || "Error al cargar detalles del votante")
        onOpenChange(false)
      }
    } catch (error) {
      toast.error("Error de conexión al cargar detalles")
      onOpenChange(false)
    }
  }

  const roleStyles = {
    ADMIN:
      "bg-blue-600/10 text-blue-600 focus-visible:ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400",
    VOTER:
      "bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400",
  }[voter?.role || ""] || "bg-gray-600/10 text-gray-600"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Detalles del Votante
          </DialogTitle>
          <DialogDescription>
            Información completa del votante seleccionado
          </DialogDescription>
        </DialogHeader>

        {voter ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="view-identification">Identificación</Label>
                <Input
                  id="view-identification"
                  value={voter.identification}
                  disabled
                  className="w-full bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="view-userId">ID de Usuario</Label>
                <Input
                  id="view-userId"
                  value={voter.userId}
                  disabled
                  className="w-full bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-fullName">Nombre Completo</Label>
              <Input
                id="view-fullName"
                value={voter.fullName}
                disabled
                className="w-full bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-email">Correo Electrónico</Label>
              <Input
                id="view-email"
                value={voter.email}
                disabled
                className="w-full bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-role">Rol</Label>
              <div className="flex items-center h-10">
                <Badge
                  className={cn(
                    "rounded-full border-none focus-visible:outline-none",
                    roleStyles
                  )}
                >
                  {voter.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-createdAt">Fecha de Registro</Label>
              <Input
                id="view-createdAt"
                value={new Date(voter.createdAt).toLocaleString("es-CR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                disabled
                className="w-full bg-muted"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cerrar
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}