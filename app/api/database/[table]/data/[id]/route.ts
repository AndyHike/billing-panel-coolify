import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PUT /api/database/[table]/data/[id] - оновити рядок
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { table, id } = await params
    const body = await request.json()

    console.log(`[v0] Updating row in table: ${table}, id: ${id}`)

    // Побудувати динамічний SQL запит
    const updates = Object.entries(body)
      .map(([key], idx) => `"${key}" = $${idx + 1}`)
      .join(', ')
    const values = [...Object.values(body), id]

    const updateQuery = `
      UPDATE "${table}"
      SET ${updates}
      WHERE id = $${Object.keys(body).length + 1}
      RETURNING *
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Рядок не знайдено' },
        { status: 404 }
      )
    }

    console.log(`[v0] Successfully updated row in ${table}`)

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('[v0] Error updating row:', error)
    return NextResponse.json(
      { error: 'Помилка оновлення рядка', details: String(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/database/[table]/data/[id] - видалити рядок
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { table, id } = await params

    console.log(`[v0] Deleting row from table: ${table}, id: ${id}`)

    const deleteQuery = `
      DELETE FROM "${table}"
      WHERE id = $1
      RETURNING *
    `

    const result = await query(deleteQuery, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Рядок не знайдено' },
        { status: 404 }
      )
    }

    console.log(`[v0] Successfully deleted row from ${table}`)

    return NextResponse.json({
      success: true,
      message: 'Рядок видалено',
    })
  } catch (error) {
    console.error('[v0] Error deleting row:', error)
    return NextResponse.json(
      { error: 'Помилка видалення рядка', details: String(error) },
      { status: 500 }
    )
  }
}
