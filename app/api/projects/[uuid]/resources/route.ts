import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { coolify } from '@/lib/coolify'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uuid } = await params

    if (!uuid) {
      return NextResponse.json(
        { error: 'Project UUID required' },
        { status: 400 }
      )
    }

    const resources = await coolify.getProjectResources(uuid)

    return NextResponse.json(resources)
  } catch (error) {
    console.error('[v0] Error fetching project resources:', error)
    return NextResponse.json(
      { error: 'Помилка отримання ресурсів' },
      { status: 500 }
    )
  }
}
