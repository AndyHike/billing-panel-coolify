import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { coolify } from '@/lib/coolify'

// Синхронізація проектів з Coolify
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Starting Coolify projects sync...')

    // Отримуємо проекти з Coolify
    const coolifyProjects = await coolify.getProjects()

    if (!coolifyProjects || coolifyProjects.length === 0) {
      console.log('[v0] No projects found in Coolify')
      return NextResponse.json({ added: 0, updated: 0 })
    }

    console.log(`[v0] Found ${coolifyProjects.length} projects in Coolify`)

    let added = 0
    let updated = 0

    // Синхронізуємо кожен проект
    for (const coolifyProject of coolifyProjects) {
      try {
        const existingResult = await query(
          'SELECT id FROM projects WHERE coolify_uuid = $1',
          [coolifyProject.uuid]
        )

        if (existingResult.rows.length > 0) {
          // Оновлюємо існуючий проект
          await query(
            `UPDATE projects 
             SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE coolify_uuid = $3`,
            [coolifyProject.name, coolifyProject.description || null, coolifyProject.uuid]
          )
          updated++
          console.log(`[v0] Updated project: ${coolifyProject.name}`)
        } else {
          // Створюємо новий проект
          await query(
            `INSERT INTO projects (coolify_uuid, name, description) 
             VALUES ($1, $2, $3)`,
            [coolifyProject.uuid, coolifyProject.name, coolifyProject.description || null]
          )
          added++
          console.log(`[v0] Added new project: ${coolifyProject.name}`)
        }
      } catch (error) {
        console.error(`[v0] Error syncing project ${coolifyProject.name}:`, error)
      }
    }

    console.log(`[v0] Sync complete. Added: ${added}, Updated: ${updated}`)

    return NextResponse.json({ added, updated })
  } catch (error) {
    console.error('[v0] Error syncing projects:', error)
    return NextResponse.json(
      { error: 'Помилка синхронізації проектів' },
      { status: 500 }
    )
  }
}
