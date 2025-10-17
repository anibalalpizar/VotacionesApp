"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Loader2, Pencil, Save, X } from "lucide-react"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { updateCandidateAction, getAllElectionsAction } from "@/lib/actions"
import EditCandidateDialogSkeleton from "./edit-candidate-dialog-skeleton"

interface EditCandidateDialogProps {
  candidate: {
    candidateId: number
    electionId: number
    electionName: string
    name: string
    party: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditCandidateDialog({
  candidate,
  open,
  onOpenChange,
  onSuccess,
}: EditCandidateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingElections, setIsLoadingElections] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(
    null
  )
  const [elections, setElections] = useState<
    Array<{ electionId: number; name: string }>
  >([])

  const [formData, setFormData] = useState({
    name: "",
    party: "",
  })

  // Cargar elecciones al abrir el modal
  useEffect(() => {
    if (!open) return
    const loadElections = async () => {
      setIsLoadingElections(true)
      try {
        const result = await getAllElectionsAction(1, 100)

        if (result.success && result.data) {
          setElections(result.data.items)
        } else {
          toast.error(result.message || "Error al cargar elecciones")
        }
      } catch (error) {
        toast.error("Error de conexión al cargar elecciones")
      } finally {
        setIsLoadingElections(false)
      }
    }
    loadElections()
  }, [open])

  // Cuando haya candidato y elecciones disponibles
  useEffect(() => {
    if (!candidate) return

    setIsLoading(true)

    setTimeout(() => {
      setFormData({
        name: candidate.name || "",
        party: candidate.party || "",
      })

      if (elections.length > 0) {
        setSelectedElectionId(candidate.electionId ?? null)
      }
      setIsLoading(false)
    }, 300)
  }, [candidate, elections])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidate) return

    if (!selectedElectionId) {
      toast.error("Por favor seleccione una elección")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateCandidateAction(candidate.candidateId, {
        electionId: selectedElectionId,
        name: formData.name,
        party: formData.party,
      })

      if (result.success) {
        toast.success(result.message || "Candidato actualizado exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message || "Error al actualizar el candidato")
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
            Editar Candidato
          </DialogTitle>
          <DialogDescription>
            Modifique la información del candidato seleccionado
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <EditCandidateDialogSkeleton />
        ) : candidate ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>ID del Candidato</Label>
                <Input
                  value={candidate.candidateId}
                  disabled
                  className="w-full bg-muted font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Elección <span className="text-destructive">*</span>
                </Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                      disabled={isSubmitting || isLoadingElections}
                    >
                      {isLoadingElections ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cargando elecciones...
                        </>
                      ) : selectedElectionId !== null ? (
                        elections.find(
                          (e) => e.electionId === selectedElectionId
                        )?.name || "Seleccione una elección..."
                      ) : (
                        "Seleccione una elección..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar elección..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>
                          No se encontró ninguna elección.
                        </CommandEmpty>
                        <CommandGroup>
                          {elections.map((election) => (
                            <CommandItem
                              key={election.electionId}
                              value={election.name}
                              onSelect={() => {
                                setSelectedElectionId(election.electionId)
                                setOpenCombobox(false)
                              }}
                            >
                              {election.name}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedElectionId === election.electionId
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>
                  Nombre del Candidato{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Partido/Agrupación <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.party}
                  onChange={(e) => handleChange("party", e.target.value)}
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
