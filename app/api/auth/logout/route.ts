import { NextResponse } from 'next/server'
import { deleteAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await deleteAuthCookie()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { error: 'Помилка виходу' },
      { status: 500 }
    )
  }
}
