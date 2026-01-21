import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { coolify } from '@/lib/coolify'

// Перевірка підписок та автоматична пауза при закінченні терміну
// Викликається через node-cron на сервері кожну хвилину (для тесту)
export async function GET(request: NextRequest) {
  try {
    // Перевіряємо cron secret для безпеки
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (!authHeader || authHeader !== expectedAuth) {
      console.log('[v0] ❌ Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] ========================================')
    console.log('[v0] 🔍 STARTING SUBSCRIPTION CHECK')
    console.log('[v0] ========================================')
    console.log(`[v0] Time: ${new Date().toISOString()}`)

    // Знаходимо всі активні проекти з минулою датою закінчення
    console.log('[v0] 1️⃣  Querying expired projects from database...')
    const result = await query(`
      SELECT 
        cp.*,
        p.coolify_uuid,
        p.name as project_name,
        c.name as client_name,
        c.email as client_email
      FROM client_projects cp
      JOIN projects p ON cp.project_id = p.id
      JOIN clients c ON cp.client_id = c.id
      WHERE cp.status = 'active' 
        AND cp.end_date < CURRENT_TIMESTAMP
      ORDER BY cp.end_date ASC
    `)

    const expiredProjects = result.rows

    console.log(`[v0] ✅ Found ${expiredProjects.length} expired subscriptions`)

    if (expiredProjects.length === 0) {
      console.log('[v0] ℹ️  No expired projects to pause')
      return NextResponse.json({
        success: true,
        checked: 0,
        paused: 0,
        failed: 0,
        message: 'No expired projects',
        timestamp: new Date().toISOString(),
      })
    }

    console.log('[v0] 📋 Expired projects list:')
    expiredProjects.forEach((cp, idx) => {
      console.log(`[v0]   ${idx + 1}. ${cp.project_name}`)
      console.log(`[v0]      Client: ${cp.client_name} (${cp.client_email})`)
      console.log(`[v0]      UUID: ${cp.coolify_uuid}`)
      console.log(`[v0]      End date: ${cp.end_date}`)
      console.log(`[v0]      Status: ${cp.status}`)
    })

    let pausedCount = 0
    let failedCount = 0

    // Зупиняємо кожен просрочений проект
    console.log(`[v0] 2️⃣  Processing ${expiredProjects.length} projects...`)
    for (let idx = 0; idx < expiredProjects.length; idx++) {
      const cp = expiredProjects[idx]
      try {
        console.log(`[v0] \n📍 Processing project ${idx + 1}/${expiredProjects.length}`)
        console.log(`[v0]    Name: ${cp.project_name}`)
        console.log(`[v0]    Coolify UUID: ${cp.coolify_uuid}`)
        console.log(`[v0]    🛑 Attempting to stop project via Coolify API...`)

        // Зупиняємо проект через Coolify API
        const success = await coolify.stopProject(cp.coolify_uuid)

        if (success) {
          console.log(`[v0]    ✅ Coolify API returned success`)
          console.log(`[v0]    💾 Updating database status to 'paused'...`)
          
          // Оновлюємо статус в БД
          await query(
            `UPDATE client_projects 
             SET status = 'paused', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [cp.id]
          )
          
          pausedCount++
          console.log(`[v0]    ✅ Database updated successfully`)
        } else {
          failedCount++
          console.log(`[v0]    ❌ Coolify API returned failure`)
        }
      } catch (error) {
        failedCount++
        console.error(`[v0]    ❌ Exception occurred:`, error instanceof Error ? error.message : error)
      }
    }

    console.log(`[v0] 3️⃣  Summary:`)
    console.log(`[v0]    Total checked: ${expiredProjects.length}`)
    console.log(`[v0]    Successfully paused: ${pausedCount}`)
    console.log(`[v0]    Failed: ${failedCount}`)
    console.log('[v0] ========================================')
    console.log('[v0] ✨ SUBSCRIPTION CHECK COMPLETED')
    console.log('[v0] ========================================\n')

    return NextResponse.json({
      success: true,
      checked: expiredProjects.length,
      paused: pausedCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] ❌ Fatal error in subscription check:', error)
    return NextResponse.json(
      { error: 'Помилка перевірки підписок', details: String(error) },
      { status: 500 }
    )
  }
}
