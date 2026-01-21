const cron = require('node-cron')
const fetch = require('node:fetch')

// Запускаємо перевірку підписок кожну хвилину (для тесту - */1 * * * *)
// Після тестування можна змінити на: 0 */5 * * * * (кожні 5 хвилин)
// Або: 0 0 * * * (щодня о 00:00)

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

console.log('[v0] Starting cron job scheduler...')
console.log(`[v0] Cron tasks will run every 1 minute for testing`)
console.log(`[v0] App URL: ${APP_URL}`)

// Задача для перевірки підписок
const subscriptionCheckTask = cron.schedule('* * * * *', async () => {
  console.log(`[v0] ⏱️  Cron job triggered at ${new Date().toISOString()}`)
  
  try {
    const response = await fetch(`${APP_URL}/api/cron/check-subscriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[v0] ❌ Cron request failed: ${response.status}`, data)
      return
    }

    console.log(`[v0] ✅ Cron job completed:`, data)
  } catch (error) {
    console.error(`[v0] ❌ Error running cron job:`, error.message)
  }
})

console.log('[v0] ✅ Cron job scheduler initialized')
console.log(`[v0] Next run: ${subscriptionCheckTask.nextDate().toString()}`)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[v0] SIGTERM received, stopping cron job...')
  subscriptionCheckTask.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('[v0] SIGINT received, stopping cron job...')
  subscriptionCheckTask.stop()
  process.exit(0)
})
