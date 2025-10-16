import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"

export function VoteConfirmationSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        {/* Back button skeleton */}
        <Skeleton className="h-10 w-32 mb-4" />

        {/* Icon and badge */}
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>

        {/* Title */}
        <Skeleton className="h-10 w-64 mb-2" />

        {/* Description */}
        <Skeleton className="h-6 w-full max-w-lg" />
      </div>

      {/* Important Notice Alert */}
      <Alert className="mb-8">
        <div className="flex gap-3">
          <Skeleton className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </Alert>

      {/* Candidate Details Card */}
      <Card className="overflow-hidden mb-8">
        {/* Top colored bar */}
        <Skeleton className="h-2 w-full" />

        <div className="p-8">
          {/* Candidate info */}
          <div className="flex items-start gap-6 mb-6">
            {/* Candidate number circle */}
            <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />

            <div className="flex-1 space-y-3">
              {/* "Has seleccionado a:" text */}
              <Skeleton className="h-4 w-36" />

              {/* Candidate name */}
              <Skeleton className="h-8 w-full max-w-sm" />

              {/* Party badge */}
              <Skeleton className="h-7 w-40 rounded-full" />
            </div>
          </div>

          {/* Election info */}
          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
    </div>
  )
}
