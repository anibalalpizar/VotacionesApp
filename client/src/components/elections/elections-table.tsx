"use client"

import { useEffect, useState, useId, useMemo } from "react"
import { toast } from "sonner"
import { Search, Loader2, Eye, Pencil, Trash2 } from "lucide-react"

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"
import { getAllElectionsAction, getElectionByIdAction } from "@/lib/actions"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: "text" | "range" | "select"
  }
}

type Election = {
  electionId: string
  name: string
  startDateUtc: string
  endDateUtc: string
  status: string
  candidateCount: number
  voteCount: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Filter({ column }: { column: Column<any, unknown> }) {
  const id = useId()
  const columnFilterValue = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}
  const columnHeader =
    typeof column.columnDef.header === "string" ? column.columnDef.header : ""

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === "range") return []

    const values = Array.from(column.getFacetedUniqueValues().keys())

    const flattenedValues = values.reduce((acc: string[], curr) => {
      if (Array.isArray(curr)) {
        return [...acc, ...curr]
      }

      return [...acc, curr]
    }, [])

    return Array.from(new Set(flattenedValues)).sort()
  }, [column.getFacetedUniqueValues(), filterVariant])

  if (filterVariant === "select") {
    return (
      <div className="space-y-2">
        <Label htmlFor={`${id}-select`}>{columnHeader}</Label>
        <Select
          value={columnFilterValue?.toString() ?? "all"}
          onValueChange={(value) => {
            column.setFilterValue(value === "all" ? undefined : value)
          }}
        >
          <SelectTrigger id={`${id}-select`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {sortedUniqueValues.map((value) => (
              <SelectItem key={String(value)} value={String(value)}>
                {String(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-input`}>{columnHeader}</Label>
      <div className="relative">
        <Input
          id={`${id}-input`}
          className="peer pl-9"
          value={(columnFilterValue ?? "") as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
          placeholder={`Buscar ${columnHeader.toLowerCase()}`}
          type="text"
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
          <Search size={16} />
        </div>
      </div>
    </div>
  )
}

export function ElectionsTable() {
  const [elections, setElections] = useState<Election[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingElection, setIsLoadingElection] = useState(false)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ])

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  })

  const columns: ColumnDef<Election>[] = useMemo(
    () => [
      {
        header: "Nombre",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        header: "Estado",
        accessorKey: "status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string

          const styles =
            {
              Draft:
                "bg-gray-600/10 text-gray-600 focus-visible:ring-gray-600/20 dark:bg-gray-400/10 dark:text-gray-400",
              Active:
                "bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400",
              Closed:
                "bg-red-600/10 text-red-600 focus-visible:ring-red-600/20 dark:bg-red-400/10 dark:text-red-400",
            }[status] || "bg-gray-600/10 text-gray-600"

          const labels = {
            Draft: "Borrador",
            Active: "Activa",
            Closed: "Cerrada",
          }

          return (
            <Badge
              className={cn(
                "rounded-full border-none focus-visible:outline-none",
                styles
              )}
            >
              {labels[status as keyof typeof labels] || status}
            </Badge>
          )
        },
        enableSorting: false,
        meta: {
          filterVariant: "select",
        },
      },
      {
        header: "Fecha de Inicio",
        accessorKey: "startDateUtc",
        cell: ({ row }) => {
          const date = new Date(row.getValue("startDateUtc"))
          return (
            <div className="text-sm">
              {date.toLocaleDateString("es-CR", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )
        },
      },
      {
        header: "Fecha de Fin",
        accessorKey: "endDateUtc",
        cell: ({ row }) => {
          const date = new Date(row.getValue("endDateUtc"))
          return (
            <div className="text-sm">
              {date.toLocaleDateString("es-CR", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )
        },
      },
      {
        header: "Candidatos",
        accessorKey: "candidateCount",
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("candidateCount")}</div>
        ),
        enableSorting: false,
      },
      {
        header: "Votos",
        accessorKey: "voteCount",
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("voteCount")}</div>
        ),
        enableSorting: false,
      },
      {
        header: "Acciones",
        id: "actions",
        cell: ({ row }) => {
          const election = row.original

          return (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isLoadingElection}
                      onClick={async () => {
                        setIsLoadingElection(true)
                        try {
                          const result = await getElectionByIdAction(election.electionId)
                          
                          if (result.success && result.data) {
                            // Aquí abrir dialog de vista
                            toast.success("Funcionalidad de vista pendiente")
                          } else {
                            toast.error(result.message || "Error al cargar detalles de la elección")
                          }
                        } catch (error) {
                          toast.error("Error de conexión al cargar detalles")
                        } finally {
                          setIsLoadingElection(false)
                        }
                      }}
                    >
                      {isLoadingElection ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver detalles</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isLoadingElection}
                      onClick={() => {
                        toast.success("Funcionalidad de edición pendiente")
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar elección</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        toast.success("Funcionalidad de eliminación pendiente")
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar elección</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [isLoadingElection]
  )

  useEffect(() => {
    loadElections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize])

  async function loadElections() {
    setIsLoading(true)
    try {
      const result = await getAllElectionsAction(
        pagination.page,
        pagination.pageSize
      )

      if (result.success && result.data) {
        setElections(result.data.items)
        setPagination((prev) => ({
          ...prev,
          total: result.data.total,
        }))
      } else {
        toast.error(result.message || "Error al cargar elecciones")
      }
    } catch (error) {
      toast.error("Error de conexión al cargar elecciones")
    } finally {
      setIsLoading(false)
    }
  }

  const table = useReactTable({
    data: elections,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
  })

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <div className="flex flex-wrap gap-3 px-4 py-6">
          <div className="w-64">
            <Filter column={table.getColumn("name")!} />
          </div>
          <div className="w-40">
            <Filter column={table.getColumn("status")!} />
          </div>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="relative h-10 border-t select-none"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron elecciones.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Mostrar
            </span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => {
                setPagination((prev) => ({
                  ...prev,
                  page: 1,
                  pageSize: Number(value),
                }))
              }}
            >
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              registros por página
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Página {pagination.page} de {totalPages || 1} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }}
                disabled={pagination.page >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}