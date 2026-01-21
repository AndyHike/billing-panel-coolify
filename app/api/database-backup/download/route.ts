import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { coolify } from '@/lib/coolify'

// GET /api/database-backup/download - завантажити бекап
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const databaseUuid = request.nextUrl.searchParams.get('database')
    const filename = request.nextUrl.searchParams.get('filename')

    if (!databaseUuid || !filename) {
      return NextResponse.json(
        { error: 'Missing database UUID or filename' },
        { status: 400 }
      )
    }

    console.log(`[v0] Downloading backup: ${filename}`)
    const fileBlob = await coolify.getDatabaseBackupFile(databaseUuid, filename)

    if (!fileBlob) {
      return NextResponse.json(
        { error: 'Помилка завантаження бекапу' },
        { status: 500 }
      )
    }

    return new NextResponse(fileBlob, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[v0] Error downloading backup:', error)
    return NextResponse.json(
      { error: 'Помилка завантаження', details: String(error) },
      { status: 500 }
    )
  }
}
