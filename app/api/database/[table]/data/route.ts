import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/database/[table]/data - отримати дані таблиці
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { table } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    console.log(`[v0] Fetching data from table: ${table} (page: ${page}, limit: ${limit})`)

    // Перевіряємо, що таблиця існує
    const tableExists = await query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema NOT IN ('pg_catalog', 'information_schema')
      )
    `, [table])

    if (!tableExists.rows[0].exists) {
      return NextResponse.json(
        { error: 'Таблиця не знайдена' },
        { status: 404 }
      )
    }

    // Отримуємо загальну кількість рядків
    const countResult = await query(
      `SELECT COUNT(*) as total FROM "${table}"`
    )
    const total = parseInt(countResult.rows[0].total)

    // Отримуємо дані таблиці
    const dataResult = await query(
      `SELECT * FROM "${table}" ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    console.log(`[v0] Fetched ${dataResult.rows.length} rows from ${table} (total: ${total})`)

    return NextResponse.json({
      success: true,
      table,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching table data:', error)
    return NextResponse.json(
      { error: 'Помилка отримання даних таблиці', details: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/database/[table]/data - додати новий рядок
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { table } = await params
    const body = await request.json()

    console.log(`[v0] Adding new row to table: ${table}`)

    // Побудувати динамічний SQL запит
    const columns = Object.keys(body)
    const values = Object.values(body)
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    const columnNames = columns.map(c => `"${c}"`).join(', ')

    const insertQuery = `
      INSERT INTO "${table}" (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `

    const result = await query(insertQuery, values)

    console.log(`[v0] Successfully inserted row into ${table}`)

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('[v0] Error inserting row:', error)
    return NextResponse.json(
      { error: 'Помилка додавання рядка', details: String(error) },
      { status: 500 }
    )
  }
}
