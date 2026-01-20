// Coolify API клієнт для управління проектами

const COOLIFY_API_URL = process.env.COOLIFY_API_URL || 'http://localhost:8000'
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN || ''

// Debug logging
console.log('[v0] Coolify configuration:')
console.log('[v0] COOLIFY_API_URL:', COOLIFY_API_URL)
console.log('[v0] COOLIFY_API_TOKEN exists:', !!COOLIFY_API_TOKEN)
console.log('[v0] COOLIFY_API_TOKEN length:', COOLIFY_API_TOKEN?.length)

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
    // Видаляємо косу в кінці baseUrl якщо вона є
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    console.log(`[v0] Coolify API request: ${url}`)
    console.log(`[v0] Token length:`, this.token.length)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': this.token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        console.error(`[v0] Coolify API error: ${response.status} - ${error}`)
        throw new Error(`Coolify API error: ${response.status} - ${error}`)
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`[v0] Coolify API timeout after 30s: ${url}`)
          throw new Error(`Coolify API timeout: ${url}`)
        }
        console.error(`[v0] Coolify API fetch error:`, error.message)
      }
      throw error
    }
  }

  async getProjects(): Promise<CoolifyProject[]> {
    try {
      const data = await this.request('/api/v1/projects')
      console.log('[v0] Coolify projects response:', JSON.stringify(data))
      return Array.isArray(data) ? data : (data.data || [])
    } catch (error) {
      console.error('[v0] Error fetching Coolify projects:', error)
      return []
    }
  }

  async getProject(uuid: string): Promise<CoolifyProject | null> {
    try {
      const data = await this.request(`/api/v1/projects/${uuid}`)
      console.log(`[v0] Coolify project ${uuid} response:`, JSON.stringify(data))
      return data || null
    } catch (error) {
      console.error(`[v0] Error fetching project ${uuid}:`, error)
      return null
    }
  }

  async getAllResources(): Promise<CoolifyResource[]> {
    try {
      const data = await this.request('/api/v1/resources')
      return data.data || data || []
    } catch (error) {
      console.error('[v0] Error fetching all resources:', error)
      return []
    }
  }

  async getProjectResources(projectUuid: string): Promise<CoolifyResource[]> {
    try {
      const allResources = await this.getAllResources()
      return allResources.filter((r: any) => r.project_uuid === projectUuid)
    } catch (error) {
      console.error(`[v0] Error fetching resources for project ${projectUuid}:`, error)
      return []
    }
  }

  async stopProject(projectUuid: string): Promise<boolean> {
    try {
      const resources = await this.getProjectResources(projectUuid)
      
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

  async startProject(projectUuid: string): Promise<boolean> {
    try {
      const resources = await this.getProjectResources(projectUuid)
      
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

  async getService(serviceUuid: string): Promise<any> {
    try {
      const data = await this.request(`/api/v1/services/${serviceUuid}`)
      return data
    } catch (error) {
      console.error(`[v0] Error fetching service ${serviceUuid}:`, error)
      return null
    }
  }

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

  async stopResource(resourceUuid: string): Promise<boolean> {
    try {
      return await this.stopService(resourceUuid)
    } catch (error) {
      console.error(`[v0] Error stopping resource ${resourceUuid}:`, error)
      return false
    }
  }

  async startResource(resourceUuid: string): Promise<boolean> {
    try {
      return await this.startService(resourceUuid)
    } catch (error) {
      console.error(`[v0] Error starting resource ${resourceUuid}:`, error)
      return false
    }
  }
}

export const coolify = new CoolifyClient(COOLIFY_API_URL, COOLIFY_API_TOKEN)

export type { CoolifyProject, CoolifyResource }
