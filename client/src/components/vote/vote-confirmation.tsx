"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Vote,
  ShieldCheck,
  PartyPopper,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VoteConfirmationSkeleton } from "./vote-confirmation-skeleton"
import { castVoteAction } from "@/lib/actions"
import { toast } from "sonner"

// Types
interface Candidate {
  candidateId: number
  name: string
  party: string
  electionId: number
  electionName: string
}

// Generate consistent colors for parties
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

export function VoteConfirmation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const candidateId = searchParams.get("candidateId")

  const [showReconfirmDialog, setShowReconfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voteSubmitted, setVoteSubmitted] = useState(false)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCandidateData()
  }, [candidateId])

  async function loadCandidateData() {
    if (!candidateId) {
      setError("No se especificó un candidato")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Importar la función de manera dinámica para evitar problemas
      const { getActiveCandidatesAction } = await import("@/lib/actions")
      const result = await getActiveCandidatesAction()

      if (result.success && result.data) {
        const elections = Array.isArray(result.data)
          ? result.data
          : [result.data]

        // Buscar el candidato en todas las elecciones
        let foundCandidate: Candidate | null = null

        for (const election of elections) {
          const found = election.candidates.find(
            (c) => c.candidateId === Number(candidateId)
          )

          if (found) {
            foundCandidate = {
              ...found,
              electionId: election.electionId,
              electionName: election.electionName,
            }
            break
          }
        }

        if (foundCandidate) {
          setCandidate(foundCandidate)
        } else {
          setError("No se encontró el candidato seleccionado")
        }
      } else {
        setError(result.message || "Error al cargar información del candidato")
      }
    } catch (err) {
      setError("Error de conexión al cargar información del candidato")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitVote = async () => {
    if (!candidate) return

    setIsSubmitting(true)

    try {
      const result = await castVoteAction({
        electionId: candidate.electionId,
        candidateId: candidate.candidateId,
      })

      if (result.success) {
        toast.success(result.message || "Voto registrado exitosamente")
        setShowReconfirmDialog(false)
        setVoteSubmitted(true)
      } else {
        toast.error(result.message || "Error al registrar el voto")

        if (result.message?.includes("Ya has emitido tu voto")) {
          setShowReconfirmDialog(false)
          setTimeout(() => {
            router.push("/dashboard/vote")
          }, 2000)
        }
      }
    } catch (error) {
      console.error("Error submitting vote:", error)
      toast.error("Error de conexión al registrar el voto")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return <VoteConfirmationSkeleton />
  }

  // Error state
  if (error || !candidate) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error ||
              "No se encontró el candidato seleccionado. Por favor, regresa y selecciona nuevamente."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/dashboard/vote")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
      </div>
    )
  }

  // Success state after vote is submitted
  if (voteSubmitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center animate-in fade-in zoom-in-50 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <PartyPopper className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            ¡Voto Registrado Exitosamente!
          </h1>

          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Tu voto ha sido registrado de forma segura y anónima. Gracias por
            participar en el proceso democrático.
          </p>

          <Card className="p-6 mb-8 bg-muted/50">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">
                Detalles de tu voto
              </p>
            </div>
            <div className="text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidato:</span>
                <span className="font-medium text-foreground">
                  {candidate.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agrupación:</span>
                <Badge
                  variant="outline"
                  className={`${getPartyColor(candidate.party)} text-xs`}
                >
                  {candidate.party}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Elección:</span>
                <span className="font-medium text-foreground">
                  {candidate.electionName}
                </span>
              </div>
            </div>
          </Card>

          <Alert className="mb-6">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              Tu voto ha sido encriptado y almacenado de forma segura. No es
              posible modificarlo una vez registrado.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            className="w-full sm:w-auto"
          >
            Finalizar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/vote")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Vote className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            Confirmación de Voto
          </Badge>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">
          Revisa tu selección
        </h1>
        <p className="text-muted-foreground text-lg">
          Verifica que la información sea correcta antes de confirmar tu voto
        </p>
      </div>

      {/* Important Notice */}
      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Una vez confirmado, tu voto no podrá ser
          modificado. Asegúrate de revisar cuidadosamente tu selección.
        </AlertDescription>
      </Alert>

      {/* Candidate Details Card */}
      <Card className="overflow-hidden mb-8">
        <div className="h-2 w-full bg-primary" />

        <div className="p-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-secondary-foreground font-bold text-2xl flex-shrink-0">
              {candidate.candidateId}
            </div>

            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Has seleccionado a:
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-pretty">
                {candidate.name}
              </h2>
              <Badge
                variant="outline"
                className={`${getPartyColor(
                  candidate.party
                )} font-medium px-3 py-1`}
              >
                {candidate.party}
              </Badge>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Elección:</span>
              <span className="font-medium text-foreground">
                {candidate.electionName}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/dashboard/vote")}
          className="flex-1"
        >
          Cambiar Candidato
        </Button>
        <Button
          size="lg"
          onClick={() => setShowReconfirmDialog(true)}
          className="flex-1"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Confirmar mi Voto
        </Button>
      </div>

      {/* Reconfirmation Dialog */}
      <Dialog open={showReconfirmDialog} onOpenChange={setShowReconfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">
              ¿Confirmar tu voto?
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Estás a punto de emitir tu voto para:
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-4 my-4">
            <p className="font-bold text-lg text-foreground text-center mb-2">
              {candidate.name}
            </p>
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className={`${getPartyColor(candidate.party)} font-medium`}
              >
                {candidate.party}
              </Badge>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Esta acción es irreversible. Tu voto será registrado de forma
              permanente y anónima.
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowReconfirmDialog(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitVote}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Sí, Confirmar Voto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
