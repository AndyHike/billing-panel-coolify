import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Видалення проекту від клієнта
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientProjectId } = await params

    await query('DELETE FROM client_projects WHERE id = $1', [clientProjectId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting client project:', error)
    return NextResponse.json(
      { error: 'Помилка видалення проекту' },
      { status: 500 }
    )
  }
}
