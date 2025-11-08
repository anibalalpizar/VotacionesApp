"use server"

import { getAuthToken } from "../auth"

export interface ParticipationReportDto {
  electionId: number
  electionName: string
  totalVoters: number
  totalVoted: number
  notParticipated: number
  participationPercent: number
  nonParticipationPercent: number
  startDateUtc: string | null
  endDateUtc: string | null
  isClosed: boolean
}

export async function getParticipationReportAction(electionId: string) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "No tienes autorización. Inicia sesión para ver el reporte.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/elections/${electionId}/participation`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al obtener el reporte de participación."

      try {
        const errorData = await response.json()

        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.title) {
          errorMessage = errorData.title
        }
      } catch (parseError) {
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = errorText
          }
        } catch {}
      }

      return {
        success: false,
        message: errorMessage,
      }
    }

    const result: ParticipationReportDto = await response.json()

    if (!result) {
      return {
        success: false,
        message: "No se encontraron datos de participación para esta elección.",
      }
    }

    return {
      success: true,
      message: "Reporte cargado exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}
