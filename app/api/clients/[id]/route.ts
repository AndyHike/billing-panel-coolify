import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Оновлення клієнта
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, phone, company, notes } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Ім\'я клієнта обов\'язкове' },
        { status: 400 }
      )
    }

    const result = await query(
      `UPDATE clients 
       SET name = $1, email = $2, phone = $3, company = $4, notes = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, email || null, phone || null, company || null, notes || null, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Клієнт не знайдений' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('[v0] Error updating client:', error)
    return NextResponse.json(
      { error: 'Помилка оновлення клієнта' },
      { status: 500 }
    )
  }
}

// Отримання клієнта
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Клієнт не знайдений' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('[v0] Error fetching client:', error)
    return NextResponse.json(
      { error: 'Помилка отримання клієнта' },
      { status: 500 }
    )
  }
}
