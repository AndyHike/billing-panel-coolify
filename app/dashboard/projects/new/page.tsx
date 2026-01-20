'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    coolifyUuid: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Помилка створення проекту')
      }

      router.push('/dashboard/projects')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка створення проекту')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Додати проект вручну</h1>
          <p className="text-muted-foreground mt-2">
            Створіть проект без синхронізації з Coolify
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новий проект</CardTitle>
          <CardDescription>
            Заповніть інформацію про проект з Coolify
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Назва проекту *</Label>
              <Input
                id="name"
                placeholder="My Project"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coolifyUuid">Coolify UUID *</Label>
              <Input
                id="coolifyUuid"
                placeholder="abc-def-123-456"
                value={formData.coolifyUuid}
                onChange={(e) => setFormData({ ...formData, coolifyUuid: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                UUID проекту з Coolify (можна знайти в URL або налаштуваннях проекту)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Опис (опціонально)</Label>
              <Textarea
                id="description"
                placeholder="Опис проекту..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Створення...' : 'Створити проект'}
              </Button>
              <Link href="/dashboard/projects">
                <Button type="button" variant="outline">
                  Скасувати
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
