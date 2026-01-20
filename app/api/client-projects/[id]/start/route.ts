import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { coolify } from '@/lib/coolify'

// Запуск проекту
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientProjectId } = await params

    // Отримуємо ClientProject з даними проекту
    const result = await query(
      `SELECT cp.*, p.coolify_uuid 
       FROM client_projects cp
       JOIN projects p ON cp.project_id = p.id
       WHERE cp.id = $1`,
      [clientProjectId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'ClientProject не знайдено' },
        { status: 404 }
      )
    }

    const clientProject = result.rows[0]

    // Запускаємо всі ресурси проекту через Coolify API
    const success = await coolify.startProject(clientProject.coolify_uuid)

    if (!success) {
      return NextResponse.json(
        { error: 'Не вдалося запустити проект в Coolify' },
        { status: 500 }
      )
    }

    // Оновлюємо статус
    const updateResult = await query(
      `UPDATE client_projects SET status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [clientProjectId]
    )

    return NextResponse.json(updateResult.rows[0])
  } catch (error) {
    console.error('[v0] Error starting project:', error)
    return NextResponse.json(
      { error: 'Помилка запуску проекту' },
      { status: 500 }
    )
  }
}
