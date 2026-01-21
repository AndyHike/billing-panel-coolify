'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader } from 'lucide-react'
import Link from 'next/link'

interface ClientEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClientEditPage({ params }: ClientEditPageProps) {
  const router = useRouter()
  const [clientId, setClientId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  })

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setClientId(resolvedParams.id)
      loadClientData(resolvedParams.id)
    }
    loadParams()
  }, [params])

  async function loadClientData(id: string) {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`/api/clients/${id}`)

      if (!response.ok) {
        throw new Error('Клієнта не знайдено')
      }

      const data = await response.json()
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        notes: data.notes || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження клієнта')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) return

    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Помилка оновлення клієнта')
      }

      router.push(`/dashboard/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка оновлення клієнта')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Завантаження...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${clientId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Редагування клієнта</h1>
          <p className="text-muted-foreground mt-2">
            Оновіть інформацію про клієнта
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Основні дані</CardTitle>
          <CardDescription>Заповніть поля для оновлення інформації</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Ім'я клієнта *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Введіть ім'я клієнта"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+38 (0XX) XXX-XX-XX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Компанія</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Назва компанії"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Примітки</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Додаткова інформація про клієнта"
                className="min-h-[120px]"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Збереження...' : 'Зберегти'}
              </Button>
              <Link href={`/dashboard/clients/${clientId}`}>
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
