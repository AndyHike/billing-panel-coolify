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
    const url = `${this.baseUrl}${endpoint}`
    
    console.log(`[v0] Coolify API request: ${url}`)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`[v0] Coolify API error: ${response.status} - ${error}`)
      throw new Error(`Coolify API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Отримати всі проекти
  async getProjects(): Promise<CoolifyProject[]> {
    try {
      const data = await this.request('/api/v1/projects')
      console.log('[v0] Coolify projects response:', JSON.stringify(data))
      // Coolify повертає масив напряму
      return Array.isArray(data) ? data : (data.data || [])
    } catch (error) {
      console.error('[v0] Error fetching Coolify projects:', error)
      return []
    }
  }

  // Отримати проект за UUID
  async getProject(uuid: string): Promise<CoolifyProject | null> {
    try {
      const data = await this.request(`/api/v1/projects/${uuid}`)
      console.log(`[v0] Coolify project ${uuid} response:`, JSON.stringify(data))
      // Coolify повертає об'єкт напряму
      return data || null
    } catch (error) {
      console.error(`[v0] Error fetching project ${uuid}:`, error)
      return null
    }
  }

  // Отримати всі ресурси
  async getAllResources(): Promise<CoolifyResource[]> {
    try {
      const data = await this.request('/api/v1/resources')
      return data.data || data || []
    } catch (error) {
      console.error('[v0] Error fetching all resources:', error)
      return []
    }
  }

  // Отримати всі ресурси проекту
  async getProjectResources(projectUuid: string): Promise<CoolifyResource[]> {
    try {
      // Отримуємо всі ресурси і фільтруємо по project_uuid
      const allResources = await this.getAllResources()
      return allResources.filter((r: any) => r.project_uuid === projectUuid)
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

  // Отримати сервіс за UUID
  async getService(serviceUuid: string): Promise<any> {
    try {
      const data = await this.request(`/api/v1/services/${serviceUuid}`)
      return data
    } catch (error) {
      console.error(`[v0] Error fetching service ${serviceUuid}:`, error)
      return null
    }
  }

  // Зупинити сервіс
  async stopService(serviceUuid: string): Promise<boolean> {
    try {
      await this.request(`/api/v1/services/${serviceUuid}/stop`, {
        method: 'POST',
      })
      console.log(`[v0] Successfully stopped service ${serviceUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error stopping service ${serviceUuid}:`, error)
      return false
    }
  }

  // Запустити сервіс
  async startService(serviceUuid: string): Promise<boolean> {
    try {
      await this.request(`/api/v1/services/${serviceUuid}/start`, {
        method: 'POST',
      })
      console.log(`[v0] Successfully started service ${serviceUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error starting service ${serviceUuid}:`, error)
      return false
    }
  }

  // Зупинити ресурс (універсальний метод)
  async stopResource(resourceUuid: string): Promise<boolean> {
    try {
      // Спробуємо як сервіс
      return await this.stopService(resourceUuid)
    } catch (error) {
      console.error(`[v0] Error stopping resource ${resourceUuid}:`, error)
      return false
    }
  }

  // Запустити ресурс (універсальний метод)
  async startResource(resourceUuid: string): Promise<boolean> {
    try {
      // Спробуємо як сервіс
      return await this.startService(resourceUuid)
    } catch (error) {
      console.error(`[v0] Error starting resource ${resourceUuid}:`, error)
      return false
    }
  }
}

// Singleton instance
export const coolify = new CoolifyClient(COOLIFY_API_URL, COOLIFY_API_TOKEN)

export type { CoolifyProject, CoolifyResource }
