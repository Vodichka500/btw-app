import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/shared/ui/button'
import { toast } from 'sonner'
import { differenceInHours, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/shared/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'

import { CustomersTab } from '@/components/features/customers/customers-tab'
import { MessageLogsTab } from '@/components/features/customers/message-logs-tab'

export default function CustomersPage() {
  // Context & Stores
  const utils = trpc.useUtils()

  // Local State
  const [isSyncing, setIsSyncing] = useState(false)

  // API Queries
  const { data: syncState } = trpc.customer.getSavedCustomers.useQuery({ limit: 1 }) // Только для статуса

  // API Mutations
  const syncMut = trpc.customer.synchronizeCustomers.useMutation({
    onSuccess: () => {
      toast.success('Baza zsynchronizowana pomyślnie!')
      utils.customer.getSavedCustomers.invalidate()
    },
    onError: (err) => toast.error(`Błąd synchronizacji: ${err.message}`),
    onSettled: () => setIsSyncing(false)
  })

  // Derived State
  const isStale = syncState?.lastSync
    ? differenceInHours(new Date(), new Date(syncState.lastSync)) >= 2
    : true

  // Handlers & Callbacks
  const handleSync = async () => {
    setIsSyncing(true)
    await syncMut.mutateAsync()
  }

  // Main Return
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="mx-auto max-w-7xl space-y-8 h-full flex flex-col">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Klienci (Baza CRM)</h1>
              <p className="text-muted-foreground mt-2">
                Zarządzanie ustawieniami i historia komunikacji.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isStale && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full text-sm font-medium cursor-help">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Wymagana synchronizacja
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Ostatnia synchronizacja:{' '}
                        {syncState?.lastSync
                          ? formatDistanceToNow(new Date(syncState.lastSync), {
                              addSuffix: true,
                              locale: pl
                            })
                          : 'Nigdy'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button onClick={handleSync} disabled={isSyncing} className="rounded-xl">
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> Skanuj
                AlfaCRM
              </Button>
            </div>
          </div>

          <Tabs defaultValue="customers" className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-secondary border border-border w-fit rounded-xl shrink-0 mb-4">
              <TabsTrigger
                value="customers"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
              >
                Baza Klientów
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
              >
                Historia Wiadomości
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="flex-1 min-h-0">
              <CustomersTab />
            </TabsContent>

            <TabsContent value="logs" className="flex-1 min-h-0">
              <MessageLogsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
