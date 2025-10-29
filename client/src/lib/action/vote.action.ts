"use server"

import { getAuthToken } from "../auth"

export interface CastVoteRequest {
  electionId: number
  candidateId: number
}

export interface CastVoteResponse {
  message: string
  electionId: number
  electionName: string
  candidateId: number
  candidateName: string
  votedAt: string
}

export async function castVoteAction(data: CastVoteRequest) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "No tienes autorización para votar. Inicia sesión como votante.",
    }
  }

  if (!data.electionId || data.electionId <= 0) {
    return {
      success: false,
      message: "El ID de la elección es inválido.",
    }
  }

  if (!data.candidateId || data.candidateId <= 0) {
    return {
      success: false,
      message: "El ID del candidato es inválido.",
    }
  }

  const voteData = {
    electionId: data.electionId,
    candidateId: data.candidateId,
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Votes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(voteData),
    })

    if (!response.ok) {
      let errorMessage = "Error al registrar el voto. Intente nuevamente."

      if (response.status === 401) {
        return {
          success: false,
          message: "No estás autorizado para votar. Por favor, inicia sesión.",
        }
      }

      if (response.status === 404) {
        return {
          success: false,
          message: "La elección o el candidato no existen.",
        }
      }

      if (response.status === 409) {
        return {
          success: false,
          message: "Ya has emitido tu voto en esta elección.",
        }
      }

      try {
        const errorData = await response.json()

        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.title) {
          errorMessage = errorData.title
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.errors) {
          const errors = Object.values(errorData.errors).flat()
          errorMessage = errors.join(", ")
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

    const result: CastVoteResponse = await response.json()

    return {
      success: true,
      message: result.message || "Voto registrado exitosamente.",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}
