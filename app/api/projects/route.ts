import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Отримати всі проекти
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await query(
      `SELECT 
        id,
        name,
        coolify_uuid,
        description,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM client_projects cp WHERE cp.project_id = projects.id) as clients_count,
        (SELECT COUNT(*) FROM client_projects cp WHERE cp.project_id = projects.id AND cp.status = 'active') as active_count
       FROM projects 
       ORDER BY name ASC`
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('[v0] Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Помилка отримання проектів' },
      { status: 500 }
    )
  }
}

// Створити новий проект
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, coolifyUuid, description } = body

    if (!name || !coolifyUuid) {
      return NextResponse.json(
        { error: 'Назва та UUID обов\'язкові' },
        { status: 400 }
      )
    }

    const existingResult = await query(
      'SELECT id FROM projects WHERE coolify_uuid = $1',
      [coolifyUuid]
    )

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Проект з таким UUID вже існує' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO projects (name, coolify_uuid, description) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, coolifyUuid, description || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating project:', error)
    return NextResponse.json(
      { error: 'Помилка створення проекту' },
      { status: 500 }
    )
  }
}
