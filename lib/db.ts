import { Pool } from 'pg'

let pool: Pool | null = null

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return pool
}

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
