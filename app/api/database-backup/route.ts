import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { coolify } from '@/lib/coolify'

// GET /api/database-backup - отримати список бекапів
// POST /api/database-backup - запросити новий бекап
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const databaseUuid = request.nextUrl.searchParams.get('database')
    if (!databaseUuid) {
      return NextResponse.json(
        { error: 'Missing database UUID' },
        { status: 400 }
      )
    }

    console.log(`[v0] Fetching backups for database ${databaseUuid}`)
    const backups = await coolify.getDatabaseBackups(databaseUuid)

    return NextResponse.json({
      success: true,
      backups,
      total: backups.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Помилка отримання бекапів', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { databaseUuid } = await request.json()
    if (!databaseUuid) {
      return NextResponse.json(
        { error: 'Missing database UUID' },
        { status: 400 }
      )
    }

    console.log(`[v0] Creating backup for database ${databaseUuid}`)
    const success = await coolify.createDatabaseBackup(databaseUuid)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Бекап запрошено успішно',
      })
    } else {
      return NextResponse.json(
        { error: 'Помилка запиту бекапу' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[v0] Error creating backup:', error)
    return NextResponse.json(
      { error: 'Помилка створення бекапу', details: String(error) },
      { status: 500 }
    )
  }
}
