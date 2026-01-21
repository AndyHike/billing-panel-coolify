'use client'

import { Input } from "@/components/ui/input"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Calendar, Play, Pause, Trash2, Plus, Edit2 } from 'lucide-react'
import { format, isPast, differenceInDays } from 'date-fns'
import { uk } from 'date-fns/locale'

interface Project {
  id: string
  name: string
  coolifyUuid: string
}

interface ClientProject {
  id: string
  startDate: Date
  endDate: Date
  isActive: boolean
  isPaused: boolean
  project: Project
}

interface ClientProjectsManagerProps {
  clientId: string
  clientProjects: ClientProject[]
  availableProjects: Project[]
}

export function ClientProjectsManager({
  clientId,
  clientProjects,
  availableProjects,
}: ClientProjectsManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [endDateTime, setEndDateTime] = useState('')

  // Проекти які ще не додані до клієнта
  const notAddedProjects = availableProjects.filter(
    (p) => !clientProjects.some((cp) => cp.project.id === p.id)
  )

  const handleAddProject = async () => {
    if (!selectedProjectId || !endDateTime) {
      setError('Оберіть проект та вкажіть дату/час закінчення')
      return
    }

    setError('')
    setLoading('add')

    try {
      const response = await fetch(`/api/clients/${clientId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          endDate: new Date(endDateTime).toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Помилка додавання проекту')
      }

      setShowAddForm(false)
      setSelectedProjectId('')
      setEndDateTime('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка додавання проекту')
    } finally {
      setLoading(null)
    }
  }

  const handleUpdateProjectDate = async (clientProjectId: string) => {
    if (!endDateTime) {
      setError('Вкажіть дату/час закінчення')
      return
    }

    setError('')
    setLoading(clientProjectId)

    try {
      const response = await fetch(`/api/client-projects/${clientProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endDate: new Date(endDateTime).toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Помилка оновлення дати')
      }

      setEditingProjectId(null)
      setEndDateTime('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка оновлення')
    } finally {
      setLoading(null)
    }
  }

  const handleToggleProject = async (clientProjectId: string, action: 'start' | 'stop') => {
    setError('')
    setLoading(clientProjectId)

    try {
      const response = await fetch(`/api/client-projects/${clientProjectId}/${action}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Помилка ${action === 'start' ? 'запуску' : 'зупинки'}`)
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка операції')
    } finally {
      setLoading(null)
    }
  }

  const handleRemoveProject = async (clientProjectId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей проект?')) {
      return
    }

    setError('')
    setLoading(clientProjectId)

    try {
      const response = await fetch(`/api/client-projects/${clientProjectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Помилка видалення')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка видалення')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Проекти клієнта</CardTitle>
            <CardDescription>Управління підпискою на проекти</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={notAddedProjects.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Додати проект
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Форма додавання проекту */}
        {showAddForm && (
          <Card className="border-dashed">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Проект</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {notAddedProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <DateTimePicker
                  label="Дата та час закінчення"
                  value={endDateTime}
                  onChange={setEndDateTime}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddProject} disabled={loading === 'add'} size="sm">
                  {loading === 'add' ? 'Додавання...' : 'Додати'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={loading === 'add'}
                  size="sm"
                >
                  Скасувати
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Список проектів */}
        {clientProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Немає проектів. Додайте перший проект.
          </div>
        ) : (
          <div className="space-y-3">
            {clientProjects.map((cp) => {
              const isExpired = isPast(new Date(cp.endDate))
              const daysLeft = differenceInDays(new Date(cp.endDate), new Date())
              const isEditing = editingProjectId === cp.id

              return (
                <Card key={cp.id} className={isExpired ? 'border-destructive/50' : ''}>
                  <CardContent className="pt-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <DateTimePicker
                          label="Нова дата та час закінчення"
                          value={endDateTime}
                          onChange={setEndDateTime}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateProjectDate(cp.id)}
                            disabled={loading === cp.id}
                            size="sm"
                          >
                            {loading === cp.id ? 'Оновлення...' : 'Зберегти'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingProjectId(null)
                              setEndDateTime('')
                            }}
                            disabled={loading === cp.id}
                            size="sm"
                          >
                            Скасувати
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{cp.project.name}</h4>
                            {cp.isPaused && <Badge variant="secondary">На паузі</Badge>}
                            {!cp.isPaused && cp.isActive && (
                              <Badge variant="default">Активний</Badge>
                            )}
                            {isExpired && <Badge variant="destructive">Термін минув</Badge>}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(cp.endDate), 'dd MMM yyyy HH:mm', { locale: uk })}
                            </span>
                            {!isExpired && (
                              <span>
                                {daysLeft > 0 ? `${daysLeft} днів залишилось` : 'Останній день'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProjectId(cp.id)
                              setEndDateTime(new Date(cp.endDate).toISOString())
                            }}
                            disabled={loading === cp.id}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {cp.isPaused ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleProject(cp.id, 'start')}
                              disabled={loading === cp.id}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleProject(cp.id, 'stop')}
                              disabled={loading === cp.id}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveProject(cp.id)}
                            disabled={loading === cp.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
