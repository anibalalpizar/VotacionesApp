"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Users,
  Vote,
  Calendar,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  PieChartIcon,
} from "lucide-react"
import { toast } from "sonner"
import { getElectionResultsAction, type ElectionResultDto } from "@/lib/actions"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { LabelList as PieLabelList, Pie, PieChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

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

export function ElectionResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const electionId = searchParams.get("electionId")

  const [results, setResults] = useState<ElectionResultDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"bars" | "pie">("bars")

  useEffect(() => {
    if (electionId) {
      loadResults()
    } else {
      setError("No se especificó el ID de la elección")
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId])

  async function loadResults() {
    if (!electionId) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await getElectionResultsAction(electionId)

      if (result.success && result.data) {
        setResults(result.data)
      } else {
        setError(result.message || "Error al cargar los resultados")
        toast.error(result.message || "Error al cargar los resultados")
      }
    } catch (error) {
      setError("Error de conexión al cargar los resultados")
      toast.error("Error de conexión al cargar los resultados")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/dashboard/elections")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Elecciones
        </Button>
      </div>
    )
  }

  if (!results) {
    return null
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const topVotes = results.items[0]?.votes || 0
  const winnersCount = results.items.filter((c) => c.votes === topVotes).length
  const hastie = winnersCount > 1 && topVotes > 0
  const winner = results.items[0]

  const chartConfig = results.items.reduce((config, candidate, index) => {
    const chartColorIndex = (index % 5) + 1
    const sanitizedKey = `candidate_${candidate.candidateId}`
    config[sanitizedKey] = {
      label: candidate.name,
      color: `var(--chart-${chartColorIndex})`,
    }
    return config
  }, {} as ChartConfig)

  const barChartData = results.items.map((candidate, index) => {
    const sanitizedKey = `candidate_${candidate.candidateId}`
    return {
      name: candidate.name,
      votes: candidate.votes,
      fill: `var(--color-${sanitizedKey})`,
    }
  })

  const pieChartData = results.items.map((candidate, index) => {
    const sanitizedKey = `candidate_${candidate.candidateId}`
    return {
      candidate: candidate.name,
      votes: candidate.votes,
      fill: `var(--color-${sanitizedKey})`,
    }
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/elections")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Elecciones
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Resultados Oficiales
            </h1>
            <p className="text-muted-foreground mt-2">{results.electionName}</p>
          </div>
          <Badge
            variant="outline"
            className="h-fit px-4 py-2 text-sm bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Elección Cerrada
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(results.startDateUtc)} -{" "}
              {formatDate(results.endDateUtc)}
            </span>
          </div>
        </div>
      </div>

      {!hastie ? (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Candidato Ganador</CardTitle>
                <CardDescription>Con la mayoría de votos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {winner.name}
                </h3>
                <Badge
                  variant="outline"
                  className={`${getPartyColor(winner.party)} text-sm mt-2`}
                >
                  {winner.party}
                </Badge>
              </div>
              <div className="flex items-baseline gap-4">
                <div className="text-5xl font-bold text-primary">
                  {results.totalVotes > 0
                    ? ((winner.votes / results.totalVotes) * 100).toFixed(2)
                    : "0.00"}
                  %
                </div>
                <div className="text-2xl text-muted-foreground">
                  {winner.votes.toLocaleString()} votos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">Empate Técnico</CardTitle>
                <CardDescription>
                  Múltiples candidatos con el mismo número de votos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-foreground">
                {winnersCount} candidatos empatados con {topVotes} voto
                {topVotes !== 1 ? "s" : ""} cada uno:
              </p>
              <div className="flex flex-wrap gap-2">
                {results.items
                  .filter((c) => c.votes === topVotes)
                  .map((candidate) => (
                    <div
                      key={candidate.candidateId}
                      className="flex items-center gap-2"
                    >
                      <div className="font-semibold text-foreground">
                        {candidate.name}
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getPartyColor(candidate.party)} text-xs`}
                      >
                        {candidate.party}
                      </Badge>
                    </div>
                  ))}
              </div>
              <div className="flex items-baseline gap-4 pt-2">
                <div className="text-5xl font-bold text-amber-600 dark:text-amber-500">
                  {results.totalVotes > 0
                    ? ((topVotes / results.totalVotes) * 100).toFixed(2)
                    : "0.00"}
                  %
                </div>
                <div className="text-2xl text-muted-foreground">
                  {topVotes.toLocaleString()} votos cada uno
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Votos
            </CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {results.totalVotes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Votos emitidos en total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {results.totalCandidates}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Participantes en la elección
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio por Candidato
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {results.totalCandidates > 0
                ? Math.round(
                    results.totalVotes / results.totalCandidates
                  ).toLocaleString()
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Votos promedio recibidos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-xl">Distribución de Votos</CardTitle>
              <CardDescription>
                Visualización de resultados por candidato
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "bars" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("bars")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Barras
              </Button>
              <Button
                variant={viewMode === "pie" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("pie")}
              >
                <PieChartIcon className="w-4 h-4 mr-2" />
                Circular
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "bars" ? (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart
                accessibilityLayer
                data={barChartData}
                layout="vertical"
                margin={{
                  right: 16,
                  left: 16,
                }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 20)}
                  hide
                />
                <XAxis dataKey="votes" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="votes" layout="vertical" radius={4}>
                  <LabelList
                    dataKey="name"
                    position="insideLeft"
                    offset={8}
                    className="fill-primary-foreground"
                    fontSize={12}
                  />
                  <LabelList
                    dataKey="votes"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[400px] [&_.recharts-text]:fill-primary-foreground"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="votes" hideLabel />}
                />
                <Pie data={pieChartData} dataKey="votes">
                  <PieLabelList
                    dataKey="candidate"
                    className="fill-primary-foreground"
                    stroke="none"
                    fontSize={12}
                    formatter={(value: string) => value.slice(0, 15)}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Resultados Detallados</CardTitle>
          <CardDescription>
            Desglose completo de votos por candidato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {results.items.map((candidate, index) => {
              const percentage =
                results.totalVotes > 0
                  ? ((candidate.votes / results.totalVotes) * 100).toFixed(2)
                  : "0.00"

              const isWinner = index === 0
              const isSecond = index === 1
              const isThird = index === 2

              return (
                <div
                  key={candidate.candidateId}
                  className={`p-4 rounded-lg border transition-all ${
                    isWinner && !hastie
                      ? "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
                      : isWinner && hastie
                      ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                      : isSecond && !hastie
                      ? "bg-gray-50/50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
                      : isThird && !hastie
                      ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                            isWinner && !hastie
                              ? "bg-yellow-500 text-white"
                              : isWinner && hastie
                              ? "bg-amber-500 text-white"
                              : isSecond && !hastie
                              ? "bg-gray-400 text-white"
                              : isThird && !hastie
                              ? "bg-amber-600 text-white"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {isWinner && !hastie ? "🏆" : index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-foreground">
                            {candidate.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={`${getPartyColor(
                              candidate.party
                            )} text-xs mt-1`}
                          >
                            {candidate.party}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-foreground">
                          {percentage}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {candidate.votes.toLocaleString()} votos
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={Number.parseFloat(percentage)}
                      className="h-3"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {results.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No hay resultados disponibles para esta elección.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Resultados Oficiales Certificados
              </p>
              <p className="text-sm text-muted-foreground">
                Estos resultados han sido verificados y certificados por la
                autoridad electoral. La elección se cerró el{" "}
                {formatDate(results.endDateUtc)} con un total de{" "}
                {results.totalVotes.toLocaleString()} votos válidos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
