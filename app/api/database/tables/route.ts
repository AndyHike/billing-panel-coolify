import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/database/tables - отримати список всіх таблиць БД
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Fetching all database tables...')

    // Запит до PostgreSQL інформаційної схеми
    const result = await query(`
      SELECT 
        table_name,
        table_schema,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.table_name) as column_count,
        (SELECT COUNT(*) FROM ${'"information_schema"."tables"'} 
         WHERE table_name = t.table_name) as row_estimate
      FROM information_schema.tables t
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_name ASC
    `)

    console.log(`[v0] Found ${result.rows.length} tables`)

    return NextResponse.json({
      success: true,
      tables: result.rows,
      total: result.rows.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching tables:', error)
    return NextResponse.json(
      { error: 'Помилка отримання таблиць', details: String(error) },
      { status: 500 }
    )
  }
}
