import { Skeleton } from "../ui/skeleton"

function DeleteVoterDialogSkeleton() {
  return (
    <>
      <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 mt-0.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 mt-0.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    </>
  )
}

export default DeleteVoterDialogSkeleton
