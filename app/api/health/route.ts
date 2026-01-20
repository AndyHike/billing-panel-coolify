import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Health check endpoint для Docker
export async function GET() {
  try {
    // Перевіряємо підключення до БД
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
