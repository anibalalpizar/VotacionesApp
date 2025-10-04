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
import { getAllVotersAction, getVoterByIdAction } from "@/lib/actions"
import { ViewVoterDialog } from "@/components/voters/view-voter-dialog"
import { EditVoterDialog } from "@/components/voters/edit-voter-dialog"
import { DeleteVoterDialog } from "@/components/voters/delete-voter-dialog"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: "text" | "range" | "select"
  }
}

type Voter = {
  userId: number
  identification: string
  fullName: string
  email: string
  role: string
  createdAt: string
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

export function VotersTable() {
  const [voters, setVoters] = useState<Voter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingVoter, setIsLoadingVoter] = useState(false)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "createdAt",
      desc: true,
    },
  ])

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  })

  const [selectedVoterId, setSelectedVoterId] = useState<number | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedVoterForEdit, setSelectedVoterForEdit] = useState<Voter | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedVoterForDelete, setSelectedVoterForDelete] = useState<Voter | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const columns: ColumnDef<Voter>[] = useMemo(
    () => [
      {
        header: "Identificación",
        accessorKey: "identification",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("identification")}</div>
        ),
      },
      {
        header: "Nombre Completo",
        accessorKey: "fullName",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("fullName")}</div>
        ),
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.getValue("email")}
          </div>
        ),
      },
      {
        header: "Rol",
        accessorKey: "role",
        cell: ({ row }) => {
          const role = row.getValue("role") as string

          const styles =
            {
              ADMIN:
                "bg-blue-600/10 text-blue-600 focus-visible:ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400",
              VOTER:
                "bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400",
            }[role] || "bg-gray-600/10 text-gray-600"

          return (
            <Badge
              className={cn(
                "rounded-full border-none focus-visible:outline-none",
                styles
              )}
            >
              {role}
            </Badge>
          )
        },
        enableSorting: false,
        meta: {
          filterVariant: "select",
        },
      },
      {
        header: "Fecha de Registro",
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"))
          return (
            <div className="text-sm">
              {date.toLocaleDateString("es-CR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          )
        },
      },
      {
        header: "Acciones",
        id: "actions",
        cell: ({ row }) => {
          const voter = row.original

          return (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isLoadingVoter}
                      onClick={async () => {
                        setIsLoadingVoter(true)
                        try {
                          const result = await getVoterByIdAction(voter.userId)
                          
                          if (result.success && result.data) {
                            setSelectedVoterId(voter.userId)
                            setViewDialogOpen(true)
                          } else {
                            toast.error(result.message || "Error al cargar detalles del votante")
                          }
                        } catch (error) {
                          toast.error("Error de conexión al cargar detalles")
                        } finally {
                          setIsLoadingVoter(false)
                        }
                      }}
                    >
                      {isLoadingVoter ? (
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
                      disabled={isLoadingVoter}
                      onClick={async () => {
                        setIsLoadingVoter(true)
                        try {
                          const result = await getVoterByIdAction(voter.userId)
                          
                          if (result.success && result.data) {
                            setSelectedVoterForEdit(result.data)
                            setEditDialogOpen(true)
                          } else {
                            toast.error(result.message || "Error al cargar datos del votante")
                          }
                        } catch (error) {
                          toast.error("Error de conexión al cargar datos")
                        } finally {
                          setIsLoadingVoter(false)
                        }
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar votante</p>
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
                        setSelectedVoterForDelete(voter)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar votante</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [isLoadingVoter]
  )

  useEffect(() => {
    loadVoters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize])

  async function loadVoters() {
    setIsLoading(true)
    try {
      const result = await getAllVotersAction(
        pagination.page,
        pagination.pageSize
      )

      if (result.success && result.data) {
        setVoters(result.data.items)
        setPagination((prev) => ({
          ...prev,
          total: result.data.total,
        }))
      } else {
        toast.error(result.message || "Error al cargar votantes")
      }
    } catch (error) {
      toast.error("Error de conexión al cargar votantes")
    } finally {
      setIsLoading(false)
    }
  }

  const table = useReactTable({
    data: voters,
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
          <div className="w-52">
            <Filter column={table.getColumn("identification")!} />
          </div>
          <div className="w-64">
            <Filter column={table.getColumn("fullName")!} />
          </div>
          <div className="w-64">
            <Filter column={table.getColumn("email")!} />
          </div>
          <div className="w-40">
            <Filter column={table.getColumn("role")!} />
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
                  No se encontraron votantes.
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

      <ViewVoterDialog
        voterId={selectedVoterId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <EditVoterDialog
        voter={selectedVoterForEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadVoters}
      />

      <DeleteVoterDialog
        voter={selectedVoterForDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={loadVoters}
      />
    </div>
  )
}