"use server"

import { getAuthToken } from "../auth"

export interface AuditLog {
  auditId: number
  timestamp: string
  userId: number
  userName: string
  action: string
  details: string | null
}

export interface AuditLogsResponse {
  page: number
  pageSize: number
  total: number
  items: AuditLog[]
}

export interface UserDto {
  userId: number
  fullName: string
  email: string
}

export async function getAuditLogsAction(
  page: number = 1,
  pageSize: number = 50
) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "No tienes autorización.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/audit-logs?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al obtener los registros de auditoría."

      try {
        const errorData = await response.json()
        errorMessage =
          errorData.message ||
          errorData.error ||
          errorData.title ||
          errorMessage
      } catch {}

      return {
        success: false,
        message: errorMessage,
      }
    }

    const result: AuditLogsResponse = await response.json()

    return {
      success: true,
      message: "Registros cargados exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getAuditLogsByUserAction(userId: number) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "No tienes autorización.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/audit-logs/user/${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al obtener los registros del usuario."

      try {
        const errorData = await response.json()
        errorMessage =
          errorData.message ||
          errorData.error ||
          errorData.title ||
          errorMessage
      } catch {}

      return {
        success: false,
        message: errorMessage,
      }
    }

    const result: AuditLog[] = await response.json()

    return {
      success: true,
      message: "Registros del usuario cargados exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getAuditLogsByActionAction(action: string) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "No tienes autorización.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/audit-logs/by-action?action=${encodeURIComponent(
        action
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      let errorMessage = "Error al obtener los registros de auditoría."

      try {
        const errorData = await response.json()
        errorMessage =
          errorData.message ||
          errorData.error ||
          errorData.title ||
          errorMessage
      } catch {}

      return {
        success: false,
        message: errorMessage,
      }
    }

    const result: AuditLog[] = await response.json()

    return {
      success: true,
      message: "Registros cargados exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getUsersListAction() {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "No tienes autorización.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Auth/simple`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      let errorMessage = "Error al obtener la lista de usuarios."

      try {
        const errorData = await response.json()
        errorMessage =
          errorData.message ||
          errorData.error ||
          errorData.title ||
          errorMessage
      } catch {}

      return {
        success: false,
        message: errorMessage,
      }
    }

    const result: UserDto[] = await response.json()

    return {
      success: true,
      message: "Usuarios cargados exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}
