import { FileText, Archive } from 'lucide-react'

interface EmptyDetailProps {
  isReadOnly?: boolean
}

export function EmptyDetail({ isReadOnly = false }: EmptyDetailProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        {isReadOnly ? (
          <Archive className="h-8 w-8 text-muted-foreground" />
        ) : (
          <FileText className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground">
          {isReadOnly ? 'Wybierz raport' : 'Wybierz ucznia'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          {isReadOnly
            ? 'Kliknij na raport z listy po lewej stronie, aby zobaczyć szczegóły.'
            : 'Kliknij na ucznia z listy po lewej stronie, aby zobaczyć lub wypełnić raport.'}
        </p>
      </div>
    </div>
  )
}
