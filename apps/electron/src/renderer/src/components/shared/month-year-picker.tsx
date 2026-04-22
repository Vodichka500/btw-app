'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover'
import { cn } from '@/lib/utils'

const MONTHS_PL_FULL = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień'
]

const MONTHS_PL_SHORT = [
  'Sty',
  'Lut',
  'Mar',
  'Kwi',
  'Maj',
  'Cze',
  'Lip',
  'Sie',
  'Wrz',
  'Paź',
  'Lis',
  'Gru'
]

export function MonthYearPicker({
  date,
  onChange
}: {
  date: Date
  onChange: (date: Date) => void
}) {
  const currentMonth = date.getMonth()
  const currentYear = date.getFullYear()

  // Локальный стейт для отображения года в поповере (пока юзер листает стрелочками)
  const [viewYear, setViewYear] = useState(currentYear)
  const [isOpen, setIsOpen] = useState(false)

  // При открытии поповера всегда сбрасываем вид на выбранный год
  useEffect(() => {
    if (isOpen) setViewYear(currentYear)
  }, [isOpen, currentYear])

  const handleSelect = (mIndex: number) => {
    onChange(new Date(viewYear, mIndex, 1))
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[180px] justify-start text-left font-medium rounded-xl bg-secondary border-border hover:bg-secondary/80"
        >
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>
            {MONTHS_PL_FULL[currentMonth]} {currentYear}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3 rounded-2xl border-border bg-card shadow-lg"
        align="start"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewYear(viewYear - 1)}
            className="h-8 w-8 rounded-lg hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold tracking-tight">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewYear(viewYear + 1)}
            className="h-8 w-8 rounded-lg hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS_PL_SHORT.map((m, i) => {
            const isActive = i === currentMonth && viewYear === currentYear
            return (
              <Button
                key={m}
                variant="ghost"
                onClick={() => handleSelect(i)}
                className={cn(
                  'h-10 text-xs font-medium rounded-xl transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {m}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
