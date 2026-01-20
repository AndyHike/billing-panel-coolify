'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { RefreshCw, FolderGit2, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { syncProjectsAction } from '@/app/actions/sync-projects'

interface Project {
  id: string
  name: string
  coolify_uuid: string
  description: string | null
  created_at: string
  clients_count?: number
  active_count?: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    added: number
    updated: number
    error: string | null
  } | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('[v0] Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    try {
      const syncResult = await syncProjectsAction()
      setResult(syncResult)

      if (syncResult.success) {
        await loadProjects()
      }
    } catch (error) {
      console.error('[v0] Sync error:', error)
      setResult({
        success: false,
        added: 0,
        updated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Проекти</h1>
          <p className="text-muted-foreground mt-2">Всі проекти з Coolify</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/projects/new">
            <Button variant="outline">
              <FolderGit2 className="mr-2 h-4 w-4" />
              Додати вручну
            </Button>
          </Link>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Синхронізація...' : 'Синхронізувати'}
          </Button>
        </div>
      </div>

      {result && (
        <Card className={`${result.success ? 'border-green-200' : 'border-red-200'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <CardTitle className="text-lg">
                {result.success ? 'Синхронізація успішна' : 'Помилка синхронізації'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-2">
                <p>Додано: <span className="font-semibold">{result.added}</span></p>
                <p>Оновлено: <span className="font-semibold">{result.updated}</span></p>
              </div>
            ) : (
              <p className="text-red-700 text-sm">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Завантаження проектів...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Немає проектів</CardTitle>
            <CardDescription>
              Синхронізуйте проекти з Coolify щоб побачити їх тут
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Синхронізувати тепер
            </Button>
            <Link href="/dashboard/projects/new">
              <Button variant="outline">
                <FolderGit2 className="mr-2 h-4 w-4" />
                Додати вручну
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="text-xs line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  {project.clients_count && project.clients_count > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{project.clients_count} клієнтів</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FolderGit2 className="h-4 w-4" />
                    <span className="font-mono text-xs truncate">
                      {project.coolify_uuid}
                    </span>
                  </div>
                  {project.active_count && project.active_count > 0 && (
                    <Badge variant="default" className="text-xs">
                      {project.active_count} активних
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
