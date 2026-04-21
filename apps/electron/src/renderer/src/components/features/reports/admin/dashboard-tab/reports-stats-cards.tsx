import { Clock, Send, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card'

interface ReportsStatsCardsProps {
  pendingReports: number
  sentReports: number
  issueReports: number
}

export function ReportsStatsCards({
  pendingReports,
  sentReports,
  issueReports
}: ReportsStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="rounded-xl border-border bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Oczekujące raporty
          </CardTitle>
          <Clock className="h-5 w-5 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">{pendingReports}</div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Wysłane w tym cyklu
          </CardTitle>
          <Send className="h-5 w-5 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">{sentReports}</div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Problemy / Odwołane
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">{issueReports}</div>
        </CardContent>
      </Card>
    </div>
  )
}
