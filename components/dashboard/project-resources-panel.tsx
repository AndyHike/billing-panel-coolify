'use client'

import { useState } from 'react'
import {
  ChevronDown,
  Server,
  Database,
  Loader2,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'

interface Resource {
  uuid: string
  name: string
  type: string
  status: string
  environment_id?: string
}

interface ProjectResourcesPanelProps {
  projectUuid: string
  projectName: string
}

interface ResourceDetailsModalProps {
  resource: Resource
  projectUuid: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ResourceDetailsModal({ resource, projectUuid, open, onOpenChange }: ResourceDetailsModalProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [backups, setBackups] = useState<any[]>([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [showBackups, setShowBackups] = useState(false)

  const isDatabase =
    resource.type.toLowerCase().includes('database') ||
    resource.type.toLowerCase().includes('postgresql')

  async function loadDetails() {
    if (!open || details) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(
        `/api/projects/${projectUuid}/resources/${resource.uuid}`
      )
      if (!response.ok) {
        throw new Error('Помилка отримання деталей')
      }
      const data = await response.json()
      setDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setLoading(false)
    }
  }

  // Завантажуємо деталі коли модальне вікно відкривається
  if (open && !details && !loading && !error) {
    loadDetails()
  }

  async function createAndDownloadBackup() {
    setCreatingBackup(true)
    setError('')
    try {
      // Запрошуємо новий бекап
      const response = await fetch('/api/database-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUuid: resource.uuid }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Помилка створення бекапу')
      }

      console.log('[v0] Backup created, waiting 2 seconds before download...')
      
      // Чекаємо 2 секунди щоб бекап був готовий
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Завантажуємо останній бекап
      const downloadResponse = await fetch(
        `/api/database-backup/download?database=${resource.uuid}`
      )

      if (!downloadResponse.ok) {
        throw new Error('Помилка завантаження бекапу')
      }

      const blob = await downloadResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${resource.name}-${new Date().getTime()}.sql`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('[v0] Backup error:', err)
      setError(err instanceof Error ? err.message : 'Помилка створення бекапу')
    } finally {
      setCreatingBackup(false)
    }
  }

  async function loadBackups() {
    setBackupsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/database-backup?database=${resource.uuid}`)
      if (!response.ok) {
        throw new Error('Помилка отримання бекапів')
      }
      const data = await response.json()
      setBackups(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setBackupsLoading(false)
    }
  }

  async function createBackup() {
    setCreatingBackup(true)
    setError('')
    try {
      const response = await fetch('/api/database-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUuid: resource.uuid }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Помилка створення бекапу')
      }

      console.log('[v0] Backup created, waiting 2 seconds before refresh...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      loadBackups()
    } catch (err) {
      console.error('[v0] Backup error:', err)
      setError(err instanceof Error ? err.message : 'Помилка створення бекапу')
    } finally {
      setCreatingBackup(false)
    }
  }

  async function downloadBackup(backup: any) {
    try {
      const response = await fetch(`/api/database-backup/download?backup=${backup.uuid}`)
      if (!response.ok) {
        throw new Error('Помилка завантаження бекапу')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.name || backup.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('[v0] Backup download error:', err)
      setError(err instanceof Error ? err.message : 'Помилка')
    }
  }

  // Завантажуємо деталі коли модальне вікно відкривається
  if (open && !details && !loading && !error) {
    loadDetails()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDatabase ? (
              <Database className="h-5 w-5" />
            ) : (
              <Server className="h-5 w-5" />
            )}
            {resource.name}
          </DialogTitle>
          <DialogDescription>
            {resource.type}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {details && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Статус:</div>
              <Badge variant="outline">{resource.status}</Badge>
              
              {details.database_name && (
                <>
                  <div className="text-muted-foreground">БД:</div>
                  <div className="font-mono text-xs">{details.database_name}</div>
                </>
              )}
              
              {details.postgres_user && (
                <>
                  <div className="text-muted-foreground">Користувач:</div>
                  <div className="font-mono text-xs">{details.postgres_user}</div>
                </>
              )}
              
              {details.postgres_password && (
                <>
                  <div className="text-muted-foreground">Пароль:</div>
                  <div className="font-mono text-xs break-all">••••••••</div>
                </>
              )}
            </div>

            {isDatabase && (
              <div className="border-t pt-3">
                <Button
                  className="w-full"
                  size="sm"
                  disabled={creatingBackup}
                  onClick={createAndDownloadBackup}
                >
                  {creatingBackup ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Бекап та завантаження...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Бекап та завантажити
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ProjectResourcesPanel({ projectUuid, projectName }: ProjectResourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [showModal, setShowModal] = useState(false)

  async function loadResources() {
    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setLoading(true)
    setError('')
    setIsExpanded(true)

    try {
      const response = await fetch(`/api/projects/${projectUuid}/resources`)
      if (!response.ok) {
        throw new Error('Помилка отримання ресурсів')
      }
      const data = await response.json()
      setResources(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка')
      setIsExpanded(false)
    } finally {
      setLoading(false)
    }
  }

  const getResourceIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('database') || lowerType.includes('postgresql')) {
      return <Database className="h-4 w-4" />
    }
    return <Server className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('running')) return 'default'
    if (lowerStatus.includes('exited')) return 'secondary'
    if (lowerStatus.includes('paused')) return 'outline'
    return 'outline'
  }

  const getStatusLabel = (status: string) => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('running')) return 'Запущено'
    if (lowerStatus.includes('exited')) return 'Зупинено'
    if (lowerStatus.includes('paused')) return 'На паузі'
    return status
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={loadResources}
        disabled={loading}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
          Ресурси ({resources.length})
        </span>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </Button>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      {isExpanded && (
        <div className="pl-4 space-y-2">
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Немає ресурсів</p>
          ) : (
            resources.map((resource) => (
              <Card 
                key={resource.uuid} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedResource(resource)
                  setShowModal(true)
                }}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getResourceIcon(resource.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{resource.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{resource.type}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(resource.status) as any} className="text-xs whitespace-nowrap">
                      {getStatusLabel(resource.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          projectUuid={projectUuid}
          open={showModal}
          onOpenChange={setShowModal}
        />
      )}
    </div>
  )
}
