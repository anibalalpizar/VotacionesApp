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

  if (!identification || identification.trim() === "") {
    return {
      success: false,
      message: "La identificación es requerida.",
    }
  }

  if (!fullName || fullName.trim() === "") {
    return {
      success: false,
      message: "El nombre completo es requerido.",
    }
  }

  if (!email || email.trim() === "") {
    return {
      success: false,
      message: "El correo electrónico es requerido.",
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return {
      success: false,
      message: "El correo electrónico no tiene un formato válido.",
    }
  }

  const voterData: VoterRegistrationRequest = {
    identification: identification.trim(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

      console.log("API_BASE_URL:", API_BASE_URL);

    const response = await fetch(`${API_BASE_URL}/api/Voters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(voterData),
    })

    console.log("STATUS:", response.status)
    console.log("STATUS TEXT:", response.statusText)
    const rawText = await response.text()
    console.log("RAW RESPONSE TEXT:", rawText)

    if (!response.ok) {
      let errorMessage = "Error al registrar el votante. Intente nuevamente."

      try {
        const errorData = await response.json()

        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.title) {
          errorMessage = errorData.title
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

    const result: VoterRegistrationResponse = await response.json()

    return {
      success: true,
      message:
        "Votante registrado exitosamente. Se ha enviado una contraseña temporal por correo.",
      data: result,
    }
  } catch (error) {
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

    if (!response.ok) {
      let errorMessage = "Error al obtener la lista de votantes."

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

    const result: GetAllVotersResponse = await response.json()

    return {
      success: true,
      message: "Votantes cargados exitosamente",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function getVoterByIdAction(voterId: number) {
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

    const result: VoterDetailsResponse = await response.json()

    return {
      success: true,
      message: "Detalles del votante obtenidos exitosamente",
      data: result,
    }
  } catch (error) {
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
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para editar votantes. Inicia sesión como administrador.",
    }
  }

  if (!data.identification || data.identification.trim() === "") {
    return {
      success: false,
      message: "La identificación es requerida.",
    }
  }

  if (!data.fullName || data.fullName.trim() === "") {
    return {
      success: false,
      message: "El nombre completo es requerido.",
    }
  }

  if (!data.email || data.email.trim() === "") {
    return {
      success: false,
      message: "El correo electrónico es requerido.",
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email.trim())) {
    return {
      success: false,
      message: "El correo electrónico no tiene un formato válido.",
    }
  }

  const updateData: UpdateVoterRequest = {
    identification: data.identification.trim(),
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
  }

  try {
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

    if (!response.ok) {
      let errorMessage = "Error al actualizar el votante. Intente nuevamente."

      try {
        const errorData = await response.json()

        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.title) {
          errorMessage = errorData.title
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

    const result = await response.json()

    return {
      success: true,
      message: result.message || "El usuario se ha editado con éxito.",
      data: result.user,
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}

export async function deleteVoterAction(voterId: number) {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message:
        "No tienes autorización para eliminar votantes. Inicia sesión como administrador.",
    }
  }

  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:7290"

    const response = await fetch(`${API_BASE_URL}/api/Voters/${voterId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = "Error al eliminar el votante. Intente nuevamente."

      if (response.status === 404) {
        errorMessage = "Votante no encontrado."
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
      message: "Votante eliminado exitosamente.",
    }
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Verifique su conexión a internet.",
    }
  }
}
