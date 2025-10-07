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
import { UserCheck, X } from "lucide-react"
import { getCandidateByIdAction } from "@/lib/actions"

interface ViewCandidateDialogProps {
  candidateId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewCandidateDialog({
  candidateId,
  open,
  onOpenChange,
}: ViewCandidateDialogProps) {
  const [candidate, setCandidate] = useState<{
    candidateId: number
    electionName: string
    name: string
    party: string
  } | null>(null)

  useEffect(() => {
    if (open && candidateId) {
      loadCandidateDetails()
    }
  }, [open, candidateId])

  async function loadCandidateDetails() {
    if (!candidateId) return

    try {
      const result = await getCandidateByIdAction(candidateId)

      if (result.success && result.data) {
        setCandidate(result.data)
      } else {
        toast.error(result.message || "Error al cargar detalles del candidato")
        onOpenChange(false)
      }
    } catch (error) {
      toast.error("Error de conexión al cargar detalles")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Detalles del Candidato
          </DialogTitle>
          <DialogDescription>
            Información completa del candidato seleccionado
          </DialogDescription>
        </DialogHeader>

        {candidate ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="view-candidateId">ID del Candidato</Label>
                <Input
                  id="view-candidateId"
                  value={candidate.candidateId}
                  disabled
                  className="w-full bg-muted font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="view-electionName">Elección</Label>
                <Input
                  id="view-electionName"
                  value={candidate.electionName}
                  disabled
                  className="w-full bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-name">Nombre del Candidato</Label>
              <Input
                id="view-name"
                value={candidate.name}
                disabled
                className="w-full bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-party">Partido/Agrupación</Label>
              <Input
                id="view-party"
                value={candidate.party}
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
