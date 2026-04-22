import { Card, CardContent } from '@/components/shared/ui/card'
import { Users, Banknote, Send, UserX } from 'lucide-react'

interface BillingStatsCardsProps {
  totalStudents: number
  totalToCollect: number
  readyForTelegram: number
  missingContact: number
}

export function BillingStatsCards({
  totalStudents,
  totalToCollect,
  readyForTelegram,
  missingContact
}: BillingStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border rounded-xl">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">Liczba uczniów</span>
            <span className="text-xl font-bold">{totalStudents}</span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border rounded-xl">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">Do pobrania</span>
            <span className="text-xl font-bold">
              {totalToCollect.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border rounded-xl">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <Send className="h-5 w-5 text-success" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">Gotowe do wysyłki</span>
            <span className="text-xl font-bold">{readyForTelegram}</span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border rounded-xl">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <UserX className="h-5 w-5 text-warning" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">Brak kontaktu</span>
            <span className="text-xl font-bold">{missingContact}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
