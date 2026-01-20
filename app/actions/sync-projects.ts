'use server'

import { query } from '@/lib/db'
import { coolify } from '@/lib/coolify'

export async function syncProjectsAction() {
  try {
    console.log('[v0] Starting Coolify projects sync (Server Action)...')

    const coolifyProjects = await coolify.getProjects()

    if (!coolifyProjects || coolifyProjects.length === 0) {
      console.log('[v0] No projects found in Coolify')
      return { success: true, added: 0, updated: 0, error: null }
    }

    console.log(`[v0] Found ${coolifyProjects.length} projects in Coolify`)

    let added = 0
    let updated = 0

    for (const coolifyProject of coolifyProjects) {
      try {
        const existingResult = await query(
          'SELECT id FROM projects WHERE coolify_uuid = $1',
          [coolifyProject.uuid]
        )

        if (existingResult.rows.length > 0) {
          await query(
            `UPDATE projects 
             SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE coolify_uuid = $3`,
            [coolifyProject.name, coolifyProject.description || null, coolifyProject.uuid]
          )
          updated++
          console.log(`[v0] Updated project: ${coolifyProject.name}`)
        } else {
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
    return { success: true, added, updated, error: null }
  } catch (error) {
    console.error('[v0] Error syncing projects:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, added: 0, updated: 0, error: errorMessage }
  }
}
