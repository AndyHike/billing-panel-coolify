import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Створення клієнта
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, company, notes } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Ім\'я клієнта обов\'язкове' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO clients (name, email, phone, company, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email || null, phone || null, company || null, notes || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating client:', error)
    return NextResponse.json(
      { error: 'Помилка створення клієнта' },
      { status: 500 }
    )
  }
}

// Отримання всіх клієнтів
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await query(`
      SELECT 
        c.*,
        COUNT(cp.id) as projects_count
      FROM clients c
      LEFT JOIN client_projects cp ON c.id = cp.client_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('[v0] Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Помилка отримання клієнтів' },
      { status: 500 }
    )
  }
}
