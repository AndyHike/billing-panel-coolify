import { query } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { RefreshCw, FolderGit2, Users } from 'lucide-react'

async function getProjects() {
  const result = await query(`
    SELECT 
      p.*,
      COUNT(DISTINCT cp.id) as clients_count,
      COUNT(DISTINCT CASE WHEN cp.status = 'active' THEN cp.id END) as active_count
    FROM projects p
    LEFT JOIN client_projects cp ON p.id = cp.project_id
    GROUP BY p.id
    ORDER BY p.name ASC
  `)
  
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    coolifyUuid: row.coolify_uuid,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    clientsCount: parseInt(row.clients_count) || 0,
    activeCount: parseInt(row.active_count) || 0,
  }))
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Проекти</h1>
          <p className="text-muted-foreground mt-2">
            Всі проекти з Coolify
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/projects/new">
            <Button variant="outline">
              <FolderGit2 className="mr-2 h-4 w-4" />
              Додати вручну
            </Button>
          </Link>
          <Link href="/dashboard/projects/sync">
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Синхронізувати
            </Button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Немає проектів</CardTitle>
            <CardDescription>
              Синхронізуйте проекти з Coolify щоб побачити їх тут
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/dashboard/projects/sync">
              <Button>
                <RefreshCw className="mr-2 h-4 w-4" />
                Синхронізувати проекти
              </Button>
            </Link>
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
                  {project.status && (
                    <Badge 
                      variant={project.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs ml-2"
                    >
                      {project.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{project.clientsCount} клієнтів</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FolderGit2 className="h-4 w-4" />
                    <span className="font-mono text-xs truncate">
                      {project.coolifyUuid}
                    </span>
                  </div>
                  {project.activeCount > 0 && (
                    <Badge variant="default" className="text-xs">
                      {project.activeCount} активних
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
