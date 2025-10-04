"use client"

import CreateNewPassword from "@/components/reset-password/CreateNewPassword"
import PasswordResetSuccess from "@/components/reset-password/PasswordResetSuccess"
import VerifyResetCode from "@/components/reset-password/VerifyResetCode"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

function ResetPasswordPage() {
  const [step, setStep] = useState(1)
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <Card className="w-full max-w-md ">
        <CardContent className="pt-6">
          {step === 1 && (
            <VerifyResetCode
              onNext={() => setStep(2)}
              resetCode={resetCode}
              setResetCode={setResetCode}
            />
          )}
          
          {step === 2 && (
            <CreateNewPassword
              onNext={() => setStep(3)}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              temporalPassword={resetCode}
            />
          )}
          
          {step === 3 && <PasswordResetSuccess />}
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPasswordPage