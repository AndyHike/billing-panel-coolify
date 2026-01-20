import { query } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ClientsList } from '@/components/dashboard/clients-list'

async function getClients() {
  const result = await query(`
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      c.company,
      c.notes,
      c.created_at,
      c.updated_at
    FROM clients c
    ORDER BY c.created_at DESC
  `)
  
  // Отримуємо проекти для кожного клієнта
  const clientsWithProjects = await Promise.all(
    result.rows.map(async (client) => {
      const projectsResult = await query(
        `SELECT 
          cp.id,
          cp.end_date,
          cp.status,
          p.id as project_id,
          p.name as project_name,
          p.coolify_uuid
         FROM client_projects cp
         JOIN projects p ON cp.project_id = p.id
         WHERE cp.client_id = $1`,
        [client.id]
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
          endDate: p.end_date,
          isActive: p.status === 'active',
          isPaused: p.status === 'paused',
          project: {
            id: p.project_id,
            name: p.project_name,
            coolifyUuid: p.coolify_uuid,
          }
        }))
      }
    })
  )
  
  return clientsWithProjects
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Клієнти</h1>
          <p className="text-muted-foreground mt-2">
            Управління клієнтами та їх проектами
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Додати клієнта
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Немає клієнтів</CardTitle>
            <CardDescription>
              Почніть з додавання першого клієнта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Створити клієнта
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ClientsList clients={clients} />
      )}
    </div>
  )
}
