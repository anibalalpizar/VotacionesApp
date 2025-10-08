import { CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"
import { Button } from "../ui/button"
import StepIndicator from "./StepIndicator"
import { ThemeToggle } from "../theme-toggle"
import { logoutAction } from "@/lib/actions"

function PasswordResetSuccess() {
  const handleLogout = async () => {
    try {
      await logoutAction()
    } catch (error) {
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">Contraseña Actualizada</h1>
        <p>Tu contraseña ha sido restablecida con éxito</p>
      </div>

      <StepIndicator currentStep={3} />

      <Alert>
        <AlertDescription className="text-sm">
          Tu contraseña ha sido restablecida con éxito. Tu cuenta ahora está
          segura.
        </AlertDescription>
      </Alert>

      <Button onClick={handleLogout} className="w-full">
        Iniciar sesión con la nueva contraseña
      </Button>

      <div className="flex items-center justify-center gap-1 text-sm">
        <span>¿Cambiar tema?</span>
        <ThemeToggle />
      </div>
    </div>
  )
}

export default PasswordResetSuccess
