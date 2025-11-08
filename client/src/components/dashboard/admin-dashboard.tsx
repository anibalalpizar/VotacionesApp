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
import { Check, ChevronsUpDown, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getClosedElectionsAction } from "@/lib/actions"
import { ParticipationReportContent } from "@/components/reports/participation-report-content"

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando elecciones cerradas...</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive">{error}</div>
  }

  if (elections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hay elecciones cerradas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No hay elecciones cerradas disponibles para mostrar reportes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {selectedElectionId ? (
        <>
          {/* Header with Election Selector when election is selected */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold tracking-tight">
                  {selectedElection.name}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Reporte de participación electoral • Cerró el{" "}
                {new Date(selectedElection.endDateUtc).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[300px] justify-between"
                  >
                    {selectedElection.name}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
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
          </div>

          {/* Report Content */}
          <ParticipationReportContent electionId={selectedElectionId} />
        </>
      ) : (
        /* Initial state - just show selector */
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Elección</CardTitle>
            <p className="text-sm text-muted-foreground">
              Seleccione una elección cerrada para ver su reporte de
              participación
            </p>
          </CardHeader>
          <CardContent>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  Seleccionar elección...
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
                            setSelectedElectionId(election.electionId)
                            setOpen(false)
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{election.name}</span>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
