import { Pool, QueryResult } from 'pg'

interface ResourceDatabase {
  host: string
  port: number
  database: string
  user: string
  password: string
}

// Кеш активних з'єднань за resourceId
const connectionCache: Map<string, Pool> = new Map()

export async function getResourceDatabaseConnection(
  resourceId: string,
  resourceDetails: any
): Promise<Pool> {
  // Перевіряємо кеш
  if (connectionCache.has(resourceId)) {
    const pool = connectionCache.get(resourceId)!
    // Перевіряємо чи пул ще живий
    try {
      await pool.query('SELECT 1')
      return pool
    } catch (err) {
      // Якщо з'єднання мертве, видаляємо з кешу
      connectionCache.delete(resourceId)
    }
  }

  console.log(`[v0] Creating new database connection for resource ${resourceId}`)

  // Формуємо параметри підключення
  const dbConfig: ResourceDatabase = {
    host: resourceDetails.postgres_host || resourceDetails.host,
    port: resourceDetails.postgres_port || 5432,
    database: resourceDetails.database_name || 'postgres',
    user: resourceDetails.postgres_user || 'postgres',
    password: resourceDetails.postgres_password || '',
  }

  console.log(`[v0] Database config: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)

  // Створюємо новий пул
  const pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    max: 5, // Максимум 5 з'єднань на ресурс
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

  // Перевіряємо з'єднання
  try {
    await pool.query('SELECT 1')
    console.log(`[v0] Successfully connected to resource database`)
    connectionCache.set(resourceId, pool)
    return pool
  } catch (err) {
    console.error(`[v0] Failed to connect to resource database:`, err)
    throw err
  }
}

export async function queryResourceDatabase(
  resourceId: string,
  resourceDetails: any,
  sql: string,
  params?: any[]
): Promise<QueryResult> {
  const pool = await getResourceDatabaseConnection(resourceId, resourceDetails)
  return pool.query(sql, params)
}

export function closeResourceConnection(resourceId: string) {
  const pool = connectionCache.get(resourceId)
  if (pool) {
    pool.end()
    connectionCache.delete(resourceId)
    console.log(`[v0] Closed database connection for resource ${resourceId}`)
  }
}
