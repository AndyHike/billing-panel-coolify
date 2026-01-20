import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { coolify } from '@/lib/coolify'

// Перевірка підписок та автоматична пауза при закінченні терміну
// Викликається через cron (напр. щогодини)
export async function GET(request: NextRequest) {
  try {
    // Перевіряємо cron secret для безпеки
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('[v0] Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Starting subscription check...')

    // Знаходимо всі активні проекти з минулою датою закінчення
    const result = await query(`
      SELECT 
        cp.*,
        p.coolify_uuid,
        p.name as project_name,
        c.name as client_name
      FROM client_projects cp
      JOIN projects p ON cp.project_id = p.id
      JOIN clients c ON cp.client_id = c.id
      WHERE cp.status = 'active' 
        AND cp.end_date < CURRENT_TIMESTAMP
    `)

    const expiredProjects = result.rows

    console.log(`[v0] Found ${expiredProjects.length} expired subscriptions`)

    let pausedCount = 0

    // Зупиняємо кожен просрочений проект
    for (const cp of expiredProjects) {
      try {
        console.log(`[v0] Pausing project ${cp.project_name} for client ${cp.client_name}`)

        // Зупиняємо проект через Coolify API
        const success = await coolify.stopProject(cp.coolify_uuid)

        if (success) {
          // Оновлюємо статус в БД
          await query(
            `UPDATE client_projects 
             SET status = 'paused', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [cp.id]
          )
          pausedCount++
          console.log(`[v0] Successfully paused project ${cp.project_name}`)
        } else {
          console.error(`[v0] Failed to pause project ${cp.project_name} in Coolify`)
        }
      } catch (error) {
        console.error(`[v0] Error pausing project ${cp.project_name}:`, error)
      }
    }

    console.log(`[v0] Subscription check complete. Paused ${pausedCount} projects`)

    return NextResponse.json({
      success: true,
      checked: expiredProjects.length,
      paused: pausedCount,
    })
  } catch (error) {
    console.error('[v0] Error in subscription check:', error)
    return NextResponse.json(
      { error: 'Помилка перевірки підписок' },
      { status: 500 }
    )
  }
}
