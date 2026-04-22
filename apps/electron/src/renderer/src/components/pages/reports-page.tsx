'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'

// Импортируем компоненты
import { ReportsDashboardTab } from '@/components/features/reports/admin/dashboard-tab/reports-dashboard-tab'
import { SettingsTab } from '@/components/features/reports/admin/settings-tab'
import { TemplatesTab } from '@/components/features/reports/admin/templates-tab'
import { GenerateCycleModal } from '@/components/features/reports/admin/generate-cycle-modal'

export function ReportsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="mx-auto max-w-7xl space-y-8 h-full flex flex-col">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Raporty i Oceny</h1>
              <p className="text-muted-foreground mt-2">
                Zarządzanie raportami okresowymi, szablonami i statystykami.
              </p>
            </div>

            {/* 🔥 Только одна кнопка */}
            <Button className="w-fit rounded-xl" onClick={() => setIsModalOpen(true)}>
              <Wand2 className="mr-2 h-4 w-4" />
              Wygeneruj nowy cykl
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-secondary border border-border w-fit rounded-xl shrink-0 mb-4 p-1">
              <TabsTrigger
                value="dashboard"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Ustawienia Generalne
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Szablony Raportów
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="flex-1 min-h-0 space-y-6">
              <ReportsDashboardTab />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 min-h-0 space-y-6">
              <SettingsTab />
            </TabsContent>

            <TabsContent value="templates" className="flex-1 min-h-0">
              <TemplatesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Рендерим модалку */}
      <GenerateCycleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
