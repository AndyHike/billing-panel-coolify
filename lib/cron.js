const cron = require('node-cron')
const fetch = require('node:fetch')
const fs = require('fs')
const path = require('path')

// Запускаємо перевірку підписок кожну хвилину (для тесту - */1 * * * *)
// Після тестування можна змінити на: 0 */5 * * * * (кожні 5 хвилин)
// Або: 0 0 * * * (щодня о 00:00)

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

// Файл логування
const logDir = path.join(process.cwd(), 'logs')
const logFile = path.join(logDir, 'cron.log')

// Створюємо папку logs якщо не існує
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// Функція для логування
function logToFile(message) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`
  
  // Логуємо до консолі
  console.log(message)
  
  // Логуємо до файлу
  fs.appendFileSync(logFile, logMessage)
}

// Ініціалізація логування
logToFile('[v0] =========================================')
logToFile('[v0] CRON JOB SCHEDULER STARTING')
logToFile('[v0] =========================================')
logToFile(`[v0] Cron tasks will run every 1 minute for testing`)
logToFile(`[v0] App URL: ${APP_URL}`)
logToFile(`[v0] CRON_SECRET is ${CRON_SECRET === 'your-secret-key' ? 'NOT SET (default)' : 'SET'}`)
logToFile(`[v0] Log file: ${logFile}`)

// Задача для перевірки підписок
const subscriptionCheckTask = cron.schedule('* * * * *', async () => {
  const startTime = Date.now()
  logToFile(`\n[v0] ========== CRON JOB TRIGGERED ==========`)
  logToFile(`[v0] Time: ${new Date().toISOString()}`)
  logToFile(`[v0] Sending request to: ${APP_URL}/api/cron/check-subscriptions`)
  
  try {
    logToFile(`[v0] Authorization header set with Bearer token`)
    
    const response = await fetch(`${APP_URL}/api/cron/check-subscriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    logToFile(`[v0] Response received: ${response.status} ${response.statusText}`)

    const data = await response.json()

    if (!response.ok) {
      logToFile(`[v0] ❌ FAILED - HTTP ${response.status}`)
      logToFile(`[v0] Error response: ${JSON.stringify(data)}`)
      return
    }

    const duration = Date.now() - startTime
    logToFile(`[v0] ✅ SUCCESS`)
    logToFile(`[v0] Results:`)
    logToFile(`[v0]   - Checked: ${data.checked} projects`)
    logToFile(`[v0]   - Paused: ${data.paused} projects`)
    logToFile(`[v0]   - Failed: ${data.failed} projects`)
    logToFile(`[v0]   - Duration: ${duration}ms`)
    logToFile(`[v0] ========================================\n`)
  } catch (error) {
    const duration = Date.now() - startTime
    logToFile(`[v0] ❌ NETWORK ERROR`)
    logToFile(`[v0] Error: ${error.message}`)
    logToFile(`[v0] Duration: ${duration}ms`)
    logToFile(`[v0] ========================================\n`)
  }
})

logToFile(`[v0] ✅ Cron job scheduler initialized`)
logToFile(`[v0] Next run: ${subscriptionCheckTask.nextDate().toString()}`)
logToFile('[v0] =========================================\n')

// Graceful shutdown
process.on('SIGTERM', () => {
  logToFile('[v0] SIGTERM received, stopping cron job...')
  subscriptionCheckTask.stop()
  logToFile('[v0] Cron job stopped. Process exiting.')
  process.exit(0)
})

process.on('SIGINT', () => {
  logToFile('[v0] SIGINT received (Ctrl+C), stopping cron job...')
  subscriptionCheckTask.stop()
  logToFile('[v0] Cron job stopped. Process exiting.')
  process.exit(0)
})
