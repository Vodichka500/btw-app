'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import { RefreshCw, Plus, MoreHorizontal, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/shared/ui/dropdown-menu'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/shared/ui/tooltip'

import { PendingPaymentsTab } from '@/components/features/billing/pending-payments-tab'
import { SentHistoryTab } from '@/components/features/billing/sent-history-tab'
import MessageTemplateModal, {
  TemplateEditState
} from '@/components/features/billing/message-template-modal'
import { BillingStatsCards } from '@/components/features/billing/billing-stats-cards'
import { MonthYearPicker } from '@/components/shared/month-year-picker'

import { useBilling } from '@/hooks/use-billing'
import { trpc } from '@/lib/trpc'

export function BillingPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [templateToEdit, setTemplateToEdit] = useState<TemplateEditState>(null)

  const { data: templates = [] } = trpc.billingTemplate.getAll.useQuery()

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0]

  const monthNum = selectedDate.getMonth()
  const yearNum = selectedDate.getFullYear()

  const {
    items: students,
    isLoading,
    lastSync,
    handleFetch
  } = useBilling(monthNum, yearNum, activeTemplate?.body)

  const totalStudents = students.length
  const totalToCollect = students.reduce((sum, s) => sum + s.totalToPay, 0)
  const readyForTelegram = students.filter((s) => s.studentTgChatId || s.parentTgChatId).length
  const missingContact = totalStudents > 0 ? totalStudents - readyForTelegram : 0
  const isStale = !lastSync

  // Хелперы для открытия модалки
  const openEditModal = (t: TemplateEditState) => {
    setTemplateToEdit(t)
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setTemplateToEdit({ name: '', body: '' })
    setIsModalOpen(true)
  }

  // Нам понадобится utils только для быстрого удаления из выпадающего меню
  const trpcUtils = trpc.useUtils()
  const deleteTemplateMut = trpc.billingTemplate.delete.useMutation({
    onSuccess: () => trpcUtils.billingTemplate.getAll.invalidate()
  })

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rozliczenia i Płatności</h1>
              <p className="text-muted-foreground mt-2">
                Zarządzanie płatnościami i wysyłanie powiadomień.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isStale && students.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full text-sm font-medium cursor-help">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Wymagana synchronizacja
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Dane mogą być nieaktualne.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button onClick={() => handleFetch(true)} disabled={isLoading} className="rounded-xl">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Pobierz
                z AlfaCRM
              </Button>
            </div>
          </div>

          {/* SECONDARY TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <MonthYearPicker date={selectedDate} onChange={setSelectedDate} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[220px] justify-between bg-secondary rounded-xl"
                >
                  <span className="truncate">{activeTemplate?.name || 'Wybierz szablon'}</span>
                  <MoreHorizontal className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] rounded-xl">
                {templates.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onSelect={() => setSelectedTemplateId(t.id)}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{t.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal({ id: t.id, name: t.name, body: t.body })
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTemplateMut.mutate({ id: t.id })
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))}
                {templates.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onSelect={openCreateModal} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" /> Dodaj szablon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <BillingStatsCards
            totalStudents={totalStudents}
            totalToCollect={totalToCollect}
            readyForTelegram={readyForTelegram}
            missingContact={missingContact}
          />

          {/* TABS */}
          <Tabs defaultValue="pending" className="space-y-4 flex-1 flex flex-col min-h-0">
            <TabsList className="bg-secondary border border-border w-fit rounded-xl">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
              >
                Oczekujące płatności
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
              >
                Historia wysyłki
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="flex-1 min-h-0">
              <PendingPaymentsTab students={students} monthNum={monthNum} yearNum={yearNum} />
            </TabsContent>

            <TabsContent value="history" className="flex-1 min-h-0">
              <SentHistoryTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MessageTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templateToEdit={templateToEdit}
      />
    </div>
  )
}
