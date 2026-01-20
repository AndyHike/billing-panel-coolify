import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Додавання проекту до клієнта
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientId } = await params
    const body = await request.json()
    const { projectId, startDate, endDate, notes } = body

    if (!projectId || !endDate) {
      return NextResponse.json(
        { error: 'projectId та endDate обов\'язкові' },
        { status: 400 }
      )
    }

    // Перевіряємо чи проект вже доданий до клієнта
    const existingResult = await query(
      'SELECT id FROM client_projects WHERE client_id = $1 AND project_id = $2',
      [clientId, projectId]
    )

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Цей проект вже доданий до клієнта' },
        { status: 400 }
      )
    }

    // Створюємо зв'язок
    const result = await query(
      `INSERT INTO client_projects (client_id, project_id, start_date, end_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [clientId, projectId, startDate || new Date().toISOString(), endDate, notes || null]
    )

    // Отримуємо повну інформацію з проектом
    const fullResult = await query(
      `SELECT cp.*, p.name as project_name, p.coolify_uuid, p.description as project_description
       FROM client_projects cp
       JOIN projects p ON cp.project_id = p.id
       WHERE cp.id = $1`,
      [result.rows[0].id]
    )

    return NextResponse.json(fullResult.rows[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error adding project to client:', error)
    return NextResponse.json(
      { error: 'Помилка додавання проекту' },
      { status: 500 }
    )
  }
}
