"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle, UserX, Hash } from "lucide-react"
import { deleteCandidateAction } from "@/lib/actions"

interface DeleteCandidateDialogProps {
  candidate: {
    candidateId: number
    name: string
    party: string
    electionName: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteCandidateDialog({
  candidate,
  open,
  onOpenChange,
  onSuccess,
}: DeleteCandidateDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!candidate) return

    setIsDeleting(true)
    try {
      const result = await deleteCandidateAction(candidate.candidateId)

      if (result.success) {
        toast.success(result.message || "Candidato eliminado exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message || "Error al eliminar el candidato")
      }
    } catch (error) {
      toast.error("Error de conexión al eliminar")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              ¿Eliminar Candidato?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Está a punto de eliminar permanentemente el siguiente candidato:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {candidate && (
          <>
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <UserX className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Nombre del Candidato
                  </span>
                  <div className="font-semibold text-foreground">
                    {candidate.name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Partido/Agrupación
                  </span>
                  <div className="font-semibold text-foreground">
                    {candidate.party}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <span className="text-sm font-medium text-destructive">
                ⚠️ Esta acción no se puede deshacer. El candidato será eliminado
                permanentemente del sistema.
              </span>
            </div>
          </>
        )}

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Eliminar
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
