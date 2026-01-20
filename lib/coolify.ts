// Coolify API клієнт для управління проектами

const COOLIFY_API_URL = process.env.COOLIFY_API_URL || 'http://localhost:8000'
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN || ''

interface CoolifyProject {
  uuid: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

interface CoolifyResource {
  uuid: string
  name: string
  type: string
  status: string
}

class CoolifyClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Coolify API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Отримати всі проекти
  async getProjects(): Promise<CoolifyProject[]> {
    try {
      const data = await this.request('/projects')
      return data.data || data || []
    } catch (error) {
      console.error('[v0] Error fetching Coolify projects:', error)
      return []
    }
  }

  // Отримати проект за UUID
  async getProject(uuid: string): Promise<CoolifyProject | null> {
    try {
      const data = await this.request(`/projects/${uuid}`)
      return data.data || data || null
    } catch (error) {
      console.error(`[v0] Error fetching project ${uuid}:`, error)
      return null
    }
  }

  // Отримати всі ресурси проекту
  async getProjectResources(projectUuid: string): Promise<CoolifyResource[]> {
    try {
      const data = await this.request(`/projects/${projectUuid}/resources`)
      return data.data || data || []
    } catch (error) {
      console.error(`[v0] Error fetching resources for project ${projectUuid}:`, error)
      return []
    }
  }

  // Зупинити всі ресурси проекту
  async stopProject(projectUuid: string): Promise<boolean> {
    try {
      const resources = await this.getProjectResources(projectUuid)
      
      // Зупиняємо кожен ресурс окремо
      const stopPromises = resources.map(resource => 
        this.stopResource(resource.uuid)
      )
      
      await Promise.all(stopPromises)
      console.log(`[v0] Successfully stopped all resources for project ${projectUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error stopping project ${projectUuid}:`, error)
      return false
    }
  }

  // Запустити всі ресурси проекту
  async startProject(projectUuid: string): Promise<boolean> {
    try {
      const resources = await this.getProjectResources(projectUuid)
      
      // Запускаємо кожен ресурс окремо
      const startPromises = resources.map(resource => 
        this.startResource(resource.uuid)
      )
      
      await Promise.all(startPromises)
      console.log(`[v0] Successfully started all resources for project ${projectUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error starting project ${projectUuid}:`, error)
      return false
    }
  }

  // Зупинити ресурс
  async stopResource(resourceUuid: string): Promise<boolean> {
    try {
      await this.request(`/resources/${resourceUuid}/stop`, {
        method: 'POST',
      })
      console.log(`[v0] Successfully stopped resource ${resourceUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error stopping resource ${resourceUuid}:`, error)
      return false
    }
  }

  // Запустити ресурс
  async startResource(resourceUuid: string): Promise<boolean> {
    try {
      await this.request(`/resources/${resourceUuid}/start`, {
        method: 'POST',
      })
      console.log(`[v0] Successfully started resource ${resourceUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error starting resource ${resourceUuid}:`, error)
      return false
    }
  }

  // Перезапустити ресурс
  async restartResource(resourceUuid: string): Promise<boolean> {
    try {
      await this.request(`/resources/${resourceUuid}/restart`, {
        method: 'POST',
      })
      console.log(`[v0] Successfully restarted resource ${resourceUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error restarting resource ${resourceUuid}:`, error)
      return false
    }
  }
}

// Singleton instance
export const coolify = new CoolifyClient(COOLIFY_API_URL, COOLIFY_API_TOKEN)

export type { CoolifyProject, CoolifyResource }
