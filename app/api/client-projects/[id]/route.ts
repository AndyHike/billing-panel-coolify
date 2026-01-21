import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Оновлення проекту (дата закінчення)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientProjectId } = await params
    const body = await request.json()
    const { endDate } = body

    if (!endDate) {
      return NextResponse.json(
        { error: 'Дата закінчення обов\'язкова' },
        { status: 400 }
      )
    }

    const result = await query(
      `UPDATE client_projects 
       SET end_date = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [new Date(endDate).toISOString(), clientProjectId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Проект не знайдений' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('[v0] Error updating client project:', error)
    return NextResponse.json(
      { error: 'Помилка оновлення проекту' },
      { status: 500 }
    )
  }
}

// Видалення проекту від клієнта
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientProjectId } = await params

    await query('DELETE FROM client_projects WHERE id = $1', [clientProjectId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting client project:', error)
    return NextResponse.json(
      { error: 'Помилка видалення проекту' },
      { status: 500 }
    )
  }
}
