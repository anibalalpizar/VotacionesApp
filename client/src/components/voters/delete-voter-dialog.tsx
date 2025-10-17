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
import { Loader2, AlertTriangle, User, IdCard } from "lucide-react"
import { deleteVoterAction } from "@/lib/actions"
import DeleteVoterDialogSkeleton from "./delete-voter-dialog-skeleton"

interface DeleteVoterDialogProps {
  voter: {
    userId: number
    fullName: string
    identification: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteVoterDialog({
  voter,
  open,
  onOpenChange,
  onSuccess,
}: DeleteVoterDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [voterData, setVoterData] = useState<typeof voter>(null)

  useEffect(() => {
    if (open && voter) {
      setIsLoading(true)
      setVoterData(null)

      setTimeout(() => {
        setVoterData(voter)
        setIsLoading(false)
      }, 300)
    }
  }, [open, voter])

  const handleDelete = async () => {
    if (!voterData) return

    setIsDeleting(true)
    try {
      const result = await deleteVoterAction(voterData.userId)

      if (result.success) {
        toast.success(result.message || "Votante eliminado exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message || "Error al eliminar el votante")
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
              ¿Eliminar Votante?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Está a punto de eliminar permanentemente al siguiente votante:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading ? (
          <DeleteVoterDialogSkeleton />
        ) : voterData ? (
          <>
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Nombre Completo
                  </span>
                  <div className="font-semibold text-foreground">
                    {voterData.fullName}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IdCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Identificación
                  </span>
                  <div className="font-semibold text-foreground">
                    {voterData.identification}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <span className="text-sm font-medium text-destructive">
                ⚠️ Esta acción no se puede deshacer. Todos los datos del votante
                serán eliminados permanentemente.
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
