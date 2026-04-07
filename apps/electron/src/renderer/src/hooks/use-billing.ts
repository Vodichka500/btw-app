import { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

export const formatBillingMessage = (
  template: string,
  data: { name: string; amount: number; subjects: { name: string; quantity: number }[] }
) => {
  let result = template

  const eachRegex = /{{#each subjects}}([\s\S]*?){{\/each}}/g
  result = result.replace(eachRegex, (_match, innerTemplate) => {
    return data.subjects
      .map((subj) => {
        return innerTemplate
          .replace(/{{subject_name}}/g, subj.name)
          .replace(/{{quantity}}/g, subj.quantity.toString())
      })
      .join('')
  })

  result = result.replace(/{{name}}/g, data.name).replace(/{{amount}}/g, data.amount.toFixed(2))
  return result
}

export function useBilling(month: number, year: number, activeTemplateBody?: string) {
  const [isManualFetching, setIsManualFetching] = useState(false)

  const utils = trpc.useUtils()
  const { data: tokenData } = trpc.alfa.getTempToken.useQuery()

  const dashboardQuery = trpc.billing.getDashboardData.useQuery(
    {
      alfaTempToken: tokenData?.token ?? '',
      month,
      year
    },
    {
      enabled: !!tokenData?.token
    }
  )

  const rawItems = dashboardQuery.data?.items

  const finalItems = useMemo(() => {
    if (!rawItems) return []

    return rawItems.map((item) => {
      // Предметы уже обогащены локальными названиями на бэкенде!
      return {
        ...item,
        generatedMessage: activeTemplateBody
          ? formatBillingMessage(activeTemplateBody, {
              name: item.name,
              amount: item.totalToPay,
              subjects: item.subjects // Просто отдаем как есть
            })
          : ''
      }
    })
  }, [rawItems, activeTemplateBody])

  const handleFetch = async (force = false) => {
    if (!tokenData?.token) {
      toast.error('Brak tokenu AlfaCRM')
      return
    }

    setIsManualFetching(true)

    try {
      if (force) {
        const newData = await utils.billing.getDashboardData.fetch({
          alfaTempToken: tokenData.token,
          month,
          year,
          forceRefresh: true
        })

        utils.billing.getDashboardData.setData(
          { alfaTempToken: tokenData.token, month, year },
          newData
        )
        toast.success('Dane zaktualizowane')
      } else {
        await dashboardQuery.refetch()
      }
    } catch (err: any) {
      toast.error(err.message || 'Wystąpił błąd podczas pobierania danych')
    } finally {
      setIsManualFetching(false)
    }
  }

  return {
    items: finalItems,
    isLoading: dashboardQuery.isFetching || isManualFetching,
    lastSync: dashboardQuery.data?.lastSync || null,
    alfaFetchedAt: dashboardQuery.data?.alfaFetchedAt || null,
    handleFetch
  }
}
