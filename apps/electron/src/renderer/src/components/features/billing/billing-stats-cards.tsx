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
  const cardClasses =
    'bg-card border-border/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:scale-[1.02]'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className={cardClasses}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-muted-foreground">Liczba uczniów</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalStudents}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className={cardClasses}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Banknote className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-muted-foreground">Do pobrania</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalToCollect.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className={cardClasses}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-muted-foreground">Gotowe do wysyłki</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {readyForTelegram}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className={cardClasses}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <UserX className="h-6 w-6 text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-muted-foreground">Brak kontaktu</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {missingContact}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
