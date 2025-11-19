export const AUDIT_ACTIONS = {
  LoginSuccess: "Login exitoso",
  LoginFailed: "Login fallido",
  PasswordChanged: "Cambio de contraseña",
  PasswordRecovery: "Recuperación de contraseña",

  VoteCast: "Voto emitido",
  VoteAttempt: "Intento de voto",

  ResultsViewed: "Consulta de resultados",
  ElectionViewed: "Consulta de elección",

  ElectionCreated: "Elección creada",
  ElectionUpdated: "Elección actualizada",
  ElectionDeleted: "Elección eliminada",

  CandidateCreated: "Candidato creado",
  CandidateUpdated: "Candidato actualizado",
  CandidateDeleted: "Candidato eliminado",

  UserCreated: "Usuario creado",
  UserUpdated: "Usuario actualizado",
  UserDeleted: "Usuario eliminado",

  AuditViewed: "Consulta de auditoría",
}

export const ACTION_CATEGORY_MAP: Record<
  string,
  { label: string; color: string }
> = {
  "Login exitoso": {
    label: "Autenticación",
    color: "bg-green-100 text-green-800",
  },
  "Login fallido": { label: "Autenticación", color: "bg-red-100 text-red-800" },
  "Cambio de contraseña": {
    label: "Seguridad",
    color: "bg-yellow-100 text-yellow-800",
  },
  "Recuperación de contraseña": {
    label: "Seguridad",
    color: "bg-yellow-100 text-yellow-800",
  },
  "Voto emitido": { label: "Votación", color: "bg-blue-100 text-blue-800" },
  "Intento de voto": {
    label: "Votación",
    color: "bg-orange-100 text-orange-800",
  },
  "Consulta de resultados": {
    label: "Consulta",
    color: "bg-purple-100 text-purple-800",
  },
  "Consulta de elección": {
    label: "Consulta",
    color: "bg-purple-100 text-purple-800",
  },
  "Elección creada": {
    label: "Administración",
    color: "bg-indigo-100 text-indigo-800",
  },
  "Elección actualizada": {
    label: "Administración",
    color: "bg-indigo-100 text-indigo-800",
  },
  "Elección eliminada": {
    label: "Administración",
    color: "bg-red-100 text-red-800",
  },
  "Candidato creado": {
    label: "Administración",
    color: "bg-indigo-100 text-indigo-800",
  },
  "Candidato actualizado": {
    label: "Administración",
    color: "bg-indigo-100 text-indigo-800",
  },
  "Candidato eliminado": {
    label: "Administración",
    color: "bg-red-100 text-red-800",
  },
  "Usuario creado": {
    label: "Administración",
    color: "bg-indigo-100 text-indigo-800",
  },
  "Usuario actualizado": {
    label: "Administración",
    color: "bg-indigo-100 text-indigo-800",
  },
  "Usuario eliminado": {
    label: "Administración",
    color: "bg-red-100 text-red-800",
  },
  "Consulta de auditoría": {
    label: "Auditoría",
    color: "bg-slate-100 text-slate-800",
  },
}
