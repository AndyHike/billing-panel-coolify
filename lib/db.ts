import { Pool } from 'pg'

let poolInstance: Pool | null = null

export function getDb() {
  if (!poolInstance) {
    let connectionString = process.env.DATABASE_URL
    
    // Видаляємо sslmode з URL, якщо він є, бо ми налаштуємо SSL окремо
    if (connectionString?.includes('sslmode=')) {
      const url = new URL(connectionString)
      url.searchParams.delete('sslmode')
      connectionString = url.toString()
    }
    
    poolInstance = new Pool({
      connectionString,
      // Завжди використовуємо SSL але без перевірки сертифікату
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return poolInstance
}

// Export pool for compatibility
export const pool = getDb()

export async function query(text: string, params?: any[]) {
  const db = getDb()
  try {
    const result = await db.query(text, params)
    return result
  } catch (error) {
    console.error('[v0] Database query error:', error)
    throw error
  }
}
