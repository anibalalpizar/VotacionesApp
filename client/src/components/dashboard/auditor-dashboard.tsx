"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Loader2,
  Activity,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Vote,
  ShieldAlert,
  TrendingUp,
} from "lucide-react"
import {
  getAuditLogsAction,
  getAuditLogsByUserAction,
  getAuditLogsByActionAction,
  getUsersListAction,
  type AuditLog,
  type AuditLogsResponse,
  type UserDto,
} from "@/lib/actions"
import { AUDIT_ACTIONS, ACTION_CATEGORY_MAP } from "@/lib/constants/audit.constants"

type FilterType = "all" | "user" | "action"

interface Stats {
  totalLogs: number
  uniqueUsers: number
  votes: number
  failedLogins: number
}

export function AuditorDashboard() {
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<UserDto[]>([])
  const [stats, setStats] = useState<Stats>({
    totalLogs: 0,
    uniqueUsers: 0,
    votes: 0,
    failedLogins: 0,
  })
  const [globalStats, setGlobalStats] = useState<Stats>({
    totalLogs: 0,
    uniqueUsers: 0,
    votes: 0,
    failedLogins: 0,
  })
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const [actionPopoverOpen, setActionPopoverOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [userFilterInput, setUserFilterInput] = useState("")
  const [actionFilterInput, setActionFilterInput] = useState("")

  // Load users list
  useEffect(() => {
    async function loadUsers() {
      setUsersLoading(true)
      try {
        const result = await getUsersListAction()
        if (result.success && result.data) {
          setUsers(result.data)
        } else {
          console.error("Error loading users:", result.message)
        }
      } catch (err) {
        console.error("Error loading users:", err)
      } finally {
        setUsersLoading(false)
      }
    }
    loadUsers()
  }, [])

  // Load global stats (always shows total system stats)
  useEffect(() => {
    async function loadGlobalStats() {
      try {
        const result = await getAuditLogsAction(1, 10000) // Get a large sample for accurate stats
        if (result.success && result.data) {
          const data = result.data as AuditLogsResponse
          calculateStats(data.items, setGlobalStats)
        }
      } catch (err) {
        console.error("Error loading global stats:", err)
      }
    }
    loadGlobalStats()
  }, [])

  // Load audit logs based on filter
  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      setError(null)
      let result

      try {
        if (filterType === "all") {
          result = await getAuditLogsAction(currentPage, pageSize)
          if (result.success && result.data) {
            const data = result.data as AuditLogsResponse
            setLogs(data.items)
            setTotalPages(Math.ceil(data.total / data.pageSize))
          } else {
            setError(result.message || "Error al cargar registros")
          }
        } else if (filterType === "user" && selectedUserId) {
          result = await getAuditLogsByUserAction(selectedUserId)
          if (result.success && result.data) {
            setLogs(result.data)
            setTotalPages(1)
          } else {
            setError(result.message || "Error al cargar registros del usuario")
          }
        } else if (filterType === "action" && selectedAction) {
          result = await getAuditLogsByActionAction(selectedAction)
          if (result.success && result.data) {
            setLogs(result.data)
            setTotalPages(1)
          } else {
            setError(result.message || "Error al cargar registros de acciones")
          }
        }
      } catch (err) {
        setError("Error al cargar los registros de auditoría")
        console.error("Error loading logs:", err)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [filterType, selectedUserId, selectedAction, currentPage, pageSize])

  function calculateStats(items: AuditLog[], setter: (stats: Stats) => void) {
    const votes = items.filter((log) =>
      [AUDIT_ACTIONS.VoteCast, AUDIT_ACTIONS.VoteAttempt].includes(log.action)
    ).length

    const failedLogins = items.filter((log) =>
      log.action === AUDIT_ACTIONS.LoginFailed
    ).length

    const uniqueUsers = new Set(items.map((log) => log.userId)).size

    setter({
      totalLogs: items.length,
      uniqueUsers,
      votes,
      failedLogins,
    })
  }

  const selectedUserName = users.find((u) => u.userId === selectedUserId)?.fullName
  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(userFilterInput.toLowerCase()) ||
    u.email.toLowerCase().includes(userFilterInput.toLowerCase())
  )
  const allActions = Object.values(AUDIT_ACTIONS)
  const filteredActions = allActions.filter((a) =>
    a.toLowerCase().includes(actionFilterInput.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Registros</h3>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-50">{globalStats.totalLogs}</div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Eventos registrados
          </p>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100">Usuarios Activos</h3>
            <div className="p-2 bg-green-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-50">{globalStats.uniqueUsers}</div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">Con actividad reciente</p>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">Votos Totales</h3>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Vote className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-50">{globalStats.votes}</div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Votos registrados</p>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-900 dark:text-red-100">Intentos Fallidos</h3>
            <div className="p-2 bg-red-500 rounded-lg">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-900 dark:text-red-50">{globalStats.failedLogins}</div>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">Logins fallidos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Filtros</h3>
        <p className="text-sm text-muted-foreground mb-4">Selecciona cómo deseas filtrar los registros</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setFilterType("all")
              setCurrentPage(1)
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filterType === "all"
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105"
            }`}
          >
            Todos los Registros
          </button>

          <div className="relative">
            <button
              onClick={() => setUserPopoverOpen(!userPopoverOpen)}
              disabled={usersLoading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                filterType === "user"
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105"
              } ${usersLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {usersLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando usuarios...
                </>
              ) : filterType === "user" && selectedUserName ? (
                selectedUserName
              ) : (
                "Por Usuario"
              )}
              <ChevronsUpDown className="h-4 w-4" />
            </button>

            {userPopoverOpen && !usersLoading && (
              <div className="absolute top-full mt-2 w-72 bg-popover border rounded-md shadow-lg z-50">
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={userFilterInput}
                  onChange={(e) => setUserFilterInput(e.target.value)}
                  className="w-full px-3 py-2 border-b text-sm outline-none focus:bg-accent/50"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No se encontró usuario.
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.userId}
                        onClick={() => {
                          setFilterType("user")
                          setSelectedUserId(user.userId)
                          setUserPopoverOpen(false)
                          setCurrentPage(1)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between text-sm border-b last:border-b-0"
                      >
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        {selectedUserId === user.userId && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setActionPopoverOpen(!actionPopoverOpen)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                filterType === "action"
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105"
              }`}
            >
              {filterType === "action" && selectedAction ? selectedAction : "Por Acción"}
              <ChevronsUpDown className="h-4 w-4" />
            </button>

            {actionPopoverOpen && (
              <div className="absolute top-full mt-2 w-80 bg-popover border rounded-md shadow-lg z-50">
                <input
                  type="text"
                  placeholder="Buscar acción..."
                  value={actionFilterInput}
                  onChange={(e) => setActionFilterInput(e.target.value)}
                  className="w-full px-3 py-2 border-b text-sm outline-none focus:bg-accent/50"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredActions.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No se encontró acción.
                    </div>
                  ) : (
                    filteredActions.map((action) => (
                      <button
                        key={action}
                        onClick={() => {
                          setFilterType("action")
                          setSelectedAction(action)
                          setActionPopoverOpen(false)
                          setCurrentPage(1)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between text-sm border-b last:border-b-0"
                      >
                        {action}
                        {selectedAction === action && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {filterType !== "all" && (
            <button
              onClick={() => {
                setFilterType("all")
                setSelectedUserId(null)
                setSelectedAction(null)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 transition-all"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Registro de Auditoría</h3>
        <p className="text-sm text-muted-foreground mb-4">Historial completo de eventos del sistema</p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Cargando registros...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-8 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay registros disponibles
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Fecha/Hora</th>
                    <th className="px-4 py-3 text-left font-medium">Usuario</th>
                    <th className="px-4 py-3 text-left font-medium">Acción</th>
                    <th className="px-4 py-3 text-left font-medium">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const category = ACTION_CATEGORY_MAP[log.action]
                    return (
                      <tr key={log.auditId} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{log.userName}</td>
                        <td className="px-4 py-3">
                          {category ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${category.color}`}>
                              {category.label}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium border">
                              {log.action}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                          {log.details || "-"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filterType === "all" && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm text-muted-foreground whitespace-nowrap">
                      Mostrar:
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-2 py-1 rounded border text-sm font-medium bg-background hover:bg-muted transition-colors"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}