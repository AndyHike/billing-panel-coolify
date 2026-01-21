// lib/cron.js
const cron = require('node-cron')

// Константи для конфігурації
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

// Спрощена функція логування тільки в консоль
function log(message) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
}

// Ініціалізація
log('=========================================')
log('CRON JOB SCHEDULER STARTING')
log(`App URL: ${APP_URL}`)
log(`CRON_SECRET is ${CRON_SECRET === 'your-secret-key' ? 'NOT SET (default)' : 'SET'}`)
log('=========================================')

// Задача для перевірки підписок (щохвилини)
const subscriptionCheckTask = cron.schedule('* * * * *', async () => {
  const startTime = Date.now()
  log('========== CRON JOB TRIGGERED ==========')
  
  try {
    // В Node.js 20 fetch є глобальним, тому require не потрібен
    const response = await fetch(`${APP_URL}/api/cron/check-subscriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      }
    })

    log(`Response: ${response.status} ${response.statusText}`)

    const data = await response.json()

    if (!response.ok) {
      log(`❌ FAILED - HTTP ${response.status}`)
      log(`Error details: ${JSON.stringify(data)}`)
      return
    }

    const duration = Date.now() - startTime
    log('✅ SUCCESS')
    log(`Results: Checked: ${data.checked}, Paused: ${data.paused}, Failed: ${data.failed || 0}`)
    log(`Duration: ${duration}ms`)
  } catch (error) {
    log(`❌ NETWORK ERROR: ${error.message}`)
  }
  log('========================================')
})

log('✅ Cron job scheduler initialized and running')

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, stopping cron job...')
  subscriptionCheckTask.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  log('SIGINT received, stopping cron job...')
  subscriptionCheckTask.stop()
  process.exit(0)
})
