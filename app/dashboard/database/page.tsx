'use client'

import { DatabaseBrowser } from '@/components/dashboard/database-browser'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Loading from './loading'

export default function DatabasePage() {
  const searchParams = useSearchParams()
  const projectUuid = searchParams.get('project')
  const resourceUuid = searchParams.get('resource')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">База Даних</h1>
        <p className="text-muted-foreground mt-2">
          {projectUuid 
            ? 'Переглядайте, редагуйте та керуйте БД проекту'
            : 'Переглядайте, редагуйте та керуйте вашою БД'
          }
        </p>
      </div>

      <Suspense fallback={<Loading />}>
        <DatabaseBrowser projectUuid={projectUuid} resourceUuid={resourceUuid} />
      </Suspense>
    </div>
  )
}
