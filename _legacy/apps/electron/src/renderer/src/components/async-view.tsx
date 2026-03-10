import { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface AsyncViewProps {
  isLoading: boolean
  isError?: boolean
  errorMsg?: string
  loader?: ReactNode
  errorFallback?: ReactNode
  children: ReactNode
}

/**
 * A reusable component to handle loading and error states for asynchronous data fetching.
 * @param isLoading
 * @param isError
 * @param errorMsg
 * @param loader
 * @param errorFallback
 * @param children
 * @constructor
 */
export const AsyncView = ({
  isLoading,
  isError,
  errorMsg,
  loader,
  errorFallback,
  children
}: AsyncViewProps) => {
  if (isLoading) {
    return <>{loader || <Skeleton className="h-12 w-64 mb-2" />}</>
  }

  if (isError) {
    return (
      <>
        {errorFallback || (
          <div className="text-red-500 font-bold p-2 border border-red-500 rounded">
            {errorMsg || 'Sorry! Something went wrong.'}
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
