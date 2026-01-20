import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ClientsList } from '@/components/dashboard/clients-list'

async function getClients() {
  return prisma.client.findMany({
    include: {
      projects: {
        include: {
          project: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
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
