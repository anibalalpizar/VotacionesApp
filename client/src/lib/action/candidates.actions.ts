"use server"

import { getAuthToken } from "../auth"

export interface CreateCandidateRequest {
  electionId: number
  name: string
  party: string
}

export interface CandidateDto {
  candidateId: number
  electionId: number
  electionName: string
  name: string
  party: string
}

export interface GetAllCandidatesResponse {
  page: number
  pageSize: number
  total: number
  items: CandidateDto[]
}

export interface UpdateCandidateRequest {
  electionId: number
  name: string
  party: string
}

export async function createCandidateAction(formData: FormData) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para crear candidatos. Inicia sesión como administrador.",
    }
  }

  const electionId = formData.get("electionId") as string
  const name = formData.get("name") as string
  const party = formData.get("party") as string

  const candidateData: CreateCandidateRequest = {
    electionId: parseInt(electionId),
    name: name.trim(),
    party: party.trim(),
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Candidates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(candidateData),
    })

    if (!response.ok) {
      let errorMessage = "Error al crear el candidato. Intente nuevamente."

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

    const result: CandidateDto = await response.json()

    return {
      success: true,
      message: "Candidato creado exitosamente.",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getAllCandidatesAction(
  page: number = 1,
  pageSize: number = 20,
  electionId?: number
) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para ver candidatos. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    let url = `${API_BASE_URL}/api/Candidates?page=${page}&pageSize=${pageSize}`
    if (electionId && electionId > 0) {
      url += `&electionId=${electionId}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      let errorMessage = "Error al obtener la lista de candidatos."

      try {
        const errorData = await response.json()

        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
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

    const result: GetAllCandidatesResponse = await response.json()

    return {
      success: true,
      message: "Candidatos cargados exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getCandidateByIdAction(candidateId: number) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para ver candidatos. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/Candidates/${candidateId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: "Candidato no encontrado.",
        }
      }

      let errorMessage = "Error al obtener los detalles del candidato."

      try {
        const errorData = await response.json()

        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
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

    const result: CandidateDto = await response.json()

    return {
      success: true,
      message: "Detalles del candidato obtenidos exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function updateCandidateAction(
  candidateId: number,
  data: {
    electionId: number
    name: string
    party: string
  }
) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para editar candidatos. Inicia sesión como administrador.",
    }
  }

  const updateData: UpdateCandidateRequest = {
    electionId: data.electionId,
    name: data.name.trim(),
    party: data.party.trim(),
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/Candidates/${candidateId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al actualizar el candidato. Intente nuevamente."

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

    const result = await response.json()

    return {
      success: true,
      message: "Candidato actualizado exitosamente.",
      data: result.item,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function deleteCandidateAction(candidateId: number) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para eliminar candidatos. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/Candidates/${candidateId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al eliminar el candidato. Intente nuevamente."

      if (response.status === 404) {
        errorMessage = "Candidato no encontrado."
      } else {
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
      }

      return {
        success: false,
        message: errorMessage,
      }
    }

    return {
      success: true,
      message: "Candidato eliminado exitosamente.",
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}
