import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function MatchCardSkeleton() {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="w-full space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  )
}
