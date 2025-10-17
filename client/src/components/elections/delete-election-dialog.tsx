"use client"

import { useEffect, useState } from "react"
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
import { Loader2, AlertTriangle, CalendarCheck, Hash } from "lucide-react"
import { deleteElectionAction } from "@/lib/actions"
import DeleteElectionDialogSkeleton from "./delete-election-dialog-skeleton"

interface DeleteElectionDialogProps {
  election: {
    electionId: string
    name: string
    candidateCount: number
    voteCount: number
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteElectionDialog({
  election,
  open,
  onOpenChange,
  onSuccess,
}: DeleteElectionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [electionData, setElectionData] = useState<typeof election>(null)

  useEffect(() => {
    if (open && election) {
      setIsLoading(true)
      setElectionData(null)

      setTimeout(() => {
        setElectionData(election)
        setIsLoading(false)
      }, 300)
    }
  }, [open, election])

  const handleDelete = async () => {
    if (!electionData) return

    setIsDeleting(true)
    try {
      const result = await deleteElectionAction(electionData.electionId)

      if (result.success) {
        toast.success(result.message || "Elección eliminada exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message || "Error al eliminar la elección")
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
              ¿Eliminar Elección?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Está a punto de eliminar permanentemente la siguiente elección:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading ? (
          <DeleteElectionDialogSkeleton />
        ) : electionData ? (
          <>
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <CalendarCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Nombre de la Elección
                  </span>
                  <div className="font-semibold text-foreground">
                    {electionData.name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Estadísticas
                  </span>
                  <div className="font-semibold text-foreground">
                    {electionData.candidateCount} candidatos •{" "}
                    {electionData.voteCount} votos
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <span className="text-sm font-medium text-destructive">
                ⚠️ Esta acción no se puede deshacer. La elección solo puede
                eliminarse si no tiene votos registrados ni candidatos
                asociados.
              </span>
            </div>

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
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}
