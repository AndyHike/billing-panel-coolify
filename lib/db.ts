import { Pool } from 'pg'

let poolInstance: Pool | null = null

export function getDb() {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL
    
    // Якщо DATABASE_URL вже містить sslmode, не додаємо ssl параметр окремо
    const hasSSLMode = connectionString?.includes('sslmode=')
    
    poolInstance = new Pool({
      connectionString,
      // Використовуємо ssl тільки якщо в URL немає sslmode
      ...(hasSSLMode ? {} : {
        ssl: {
          rejectUnauthorized: false
        }
      }),
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
