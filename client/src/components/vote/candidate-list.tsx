"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Vote, Search, AlertCircle, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getActiveCandidatesAction } from "@/lib/actions"
import { CandidateListSkeleton } from "./candidate-list-skeleton"

interface Candidate {
  candidateId: number
  name: string
  party: string
}

interface ElectionData {
  electionId: number
  electionName: string
  hasVoted: boolean
  canVote: boolean
  notice: string | null
  candidates: Candidate[]
}

const getPartyColor = (party: string) => {
  const colors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-rose-100 text-rose-700 border-rose-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
  ]
  const hash = party
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function CandidateList() {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [electionData, setElectionData] = useState<ElectionData | null>(null)
  const [allElections, setAllElections] = useState<ElectionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showElectionDialog, setShowElectionDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadActiveElections()
  }, [])

  async function loadActiveElections() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getActiveCandidatesAction()

      if (result.success && result.data) {
        const elections = Array.isArray(result.data)
          ? result.data
          : [result.data]

        setAllElections(elections)

        const votableElections = elections.filter((e) => e.canVote)
        const votedElections = elections.filter((e) => e.hasVoted)

        if (votableElections.length === 1) {
          setElectionData(votableElections[0])
          setShowElectionDialog(false)
        } else if (votableElections.length > 1 || allElections.length > 1) {
          setShowElectionDialog(true)
        } else if (votedElections.length > 0) {
          setElectionData(votedElections[0])
          setShowElectionDialog(false)
        } else {
          setError("No hay elecciones activas en este momento.")
        }
      } else {
        setError(result.message || "Error al cargar elecciones")
        toast.error(result.message || "Error al cargar elecciones")
      }
    } catch (error) {
      setError("Error de conexión al cargar elecciones")
      toast.error("Error de conexión al cargar elecciones")
    } finally {
      setIsLoading(false)
    }
  }

  const handleElectionSelect = (election: ElectionData) => {
    setElectionData(election)
    setShowElectionDialog(false)
    setSelectedCandidate(null)
    setSearchQuery("")
  }

  const filteredCandidates =
    electionData?.candidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.party.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  const handleConfirmVote = () => {
    if (selectedCandidate && electionData?.canVote) {
      router.push(`/dashboard/vote/confirm?candidateId=${selectedCandidate}`)
    }
  }

  if (isLoading) {
    return <CandidateListSkeleton showElectionDialog={false} />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadActiveElections} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  const votableElections = allElections.filter((e) => e.canVote)
  const hasMultipleElections = allElections.length > 1
  const hasVotedInAll =
    allElections.length > 0 && allElections.every((e) => e.hasVoted)

  return (
    <>
      {hasVotedInAll ? (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              ¡Gracias por Participar!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Has completado tu participación en{" "}
              {allElections.length === 1
                ? "la elección activa"
                : "todas las elecciones activas"}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-center">
              {allElections.length === 1
                ? "Tu voto ha sido registrado"
                : "Tus votos han sido registrados"}
            </h2>
            {allElections.map((election) => (
              <Card key={election.electionId} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {election.electionName}
                    </h3>
                    {election.notice && (
                      <p className="text-sm text-muted-foreground">
                        {election.notice}
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Candidatos en esta elección:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {election.candidates.map((candidate) => (
                          <Badge
                            key={candidate.candidateId}
                            variant="outline"
                            className="text-xs"
                          >
                            {candidate.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-6 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Información Importante</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Tu voto ha sido registrado de forma segura y anónima
                  </li>
                  <li>
                    • No es posible modificar o eliminar un voto una vez emitido
                  </li>
                  <li>
                    • Los resultados estarán disponibles al finalizar el periodo
                    de votación
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Volver al Inicio
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Dialog
            open={showElectionDialog}
            onOpenChange={setShowElectionDialog}
          >
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Elecciones Activas</DialogTitle>
                <DialogDescription>
                  Selecciona una elección para ver sus candidatos. Las
                  elecciones donde ya votaste se muestran deshabilitadas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {allElections.map((election) => {
                  const isDisabled = election.hasVoted
                  return (
                    <Card
                      key={election.electionId}
                      className={`p-4 transition-all ${
                        isDisabled
                          ? "opacity-60 cursor-not-allowed bg-muted/50"
                          : "cursor-pointer hover:border-primary hover:shadow-md"
                      }`}
                      onClick={() =>
                        !isDisabled && handleElectionSelect(election)
                      }
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {election.electionName}
                            </h3>
                            {isDisabled && (
                              <Badge variant="secondary" className="text-xs">
                                Votaste
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {election.candidates.length} candidato
                            {election.candidates.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {isDisabled ? (
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Vote className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      {isDisabled && election.notice && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          {election.notice}
                        </p>
                      )}
                    </Card>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

          {electionData && (
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
              <div className="mb-8 md:mb-12">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Vote className="h-6 w-6 text-primary" />
                  </div>
                  <Badge
                    variant={electionData.hasVoted ? "secondary" : "default"}
                    className="text-xs font-medium"
                  >
                    {electionData.hasVoted ? "Ya Votaste" : "Elección Activa"}
                  </Badge>
                  {hasMultipleElections && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowElectionDialog(true)}
                      className="ml-auto"
                    >
                      Ver Todas las Elecciones ({allElections.length})
                    </Button>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">
                  {electionData.electionName}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {electionData.hasVoted
                    ? "Ya has emitido tu voto en esta elección"
                    : "Selecciona tu candidato de preferencia para emitir tu voto"}
                </p>
              </div>

              {electionData.hasVoted && electionData.notice && (
                <Alert className="mb-8 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    {electionData.notice}
                  </AlertDescription>
                </Alert>
              )}

              {!electionData.hasVoted && (
                <div className="mb-8">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar candidato o agrupación..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {filteredCandidates.map((candidate) => {
                  const isSelected = selectedCandidate === candidate.candidateId
                  const isDisabled = electionData.hasVoted

                  return (
                    <Card
                      key={candidate.candidateId}
                      className={`relative overflow-hidden transition-all duration-300 ${
                        isDisabled
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:shadow-lg cursor-pointer group"
                      } ${
                        isSelected && !isDisabled
                          ? "ring-2 ring-primary shadow-lg scale-[1.02]"
                          : !isDisabled &&
                            "hover:scale-[1.01] hover:border-primary/50"
                      }`}
                      onClick={() =>
                        !isDisabled &&
                        setSelectedCandidate(candidate.candidateId)
                      }
                    >
                      {isSelected && !isDisabled && (
                        <div className="absolute top-4 right-4 z-10">
                          <div className="bg-primary rounded-full p-1 animate-in zoom-in-50 duration-300">
                            <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                      )}

                      <div
                        className={`h-2 w-full transition-all duration-300 ${
                          isDisabled
                            ? "bg-muted"
                            : isSelected
                            ? "bg-primary"
                            : "bg-muted group-hover:bg-primary/50"
                        }`}
                      />

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-full ${
                              isDisabled
                                ? "bg-muted text-muted-foreground"
                                : "bg-secondary text-secondary-foreground"
                            } font-bold text-lg`}
                          >
                            {candidate.candidateId}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-3 text-pretty leading-tight">
                          {candidate.name}
                        </h3>

                        <div className="mb-4">
                          <Badge
                            variant="outline"
                            className={`${getPartyColor(
                              candidate.party
                            )} font-medium text-xs px-3 py-1`}
                          >
                            {candidate.party}
                          </Badge>
                        </div>

                        {!isDisabled && (
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            className="w-full transition-all duration-300"
                            size="sm"
                          >
                            {isSelected
                              ? "Candidato Seleccionado"
                              : "Seleccionar Candidato"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>

              {filteredCandidates.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No se encontraron candidatos que coincidan con tu búsqueda
                  </p>
                </div>
              )}

              {selectedCandidate && electionData.canVote && (
                <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom-5 duration-300 z-50">
                  <div className="container mx-auto px-4 py-4 max-w-7xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-sm text-muted-foreground mb-1">
                          Has seleccionado a:
                        </p>
                        <p className="font-bold text-lg text-foreground">
                          {
                            electionData.candidates.find(
                              (c) => c.candidateId === selectedCandidate
                            )?.name
                          }
                        </p>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedCandidate(null)}
                          className="flex-1 sm:flex-none"
                        >
                          Cambiar Selección
                        </Button>
                        <Button
                          onClick={handleConfirmVote}
                          className="flex-1 sm:flex-none"
                        >
                          Confirmar Voto
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
