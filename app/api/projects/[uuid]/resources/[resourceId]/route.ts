import { NextRequest, NextResponse } from 'next/server'
import { coolify } from '@/lib/coolify'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string; resourceId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uuid: projectUuid, resourceId } = await params

    // Отримуємо ресурс з Coolify
    const resource = await coolify.getResourceDetails(resourceId)

    if (!resource) {
      return NextResponse.json({ error: 'Ресурс не знайдений' }, { status: 404 })
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error('[v0] Error fetching resource details:', error)
    return NextResponse.json(
      { error: 'Помилка отримання деталей ресурсу' },
      { status: 500 }
    )
  }
}
