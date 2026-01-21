'use client'

import { useState } from 'react'
import { ChevronDown, Server, Database, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

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

export function ProjectResourcesPanel({ projectUuid, projectName }: ProjectResourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
              <Card key={resource.uuid} className="hover:shadow-md transition-shadow">
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
    </div>
  )
}
