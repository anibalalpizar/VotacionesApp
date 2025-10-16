// components/vote/candidate-list-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog"

interface CandidateListSkeletonProps {
  showElectionDialog?: boolean
}

export function CandidateListSkeleton({ 
  showElectionDialog = false 
}: CandidateListSkeletonProps) {
  return (
    <>
      {showElectionDialog && (
        <Dialog open={true}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full max-w-md mb-2" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </div>

        {/* Search bar skeleton */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Candidates grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              {/* Top colored bar */}
              <Skeleton className="h-2 w-full" />

              <div className="p-6">
                {/* Candidate number circle */}
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                </div>

                {/* Candidate name */}
                <Skeleton className="h-7 w-full max-w-[200px] mb-3" />

                {/* Party badge */}
                <div className="mb-4">
                  <Skeleton className="h-7 w-32 rounded-full" />
                </div>

                {/* Button */}
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}