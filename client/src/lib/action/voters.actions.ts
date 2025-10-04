"use server"

export interface VoterRegistrationRequest {
  identification: string
  fullName: string
  email: string
}

export interface VoterRegistrationResponse {
  userId: number
  identification: string
  fullName: string
  email: string
  role: string
}

export interface GetAllVotersResponse {
  page: number
  pageSize: number
  total: number
  items: Array<{
    userId: number
    identification: string
    fullName: string
    email: string
    role: string
    createdAt: string
  }>
}

export interface VoterDetailsResponse {
  userId: number
  identification: string
  fullName: string
  email: string
  role: string
  createdAt: string
}

export interface UpdateVoterRequest {
  identification: string
  fullName: string
  email: string
  role: string
}

export interface UpdateVoterResponse {
  userId: number
  identification: string
  fullName: string
  email: string
  role: string
  updatedAt: string
}

import { getAuthToken } from "../auth"

export async function registerVoterAction(formData: FormData) {
  console.log(
    "[v0] registerVoterAction called with formData:",
    Object.fromEntries(formData)
  )

  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para registrar votantes. Inicia sesión como administrador.",
    }
  }

  const identification = formData.get("identification") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string

  const voterData: VoterRegistrationRequest = {
    identification,
    fullName,
    email,
  }

  try {
    console.log("[v0] Sending voter registration request:", voterData)

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Voters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(voterData),
    })

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      let errorMessage = "Error al registrar el votante. Intente nuevamente."

      try {
        const errorData = await response.json()
        console.log("[v0] API error response:", errorData)

        // Extraer el mensaje de error del backend
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.title) {
          errorMessage = errorData.title
        }
      } catch (parseError) {
        // Si no se puede parsear como JSON, intentar leer como texto
        try {
          const errorText = await response.text()
          console.log("[v0] API error text:", errorText)
          if (errorText) {
            errorMessage = errorText
          }
        } catch {
          // Usar mensaje por defecto si no se puede leer la respuesta
        }
      }

      return {
        success: false,
        message: errorMessage,
      }
    }

    const result: VoterRegistrationResponse = await response.json()
    console.log("[v0] Voter registration successful:", result)

    return {
      success: true,
      message:
        "Votante registrado exitosamente. Se ha enviado una contraseña temporal por correo.",
      data: result,
    }
  } catch (error) {
    console.error("[v0] Network error during voter registration:", error)
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getAllVotersAction(
  page: number = 1,
  pageSize: number = 20
) {
  console.log(
    "[v0] getAllVotersAction called with page:",
    page,
    "pageSize:",
    pageSize
  )

  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para ver votantes. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(
      `${API_BASE_URL}/api/Voters?page=${page}&pageSize=${pageSize}`,
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
      let errorMessage = "Error al obtener la lista de votantes."

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

    const result: GetAllVotersResponse = await response.json()
    console.log("[v0] Voters fetched successfully:", result)

    return {
      success: true,
      message: "Votantes cargados exitosamente",
      data: result,
    }
  } catch (error) {
    console.error("[v0] Network error during voters fetch:", error)
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getVoterByIdAction(voterId: number) {
  console.log("[v0] getVoterByIdAction called with voterId:", voterId)

  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para ver votantes. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Voters/${voterId}`, {
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
          message: "Votante no encontrado.",
        }
      }

      let errorMessage = "Error al obtener los detalles del votante."

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

    const result: VoterDetailsResponse = await response.json()
    console.log("[v0] Voter details fetched successfully:", result)

    return {
      success: true,
      message: "Detalles del votante obtenidos exitosamente",
      data: result,
    }
  } catch (error) {
    console.error("[v0] Network error during voter fetch:", error)
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function updateVoterAction(
  voterId: number,
  data: {
    identification: string
    fullName: string
    email: string
    role: string
  }
) {
  console.log(
    "[v0] updateVoterAction called with voterId:",
    voterId,
    "data:",
    data
  )

  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para editar votantes. Inicia sesión como administrador.",
    }
  }

  const updateData: UpdateVoterRequest = {
    identification: data.identification.trim(),
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
  }

  try {
    console.log("[v0] Sending voter update request:", updateData)

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Voters/${voterId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    })

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      let errorMessage = "Error al actualizar el votante. Intente nuevamente."

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

    const result = await response.json()
    console.log("[v0] Voter update successful:", result)

    return {
      success: true,
      message: result.message || "El usuario se ha editado con éxito.",
      data: result.user,
    }
  } catch (error) {
    console.error("[v0] Network error during voter update:", error)
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function deleteVoterAction(voterId: number) {
  console.log("[v0] deleteVoterAction called with voterId:", voterId)

  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para eliminar votantes. Inicia sesión como administrador.",
    }
  }

  try {
    console.log("[v0] Sending voter delete request for voterId:", voterId)

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Voters/${voterId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      let errorMessage = "Error al eliminar el votante. Intente nuevamente."

      if (response.status === 404) {
        errorMessage = "Votante no encontrado."
      } else {
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
      }

      return {
        success: false,
        message: errorMessage,
      }
    }

    console.log("[v0] Voter deletion successful")

    return {
      success: true,
      message: "Votante eliminado exitosamente.",
    }
  } catch (error) {
    console.error("[v0] Network error during voter deletion:", error)
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}
