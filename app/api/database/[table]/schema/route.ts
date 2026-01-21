import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { coolify } from '@/lib/coolify'
import { queryResourceDatabase } from '@/lib/db-dynamic'

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
    const projectUuid = request.nextUrl.searchParams.get('project')
    const resourceUuid = request.nextUrl.searchParams.get('resource')

    console.log(`[v0] Fetching schema for table: ${table}`)
    if (projectUuid && resourceUuid) {
      console.log(`[v0] Project: ${projectUuid}, Resource: ${resourceUuid}`)
    }

    // Якщо це запит для проектної БД
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
        // Перевіряємо чи таблиця існує в БД ресурсу
        const tableExists = await queryResourceDatabase(
          resourceUuid,
          resourceDetails,
          `
          SELECT EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1 AND table_schema NOT IN ('pg_catalog', 'information_schema')
          )
        `,
          [table]
        )

        if (!tableExists.rows[0].exists) {
          return NextResponse.json(
            { error: 'Таблиця не знайдена' },
            { status: 404 }
          )
        }

        // Отримуємо схему таблиці з БД ресурсу
        const schemaResult = await queryResourceDatabase(
          resourceUuid,
          resourceDetails,
          `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            ordinal_position
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position ASC
        `,
          [table]
        )

        console.log(`[v0] Found ${schemaResult.rows.length} columns in resource database`)

        return NextResponse.json({
          success: true,
          table,
          resourceName: resourceDetails.name,
          columns: schemaResult.rows,
          total: schemaResult.rows.length,
        })
      } catch (dbError) {
        console.error('[v0] Error querying resource database:', dbError)
        return NextResponse.json(
          {
            error: 'Помилка отримання схеми',
            details: dbError instanceof Error ? dbError.message : String(dbError),
          },
          { status: 500 }
        )
      }
    }

    // Запит до основної БД
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
