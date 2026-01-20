import { query } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { ClientProjectsManager } from '@/components/dashboard/client-projects-manager'

async function getClient(id: string) {
  const clientResult = await query('SELECT * FROM clients WHERE id = $1', [id])

  if (clientResult.rows.length === 0) {
    notFound()
  }

  const client = clientResult.rows[0]

  // Отримуємо проекти клієнта
  const projectsResult = await query(
    `SELECT 
      cp.*,
      p.id as project_id,
      p.name as project_name,
      p.coolify_uuid,
      p.description as project_description
     FROM client_projects cp
     JOIN projects p ON cp.project_id = p.id
     WHERE cp.client_id = $1
     ORDER BY cp.created_at DESC`,
    [id]
  )

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    notes: client.notes,
    createdAt: client.created_at,
    updatedAt: client.updated_at,
    projects: projectsResult.rows.map(p => ({
      id: p.id,
      startDate: p.start_date,
      endDate: p.end_date,
      isActive: p.status === 'active',
      isPaused: p.status === 'paused',
      project: {
        id: p.project_id,
        name: p.project_name,
        coolifyUuid: p.coolify_uuid,
      }
    })),
  }
}

async function getAvailableProjects() {
  const result = await query('SELECT id, name, coolify_uuid FROM projects ORDER BY name ASC')
  return result.rows.map(p => ({
    id: p.id,
    name: p.name,
    coolifyUuid: p.coolify_uuid,
  }))
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [client, availableProjects] = await Promise.all([
    getClient(id),
    getAvailableProjects(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Інформація про клієнта */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Інформація про клієнта</CardTitle>
            <CardDescription>Основні дані</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
            </div>

            {client.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href={`tel:${client.phone}`} className="hover:underline">
                  {client.phone}
                </a>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Створено{' '}
                {format(new Date(client.createdAt), 'dd MMMM yyyy', { locale: uk })}
              </span>
            </div>

            {client.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Примітки:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Управління проектами */}
        <div className="md:col-span-2">
          <ClientProjectsManager
            clientId={client.id}
            clientProjects={client.projects}
            availableProjects={availableProjects}
          />
        </div>
      </div>
    </div>
  )
}
