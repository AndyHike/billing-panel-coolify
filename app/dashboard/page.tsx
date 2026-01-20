import { query } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FolderGit2, Activity, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getDashboardStats() {
  const [clientsResult, projectsResult, activeResult, expiringResult] = await Promise.all([
    query('SELECT COUNT(*) FROM clients'),
    query('SELECT COUNT(*) FROM projects'),
    query("SELECT COUNT(*) FROM client_projects WHERE status = 'active'"),
    query(`
      SELECT COUNT(*) FROM client_projects 
      WHERE status = 'active' 
        AND end_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
        AND end_date >= CURRENT_TIMESTAMP
    `),
  ])

  return {
    clientsCount: Number.parseInt(clientsResult.rows[0].count),
    projectsCount: Number.parseInt(projectsResult.rows[0].count),
    activeProjects: Number.parseInt(activeResult.rows[0].count),
    expiringProjects: Number.parseInt(expiringResult.rows[0].count),
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const cards = [
    {
      title: 'Клієнти',
      value: stats.clientsCount,
      description: 'Всього клієнтів в системі',
      icon: Users,
      href: '/dashboard/clients',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Проекти',
      value: stats.projectsCount,
      description: 'Всього проектів в системі',
      icon: FolderGit2,
      href: '/dashboard/projects',
      iconColor: 'text-green-500',
    },
    {
      title: 'Активні',
      value: stats.activeProjects,
      description: 'Активних підписок',
      icon: Activity,
      href: '/dashboard/clients',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Закінчуються',
      value: stats.expiringProjects,
      description: 'Підписок закінчується за 7 днів',
      icon: Clock,
      href: '/dashboard/clients',
      iconColor: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Панель управління</h1>
        <p className="text-muted-foreground mt-2">
          Управління клієнтами та проектами Coolify
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Швидкі дії</CardTitle>
            <CardDescription>Основні операції</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/clients/new">
              <Button className="w-full bg-transparent" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Створити клієнта
              </Button>
            </Link>
            <Link href="/dashboard/projects/sync">
              <Button className="w-full bg-transparent" variant="outline">
                <FolderGit2 className="mr-2 h-4 w-4" />
                Синхронізувати проекти
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Інформація</CardTitle>
            <CardDescription>Про систему</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Версія:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">База даних:</span>
              <span className="font-medium">PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coolify API:</span>
              <span className="font-medium">Підключено</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
