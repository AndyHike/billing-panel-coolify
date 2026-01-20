'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Calendar, FolderGit2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { uk } from 'date-fns/locale'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  createdAt: Date
  projects: Array<{
    id: string
    endDate: Date
    isActive: boolean
    isPaused: boolean
    project: {
      id: string
      name: string
      coolifyUuid: string
    }
  }>
}

interface ClientsListProps {
  clients: Client[]
}

export function ClientsList({ clients }: ClientsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => {
        const activeProjects = client.projects?.filter(p => p.isActive && !p.isPaused).length || 0
        const pausedProjects = client.projects?.filter(p => p.isPaused).length || 0
        
        // Безпечна обробка дати
        let dateText = 'недавно'
        try {
          if (client.createdAt) {
            const date = new Date(client.createdAt)
            if (!isNaN(date.getTime())) {
              dateText = formatDistanceToNow(date, { addSuffix: true, locale: uk })
            }
          }
        } catch (e) {
          console.error('[v0] Date formatting error:', e)
        }
        
        return (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {dateText}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  {activeProjects > 0 && (
                    <Badge variant="default" className="text-xs">
                      {activeProjects} активних
                    </Badge>
                  )}
                  {pausedProjects > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {pausedProjects} на паузі
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FolderGit2 className="h-4 w-4" />
                  <span>{client.projects?.length || 0} проектів</span>
                </div>
              </div>

              <Link href={`/dashboard/clients/${client.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Переглянути деталі
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
