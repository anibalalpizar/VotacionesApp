"use client"

import { ArrowRight, Key, Eye, EyeOff } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { useState } from "react"
import StepIndicator from "./StepIndicator"
import { ThemeToggle } from "../theme-toggle"

function VerifyResetCode({
  onNext,
  resetCode,
  setResetCode,
}: {
  onNext: () => void
  resetCode: string
  setResetCode: (code: string) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleVerifyCode = async () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onNext()
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Key className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">
          Verificar Contraseña Temporal
        </h1>
        <p className="mt-2">
          Ingresa la contraseña temporal que recibiste por correo electrónico
        </p>
      </div>

      <StepIndicator currentStep={1} />

      <div className="space-y-2">
        <Label htmlFor="resetCode">
          Contraseña Temporal
        </Label>
        <div className="relative">
          <Input
            id="resetCode"
            type={showPassword ? "text" : "password"}
            placeholder="Ingresa tu contraseña temporal"
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 "
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-sm">
          Esta es la contraseña temporal que recibiste al crear tu cuenta
        </p>
      </div>

      <Button
        onClick={handleVerifyCode}
        disabled={!resetCode || isLoading}
        className="w-full"
      >
        {isLoading ? "Verificando..." : "Continuar"}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <div className="flex items-center justify-center gap-1 text-sm">
        <span>¿Cambiar tema?</span>
        <ThemeToggle />
      </div>
    </div>
  )
}

export default VerifyResetCode
