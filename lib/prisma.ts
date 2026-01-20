// Заглушка для сумісності - використовуйте lib/db.ts замість цього файлу
// Цей файл тимчасово експортує DB функціонал під назвою prisma

import { query, pool } from './db'

// Експортуємо query як prisma для сумісності з старими посиланнями
export const prisma = {
  $queryRaw: (sql: TemplateStringsArray, ...values: any[]) => {
    // Конвертуємо template string в звичайний SQL
    const sqlString = sql.reduce((acc, part, i) => {
      return acc + part + (values[i] !== undefined ? `$${i + 1}` : '')
    }, '')
    return query(sqlString, values)
  },
  $disconnect: async () => {
    await pool.end()
  }
}

// Також експортуємо прямо query для нових імпортів
export { query, pool }
