'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SyncProjectsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number } | null>(null)

  const handleSync = async () => {
    setError('')
    setSuccess('')
    setSyncResult(null)
    setLoading(true)

    try {
      const response = await fetch('/api/projects/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Помилка синхронізації')
      }

      setSyncResult(data)
      setSuccess(
        `Успішно синхронізовано! Додано: ${data.added}, Оновлено: ${data.updated}`
      )
      
      // Оновлюємо після 2 секунд
      setTimeout(() => {
        router.push('/dashboard/projects')
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка синхронізації')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Синхронізація проектів</h1>
          <p className="text-muted-foreground mt-2">
            Імпортуйте проекти з Coolify
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Синхронізація з Coolify</CardTitle>
          <CardDescription>
            Натисніть кнопку нижче, щоб отримати всі проекти з вашого Coolify інстансу
            та додати їх в базу даних.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {syncResult && (
            <div className="p-4 border rounded-lg space-y-2">
              <h3 className="font-semibold">Результати синхронізації:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Додано нових:</span>
                  <span className="ml-2 font-semibold">{syncResult.added}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Оновлено:</span>
                  <span className="ml-2 font-semibold">{syncResult.updated}</span>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleSync} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Синхронізація...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Синхронізувати проекти
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-medium mb-2">Що відбувається під час синхронізації:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Отримання списку всіх проектів з Coolify API</li>
                <li>Додавання нових проектів в базу даних</li>
                <li>Оновлення інформації про існуючі проекти</li>
              </ul>
            </div>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Проблеми з підключенням?</p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Якщо отримуєте помилку Connect Timeout, перевірте змінну COOLIFY_API_URL в налаштуваннях проекту. 
                Для Docker використовуйте: http://host.docker.internal:8000 або http://172.17.0.1:8000
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
