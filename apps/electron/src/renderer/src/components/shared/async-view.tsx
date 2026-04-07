import { ReactNode, useState, useEffect } from 'react'

/**
 * Состояние типичного асинхронного запроса (TanStack Query, SWR, etc.)
 */
export interface QueryState {
  isLoading?: boolean
  isFetching?: boolean
  isPending?: boolean
  isError?: boolean
  error?: any
  refetch?: () => void
  reset?: () => void
}

export interface AsyncViewProps {
  isLoading?: boolean
  isError?: boolean
  isEmpty?: boolean
  errorMsg?: string
  loader?: ReactNode
  errorFallback?: ReactNode
  emptyFallback?: ReactNode
  children: ReactNode
  delay?: number
  onRetry?: () => void
  query?: QueryState
}

export const AsyncView = ({
  isLoading: propIsLoading,
  isError: propIsError,
  isEmpty,
  errorMsg,
  loader,
  errorFallback,
  emptyFallback,
  children,
  delay = 250,
  onRetry: propOnRetry,
  query
}: AsyncViewProps) => {
  // Вычисляем состояния, приоритет у пропсов, затем у объекта query
  const isLoading =
    propIsLoading ?? query?.isPending ?? query?.isLoading ?? query?.isFetching ?? false
  const isError = propIsError ?? query?.isError ?? false
  const onRetry = propOnRetry ?? query?.refetch ?? query?.reset
  const resolvedErrorMsg =
    errorMsg ?? (query?.error as Error)?.message ?? 'Sorry! Something went wrong.'

  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    if (isLoading) {
      // Анти-фликер: показываем лоадер только если загрузка долгая
      timeoutId = setTimeout(() => setShowLoader(true), delay)
    } else {
      setShowLoader(false)
    }

    return () => clearTimeout(timeoutId)
  }, [isLoading, delay])

  if (isLoading) {
    if (!showLoader) return null

    return (
      <div className="flex items-center justify-center py-8 w-full">
        {loader || (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin text-blue-500"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full">
        {errorFallback || (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 flex flex-col items-start gap-3 shadow-sm">
            <span className="font-medium">{resolvedErrorMsg}</span>
            {onRetry && (
              <button
                onClick={() => onRetry()}
                className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors text-sm font-semibold cursor-pointer active:scale-95"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="w-full">
        {emptyFallback || (
          <div className="text-gray-400 italic py-4 flex items-center justify-center">
            No data available.
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}
