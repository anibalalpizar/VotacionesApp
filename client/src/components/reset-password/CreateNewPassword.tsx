"use client"

import { Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Alert, AlertDescription } from "../ui/alert"
import { useState } from "react"
import StepIndicator from "./StepIndicator"
import { ThemeToggle } from "@/components/theme-toggle"
import { changePasswordAction } from "@/lib/actions"

function CreateNewPassword({
  onNext,
  temporalPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
}: {
  onNext: () => void
  temporalPassword: string
  newPassword: string
  setNewPassword: (password: string) => void
  confirmPassword: string
  setConfirmPassword: (password: string) => void
}) {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("temporalPassword", temporalPassword)
      formData.append("newPassword", newPassword)

      const result = await changePasswordAction(formData)

      if (result.success) {
        onNext()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Error al cambiar la contraseña. Intente nuevamente.")
      console.error("[v0] Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 " />
        </div>
        <h1 className="text-2xl font-bold">Crear Nueva Contraseña</h1>
        <p className="mt-2">
          Establece una nueva contraseña segura para tu cuenta
        </p>
      </div>

      <StepIndicator currentStep={2} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva Contraseña</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showNewPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs text-zinc-500">
            Debe tener al menos 8 caracteres con mayúsculas, minúsculas, números
            y caracteres especiales
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <Button
        onClick={handleResetPassword}
        disabled={
          !newPassword ||
          !confirmPassword ||
          newPassword !== confirmPassword ||
          isLoading
        }
        className="w-full"
      >
        {isLoading ? "Cambiando contraseña..." : "Cambiar Contraseña"}
      </Button>

      <div className="flex items-center justify-center gap-1 text-sm">
        <span>¿Cambiar tema?</span>
        <ThemeToggle />
      </div>
    </div>
  )
}

export default CreateNewPassword
