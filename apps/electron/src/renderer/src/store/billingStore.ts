import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MergedBillingItem } from '@/lib/trpc'



interface BillingCache {
  items: MergedBillingItem[]
  fetchedAt: number
}

interface BillingState {
  // Ключ: "MM-YYYY"
  cache: Record<string, BillingCache>
  selectedTemplateId: number | null

  setCache: (month: number, year: number, items: MergedBillingItem[]) => void
  setSelectedTemplateId: (id: number | null) => void
  clearCache: () => void
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set) => ({
      cache: {},
      selectedTemplateId: null,

      setCache: (month, year, items) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [`${month}-${year}`]: { items, fetchedAt: Date.now() }
          }
        })),

      setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
      clearCache: () => set({ cache: {} })
    }),
    { name: 'btw-billing-storage' }
  )
)
