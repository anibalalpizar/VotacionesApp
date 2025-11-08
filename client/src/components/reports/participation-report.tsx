"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Label, Pie, PieChart, Cell } from "recharts"
import {
  getParticipationReportAction,
  type ParticipationReportDto,
} from "@/lib/actions"

export function ParticipationReport({ electionId }: { electionId: string }) {
  const [report, setReport] = useState<ParticipationReportDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      setLoading(true)
      setError(null)

      const result = await getParticipationReportAction(electionId)

      if (!result.success) {
        setError(result.message)
        setLoading(false)
        return
      }

      setReport(result.data!)
      setLoading(false)
    }

    loadReport()
  }, [electionId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!report) {
    return (
      <Alert>
        <AlertDescription>
          No hay datos de participación disponibles.
        </AlertDescription>
      </Alert>
    )
  }

  const chartData = [
    {
      name: "Votaron",
      value: report.totalVoted,
      fill: "hsl(var(--chart-1))",
    },
    {
      name: "No Participaron",
      value: report.notParticipated,
      fill: "hsl(var(--chart-2))",
    },
  ]

  const chartConfig = {
    value: {
      label: "Votantes",
    },
    voted: {
      label: "Votaron",
      color: "hsl(var(--chart-1))",
    },
    notVoted: {
      label: "No Participaron",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold tracking-tight">
            {report.electionName}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Reporte de participación electoral
          {report.endDateUtc &&
            ` • Cerró el ${new Date(report.endDateUtc).toLocaleDateString()}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Votantes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.totalVoters.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Votantes registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votaron</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {report.totalVoted.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {report.participationPercent}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              No Participaron
            </CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {report.notParticipated.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {report.nonParticipationPercent}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Participación
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {report.participationPercent}%
            </div>
            <p className="text-xs text-muted-foreground">
              Porcentaje de participación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Participation Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Distribución de Participación</CardTitle>
            <CardDescription>
              Votantes que participaron vs no participaron
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                  stroke="hsl(var(--background))"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0 ? "hsl(142 76% 36%)" : "hsl(25 95% 53%)"
                      }
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {report.participationPercent}%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-sm"
                            >
                              Participación
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">
                  Votaron ({report.totalVoted.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-muted-foreground">
                  No Participaron ({report.notParticipated.toLocaleString()})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Election Details */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Detalles de la Elección</CardTitle>
            <CardDescription>
              Información general del proceso electoral
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Fecha de Inicio</p>
                  <p className="text-sm text-muted-foreground">
                    {report.startDateUtc
                      ? new Date(report.startDateUtc).toLocaleString()
                      : "No especificada"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Fecha de Cierre</p>
                  <p className="text-sm text-muted-foreground">
                    {report.endDateUtc
                      ? new Date(report.endDateUtc).toLocaleString()
                      : "No especificada"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="text-sm font-semibold">Resumen Estadístico</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total de votantes:
                  </span>
                  <span className="font-medium">
                    {report.totalVoters.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Votos emitidos:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {report.totalVoted.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    No participaron:
                  </span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {report.notParticipated.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {report.isClosed && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Elección finalizada con éxito.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
