import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ElectionsTableSkeleton() {
  return (
    <div className="w-full">
      <div className="rounded-md border">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-6 border-b">
          <div className="flex flex-wrap gap-3">
            <div className="w-64 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="w-40 space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-10 border-t">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="h-10 border-t">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-10 border-t">
                <Skeleton className="h-4 w-28" />
              </TableHead>
              <TableHead className="h-10 border-t">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead className="h-10 border-t">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead className="h-10 border-t">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="h-10 border-t">
                <Skeleton className="h-4 w-20" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-5 w-full max-w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-6" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-8" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-4 border-t">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
