"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { Loader2, UserPlus } from "lucide-react"
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
import { createCandidateAction, getAllElectionsAction } from "@/lib/actions"


export function CreateCandidateForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingElections, setIsLoadingElections] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedElectionId, setSelectedElectionId] = useState("")
  const [elections, setElections] = useState<
    Array<{ electionId: string; name: string }>
  >([])
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    loadElections()
  }, [])

  async function loadElections() {
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

  async function handleSubmit() {
    if (!formRef.current) return

    if (!selectedElectionId) {
      toast.error("Por favor seleccione una elección")
      return
    }

    const formData = new FormData(formRef.current)
    formData.set("electionId", selectedElectionId)

    setIsLoading(true)

    try {
      const result = await createCandidateAction(formData)

      if (result.success) {
        toast.success(result.message)
        formRef.current?.reset()
        setSelectedElectionId("")
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
          <UserPlus className="h-5 w-5" />
          Información del Candidato
        </CardTitle>
        <CardDescription>
          Todos los campos son obligatorios. El nombre debe ser único dentro de
          la elección seleccionada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="electionId">Elección</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={isLoading || isLoadingElections}
                >
                  {isLoadingElections ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando elecciones...
                    </>
                  ) : selectedElectionId ? (
                    elections.find((e) => e.electionId === selectedElectionId)
                      ?.name
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
                    <CommandEmpty>No se encontró ninguna elección.</CommandEmpty>
                    <CommandGroup>
                      {elections.map((election) => (
                        <CommandItem
                          key={election.electionId}
                          value={election.name}
                          onSelect={() => {
                            setSelectedElectionId(
                              election.electionId === selectedElectionId
                                ? ""
                                : election.electionId
                            )
                            setOpen(false)
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
            <input
              type="hidden"
              name="electionId"
              value={selectedElectionId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Candidato</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ej: Juan Pérez González"
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="party">Agrupación/Partido</Label>
            <Input
              id="party"
              name="party"
              type="text"
              placeholder="Ej: Partido Liberación Nacional"
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              disabled={isLoading || isLoadingElections}
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
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Candidato
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => {
                formRef.current?.reset()
                setSelectedElectionId("")
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