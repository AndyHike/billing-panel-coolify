'use client'

import { useState } from 'react'
import {
  ChevronDown,
  Server,
  Database,
  Loader2,
  Download,
  Plus,
  RefreshCw,
  ExternalLink,
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
  const [backups, setBackups] = useState<any[]>([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [showBackups, setShowBackups] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)

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

  async function loadBackups() {
    setBackupsLoading(true)
    try {
      const response = await fetch(
        `/api/database-backup?database=${resource.uuid}`
      )
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      }
    } catch (err) {
      console.error('[v0] Error loading backups:', err)
    } finally {
      setBackupsLoading(false)
    }
  }

  async function createBackup() {
    setCreatingBackup(true)
    try {
      const response = await fetch('/api/database-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUuid: resource.uuid }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[v0] Backup created:', result)
        // Перезавантажимо список бекапів
        await loadBackups()
      }
    } catch (err) {
      console.error('[v0] Error creating backup:', err)
    } finally {
      setCreatingBackup(false)
    }
  }

  async function downloadBackup(backupData: any) {
    try {
      const filename = backupData.name || backupData.filename
      console.log('[v0] Downloading backup:', filename)

      const response = await fetch(
        `/api/database-backup/download?database=${resource.uuid}&filename=${encodeURIComponent(filename)}`
      )

      if (!response.ok) {
        throw new Error('Помилка завантаження')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('[v0] Download error:', err)
      alert('Помилка завантаження бекапу')
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
              <div className="border-t pt-3 space-y-2">
                <Button
                  className="w-full bg-transparent"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!showBackups) {
                      loadBackups()
                    }
                    setShowBackups(!showBackups)
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Бекапи ({backups.length})
                </Button>

                {showBackups && (
                  <div className="border rounded-lg p-2 space-y-2 bg-muted">
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={creatingBackup || backupsLoading}
                      onClick={createBackup}
                    >
                      {creatingBackup ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Створення...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Новий бекап
                        </>
                      )}
                    </Button>

                    {backupsLoading && (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}

                    {backups.length > 0 && (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {backups.map((backup, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-2 bg-background rounded text-xs"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-mono truncate">
                                {backup.name || backup.filename}
                              </p>
                              {backup.size && (
                                <p className="text-muted-foreground">
                                  {(backup.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => downloadBackup(backup)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!backupsLoading && backups.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Немає бекапів
                      </p>
                    )}
                  </div>
                )}
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
