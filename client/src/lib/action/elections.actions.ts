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

export async function createElectionAction(formData: FormData) {
  console.log(
    "[v0] createElectionAction called with formData:",
    Object.fromEntries(formData)
  )

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
    console.log("[v0] Sending election creation request:", electionData)

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

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      let errorMessage = "Error al crear la elección. Intente nuevamente."

      try {
        const errorData = await response.json()
        console.log("[v0] API error response:", errorData)

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
          console.log("[v0] API error text:", errorText)
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
    console.log("[v0] Election creation successful:", result)

    return {
      success: true,
      message: "Elección creada exitosamente.",
      data: result,
    }
  } catch (error) {
    console.error("[v0] Network error during election creation:", error)
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
  console.log(
    "[v0] getAllElectionsAction called with page:",
    page,
    "pageSize:",
    pageSize
  )

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

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      let errorMessage = "Error al obtener la lista de elecciones."

      try {
        const errorData = await response.json()
        console.log("[v0] API error response:", errorData)

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
          console.log("[v0] API error text:", errorText)
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
    console.log("[v0] Elections fetched successfully:", result)

    return {
      success: true,
      message: "Elecciones cargadas exitosamente",
      data: result,
    }
  } catch (error) {
    console.error("[v0] Network error during elections fetch:", error)
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getElectionByIdAction(electionId: string) {
  console.log("[v0] getElectionByIdAction called with electionId:", electionId)

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

    const response = await fetch(`${API_BASE_URL}/api/Elections/${electionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    console.log("[v0] API response status:", response.status)

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
        console.log("[v0] API error response:", errorData)

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
          console.log("[v0] API error text:", errorText)
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
    console.log("[v0] Election details fetched successfully:", result)

    return {
      success: true,
      message: "Detalles de la elección obtenidos exitosamente",
      data: result,
    }
  } catch (error) {
    console.error("[v0] Network error during election fetch:", error)
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}