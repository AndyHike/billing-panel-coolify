import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/database/[table]/schema - отримати схему таблиці
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

    console.log(`[v0] Fetching schema for table: ${table}`)

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

    // Отримуємо схему таблиці
    const schemaResult = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position ASC
    `, [table])

    console.log(`[v0] Found ${schemaResult.rows.length} columns in table ${table}`)

    return NextResponse.json({
      success: true,
      table,
      columns: schemaResult.rows,
      total: schemaResult.rows.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching schema:', error)
    return NextResponse.json(
      { error: 'Помилка отримання схеми', details: String(error) },
      { status: 500 }
    )
  }
}
