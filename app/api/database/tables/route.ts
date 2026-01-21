import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { coolify } from '@/lib/coolify'
import { queryResourceDatabase } from '@/lib/db-dynamic'

// GET /api/database/tables - отримати список всіх таблиць БД
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectUuid = request.nextUrl.searchParams.get('project')
    const resourceUuid = request.nextUrl.searchParams.get('resource')

    console.log('[v0] Fetching database tables...')
    if (projectUuid && resourceUuid) {
      console.log(`[v0] Project: ${projectUuid}, Resource: ${resourceUuid}`)
    }

    // Якщо це запит для проектної БД - отримуємо дані через Coolify
    if (projectUuid && resourceUuid) {
      const resourceDetails = await coolify.getResourceDetails(resourceUuid)
      if (!resourceDetails) {
        return NextResponse.json(
          { error: 'Ресурс не знайдено' },
          { status: 404 }
        )
      }

      console.log('[v0] Resource found, connecting to resource database...')

      try {
        // Підключаємось до БД ресурсу та отримуємо таблиці
        const result = await queryResourceDatabase(
          resourceUuid,
          resourceDetails,
          `
          SELECT 
            table_name,
            table_schema,
            (SELECT COUNT(*) FROM information_schema.columns 
             WHERE table_name = t.table_name) as column_count
          FROM information_schema.tables t
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          ORDER BY table_name ASC
        `
        )

        console.log(`[v0] Found ${result.rows.length} tables in resource database`)

        return NextResponse.json({
          success: true,
          resourceName: resourceDetails.name,
          databaseName: resourceDetails.database_name,
          tables: result.rows,
          total: result.rows.length,
        })
      } catch (dbError) {
        console.error('[v0] Error connecting to resource database:', dbError)
        return NextResponse.json(
          {
            error: 'Помилка підключення до БД ресурсу',
            details: dbError instanceof Error ? dbError.message : String(dbError),
          },
          { status: 500 }
        )
      }
    }

    // Запит до основної БД
    const result = await query(`
      SELECT 
        table_name,
        table_schema,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.table_name) as column_count
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
