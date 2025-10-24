"use server"

import { getAuthToken } from "../auth"

export interface CandidateListItemDto {
  candidateId: number
  name: string
  party: string
}

export interface GetActiveCandidatesResponse {
  electionId: number
  electionName: string
  hasVoted: boolean
  canVote: boolean
  notice: string | null
  candidates: CandidateListItemDto[]
}

export async function getActiveCandidatesAction() {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "No tienes autorización. Inicia sesión para ver los candidatos.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/public/candidates/active`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al obtener la lista de candidatos."

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

    const result: GetActiveCandidatesResponse[] = await response.json()

    if (!result || result.length === 0) {
      return {
        success: false,
        message: "No hay elecciones activas en este momento.",
      }
    }

    return {
      success: true,
      message: "Elecciones cargadas exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}
