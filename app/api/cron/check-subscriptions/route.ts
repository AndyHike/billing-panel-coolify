import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { coolify } from '@/lib/coolify'

// Перевірка підписок та автоматична синхронізація (пауза/відновлення)
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

    console.log('[v0] ================================================')
    console.log('[v0] 🔄 STARTING SUBSCRIPTION SYNC')
    console.log('[v0] ================================================')
    console.log(`[v0] Time: ${new Date().toISOString()}`)

    let pausedCount = 0
    let resumedCount = 0
    let failedCount = 0

    // ===== ЧАСТИНА 1: ВИМИКАННЯ ПРОЕКТІВ (Термін закінчився) =====
    console.log('[v0]')
    console.log('[v0] ═══════════════════════════════════════════════')
    console.log('[v0] PART 1: PAUSING EXPIRED SUBSCRIPTIONS')
    console.log('[v0] ═══════════════════════════════════════════════')

    console.log('[v0] 1️⃣  Querying projects with end_date < NOW and status = active...')
    const expiredResult = await query(`
      SELECT 
        cp.id,
        cp.status,
        cp.end_date,
        p.coolify_uuid,
        p.name as project_name,
        c.name as client_name
      FROM client_projects cp
      JOIN projects p ON cp.project_id = p.id
      JOIN clients c ON cp.client_id = c.id
      WHERE cp.status = 'active' AND cp.end_date < CURRENT_TIMESTAMP
      ORDER BY cp.end_date ASC
    `)

    const expiredProjects = expiredResult.rows
    console.log(`[v0] ✅ Found ${expiredProjects.length} expired projects to pause`)

    if (expiredProjects.length > 0) {
      console.log('[v0] 📋 Projects to pause:')
      expiredProjects.forEach((cp, idx) => {
        console.log(
          `[v0]   ${idx + 1}. ${cp.project_name} (${cp.client_name})`
        )
        console.log(`[v0]      UUID: ${cp.coolify_uuid}`)
        console.log(`[v0]      End date: ${cp.end_date}`)
      })

      console.log('[v0] 2️⃣  Processing pauses...')
      for (let idx = 0; idx < expiredProjects.length; idx++) {
        const cp = expiredProjects[idx]
        try {
          console.log(
            `[v0] Processing ${idx + 1}/${expiredProjects.length}: ${cp.project_name}`
          )
          console.log(`[v0] Calling coolify.stopProject(${cp.coolify_uuid})...`)

          const success = await coolify.stopProject(cp.coolify_uuid)

          if (success) {
            console.log(`[v0] ✅ Coolify stop succeeded`)
            console.log(`[v0] 💾 Updating database: status = 'paused'`)

            await query(
              `UPDATE client_projects 
               SET status = 'paused', updated_at = CURRENT_TIMESTAMP 
               WHERE id = $1`,
              [cp.id]
            )

            pausedCount++
            console.log(`[v0] ✅ Database updated\n`)
          } else {
            failedCount++
            console.log(`[v0] ❌ Coolify stop failed\n`)
          }
        } catch (error) {
          failedCount++
          console.error(`[v0] ❌ Exception:`, error instanceof Error ? error.message : error)
          console.log('[v0]')
        }
      }
    } else {
      console.log('[v0] ℹ️  No expired projects to pause')
    }

    console.log('[v0] PART 1 SUMMARY: Paused ' + pausedCount + ' projects')

    // ===== ЧАСТИНА 2: ВВІМКНЕННЯ ПРОЕКТІВ (Підписку поновлено) =====
    console.log('[v0]')
    console.log('[v0] ═══════════════════════════════════════════════')
    console.log('[v0] PART 2: RESUMING RENEWED SUBSCRIPTIONS')
    console.log('[v0] ═══════════════════════════════════════════════')

    console.log('[v0] 3️⃣  Querying projects with end_date > NOW and status = paused...')
    const renewedResult = await query(`
      SELECT 
        cp.id,
        cp.status,
        cp.end_date,
        p.coolify_uuid,
        p.name as project_name,
        c.name as client_name
      FROM client_projects cp
      JOIN projects p ON cp.project_id = p.id
      JOIN clients c ON cp.client_id = c.id
      WHERE cp.status = 'paused' AND cp.end_date > CURRENT_TIMESTAMP
      ORDER BY cp.end_date ASC
    `)

    const renewedProjects = renewedResult.rows
    console.log(`[v0] ✅ Found ${renewedProjects.length} renewed projects to resume`)

    if (renewedProjects.length > 0) {
      console.log('[v0] 📋 Projects to resume:')
      renewedProjects.forEach((cp, idx) => {
        console.log(
          `[v0]   ${idx + 1}. ${cp.project_name} (${cp.client_name})`
        )
        console.log(`[v0]      UUID: ${cp.coolify_uuid}`)
        console.log(`[v0]      End date: ${cp.end_date}`)
      })

      console.log('[v0] 4️⃣  Processing resumes...')
      for (let idx = 0; idx < renewedProjects.length; idx++) {
        const cp = renewedProjects[idx]
        try {
          console.log(
            `[v0] Processing ${idx + 1}/${renewedProjects.length}: ${cp.project_name}`
          )
          console.log(`[v0] Calling coolify.startProject(${cp.coolify_uuid})...`)

          const success = await coolify.startProject(cp.coolify_uuid)

          if (success) {
            console.log(`[v0] ✅ Coolify start succeeded`)
            console.log(`[v0] 💾 Updating database: status = 'active'`)

            await query(
              `UPDATE client_projects 
               SET status = 'active', updated_at = CURRENT_TIMESTAMP 
               WHERE id = $1`,
              [cp.id]
            )

            resumedCount++
            console.log(`[v0] ✅ Database updated\n`)
          } else {
            failedCount++
            console.log(`[v0] ❌ Coolify start failed\n`)
          }
        } catch (error) {
          failedCount++
          console.error(`[v0] ❌ Exception:`, error instanceof Error ? error.message : error)
          console.log('[v0]')
        }
      }
    } else {
      console.log('[v0] ℹ️  No renewed projects to resume')
    }

    console.log('[v0] PART 2 SUMMARY: Resumed ' + resumedCount + ' projects')

    // ===== ФІНАЛЬНИЙ ЗВІТ =====
    console.log('[v0]')
    console.log('[v0] ================================================')
    console.log('[v0] 📊 SYNC COMPLETED')
    console.log('[v0] ================================================')
    console.log('[v0] Summary:')
    console.log('[v0]   Paused:  ' + pausedCount)
    console.log('[v0]   Resumed: ' + resumedCount)
    console.log('[v0]   Failed:  ' + failedCount)
    console.log('[v0] Total:   ' + (pausedCount + resumedCount) + ' actions completed')
    console.log('[v0] ================================================\n')

    return NextResponse.json({
      success: true,
      paused: pausedCount,
      resumed: resumedCount,
      failed: failedCount,
      total: pausedCount + resumedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] ❌ FATAL ERROR in subscription sync:', error)
    return NextResponse.json(
      { error: 'Помилка синхронізації підписок', details: String(error) },
      { status: 500 }
    )
  }
}
