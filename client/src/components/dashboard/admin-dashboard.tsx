"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getClosedElectionsAction } from "@/lib/actions"
import { ParticipationReport } from "@/components/reports/participation-report"

interface Election {
  electionId: string
  name: string
  startDateUtc: string
  endDateUtc: string
  status: string
  candidateCount: number
  voteCount: number
}

export function AdminDashboard() {
  const [open, setOpen] = useState(false)
  const [selectedElectionId, setSelectedElectionId] = useState("")
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadClosedElections() {
      try {
        setLoading(true)
        const result = await getClosedElectionsAction()
        console.log("Closed Elections Result:", result)

        if (result.success && result.data) {
          setElections(result.data.items)
        } else {
          setError(result.message || "Error al cargar las elecciones")
        }
      } catch (err) {
        setError("Error al cargar las elecciones cerradas")
      } finally {
        setLoading(false)
      }
    }

    loadClosedElections()
  }, [])

  const selectedElection = elections.find(
    (election) => election.electionId === selectedElectionId
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Elección Cerrada</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando elecciones cerradas...</span>
            </div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : elections.length === 0 ? (
            <div className="text-muted-foreground">
              No hay elecciones cerradas disponibles
            </div>
          ) : (
            <div className="space-y-4">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedElection
                      ? selectedElection.name
                      : "Seleccionar elección..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
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
                              setSelectedElectionId(
                                election.electionId === selectedElectionId
                                  ? ""
                                  : election.electionId
                              )
                              setOpen(false)
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {election.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {election.candidateCount} candidatos •{" "}
                                {election.voteCount} votos
                              </span>
                            </div>
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
          )}
        </CardContent>
      </Card>

      {/* Participation Report */}
      {selectedElectionId && (
        <ParticipationReport electionId={selectedElectionId} />
      )}
    </div>
  )
}
