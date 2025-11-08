"use server"

import { getAuthToken } from "../auth"

export interface CreateElectionRequest {
  name: string
  startDateUtc: string
  endDateUtc: string
}

export interface CreateElectionResponse {
  electionId: string
  name: string
  startDateUtc: string
  endDateUtc: string
  status: string
  candidateCount: number
  voteCount: number
}

export interface GetAllElectionsResponse {
  page: number
  pageSize: number
  total: number
  items: Array<{
    electionId: string
    name: string
    startDateUtc: string
    endDateUtc: string
    status: string
    candidateCount: number
    voteCount: number
  }>
}

export interface UpdateElectionRequest {
  name: string
  startDateUtc: string
  endDateUtc: string
  status?: string
}

export interface UpdateElectionResponse {
  electionId: string
  name: string
  startDateUtc: string
  endDateUtc: string
  status: string
  candidateCount: number
  voteCount: number
}

export interface ElectionResultItemDto {
  candidateId: number
  name: string
  party: string
  votes: number
}

export interface ElectionResultDto {
  electionId: number
  electionName: string
  startDateUtc: string | null
  endDateUtc: string | null
  isClosed: boolean
  totalVotes: number
  totalCandidates: number
  items: ElectionResultItemDto[]
}

export async function createElectionAction(formData: FormData) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para crear elecciones. Inicia sesión como administrador.",
    }
  }

  const name = formData.get("name") as string
  const startDate = formData.get("startDate") as string
  const startTime = formData.get("startTime") as string
  const endDate = formData.get("endDate") as string
  const endTime = formData.get("endTime") as string

  // Construir fechas en formato ISO UTC
  const startDateUtc = new Date(
    `${startDate}T${startTime}:00.000Z`
  ).toISOString()
  const endDateUtc = new Date(`${endDate}T${endTime}:00.000Z`).toISOString()

  const electionData: CreateElectionRequest = {
    name: name.trim(),
    startDateUtc,
    endDateUtc,
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Elections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(electionData),
    })

    if (!response.ok) {
      let errorMessage = "Error al crear la elección. Intente nuevamente."

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

    const result: CreateElectionResponse = await response.json()

    return {
      success: true,
      message: "Elección creada exitosamente.",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getAllElectionsAction(
  page: number = 1,
  pageSize: number = 20
) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para ver elecciones. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/Elections?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al obtener la lista de elecciones."

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

    const result: GetAllElectionsResponse = await response.json()

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

export async function getElectionByIdAction(electionId: string) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para ver elecciones. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/Elections/${electionId}`,
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
          message: "Elección no encontrada.",
        }
      }

      let errorMessage = "Error al obtener los detalles de la elección."

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

    const result = await response.json()

    return {
      success: true,
      message: "Detalles de la elección obtenidos exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function updateElectionAction(
  electionId: string,
  data: {
    name: string
    startDateUtc: string
    endDateUtc: string
  }
) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para editar elecciones. Inicia sesión como administrador.",
    }
  }

  const updateData: UpdateElectionRequest = {
    name: data.name.trim(),
    startDateUtc: data.startDateUtc,
    endDateUtc: data.endDateUtc,
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/Elections/${electionId}`,
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
      let errorMessage = "Error al actualizar la elección. Intente nuevamente."

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

    const result: UpdateElectionResponse = await response.json()

    return {
      success: true,
      message: "Elección actualizada exitosamente.",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function deleteElectionAction(electionId: string) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para eliminar elecciones. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/Elections/${electionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al eliminar la elección. Intente nuevamente."

      if (response.status === 404) {
        errorMessage = "Elección no encontrada."
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
      message: "Elección eliminada exitosamente.",
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getElectionResultsAction(electionId: string) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para ver resultados. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/elections/${electionId}/results`,
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
          message: "La elección no existe.",
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message:
            "Los resultados solo pueden consultarse cuando la elección esté cerrada.",
        }
      }

      let errorMessage = "Error al obtener los resultados de la elección."

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

    const result: ElectionResultDto = await response.json()

    return {
      success: true,
      message: "Resultados obtenidos exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getClosedElectionsAction(
  page: number = 1,
  pageSize: number = 20
) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para ver elecciones. Inicia sesión como administrador.",
    }
  }

  try {
    const result = await getAllElectionsAction(page, pageSize)

    if (!result.success || !result.data) {
      return result
    }

    const now = new Date()
    const closedElections = result.data.items.filter((election) => {
      const endDate = new Date(election.endDateUtc)
      return endDate < now
    })

    return {
      success: true,
      message: "Elecciones cerradas cargadas exitosamente",
      data: {
        page: result.data.page,
        pageSize: result.data.pageSize,
        total: closedElections.length,
        items: closedElections,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: "Error al obtener las elecciones cerradas.",
    }
  }
}
