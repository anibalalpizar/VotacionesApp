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
import { CalendarCheck, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getElectionByIdAction } from "@/lib/actions"
import { cn } from "@/lib/utils"
import ViewElectionDialogSkeleton from "./view-election-dialog-skeleton"

interface ViewElectionDialogProps {
  electionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewElectionDialog({
  electionId,
  open,
  onOpenChange,
}: ViewElectionDialogProps) {
  const [election, setElection] = useState<{
    electionId: string
    name: string
    startDateUtc: string
    endDateUtc: string
    status: string
    candidateCount: number
    voteCount: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && electionId) {
      loadElectionDetails()
    }
  }, [open, electionId])

  async function loadElectionDetails() {
    if (!electionId) return

    setIsLoading(true)
    setElection(null)

    try {
      const [result] = await Promise.all([
        getElectionByIdAction(electionId),
        new Promise((resolve) => setTimeout(resolve, 300)),
      ])

      if (result.success && result.data) {
        setElection(result.data)
      } else {
        toast.error(result.message || "Error al cargar detalles de la elección")
        onOpenChange(false)
      }
    } catch (error) {
      toast.error("Error de conexión al cargar detalles")
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const statusStyles =
    {
      Scheduled:
        "bg-gray-600/10 text-gray-600 focus-visible:ring-gray-600/20 dark:bg-gray-400/10 dark:text-gray-400",
      Active:
        "bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400",
      Closed:
        "bg-red-600/10 text-red-600 focus-visible:ring-red-600/20 dark:bg-red-400/10 dark:text-red-400",
    }[election?.status || ""] || "bg-gray-600/10 text-gray-600"

  const statusLabels = {
    Scheduled: "Borrador",
    Active: "Activa",
    Closed: "Cerrada",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Detalles de la Elección
          </DialogTitle>
          <DialogDescription>
            Información completa de la elección seleccionada
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <ViewElectionDialogSkeleton />
        ) : election ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="view-name">Nombre de la Elección</Label>
              <Input
                id="view-name"
                value={election.name}
                disabled
                className="w-full bg-muted"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="view-status">Estado</Label>
                <div className="flex items-center h-10">
                  <Badge
                    className={cn(
                      "rounded-full border-none focus-visible:outline-none",
                      statusStyles
                    )}
                  >
                    {statusLabels[
                      election.status as keyof typeof statusLabels
                    ] || election.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="view-electionId">ID de Elección</Label>
                <Input
                  id="view-electionId"
                  value={election.electionId}
                  disabled
                  className="w-full bg-muted font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="view-startDate">Fecha de Inicio</Label>
                <Input
                  id="view-startDate"
                  value={new Date(election.startDateUtc).toLocaleString(
                    "es-CR",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                  disabled
                  className="w-full bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="view-endDate">Fecha de Fin</Label>
                <Input
                  id="view-endDate"
                  value={new Date(election.endDateUtc).toLocaleString("es-CR", {
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="view-candidateCount">
                  Cantidad de Candidatos
                </Label>
                <Input
                  id="view-candidateCount"
                  value={election.candidateCount}
                  disabled
                  className="w-full bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="view-voteCount">Cantidad de Votos</Label>
                <Input
                  id="view-voteCount"
                  value={election.voteCount}
                  disabled
                  className="w-full bg-muted"
                />
              </div>
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
