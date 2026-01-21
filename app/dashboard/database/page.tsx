'use client'

import { DatabaseBrowser } from '@/components/dashboard/database-browser'

export default function DatabasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">База Даних</h1>
        <p className="text-muted-foreground mt-2">
          Переглядайте, редагуйте та керуйте вашою БД
        </p>
      </div>

      <DatabaseBrowser />
    </div>
  )
}
