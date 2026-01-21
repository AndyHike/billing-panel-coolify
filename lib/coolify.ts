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
          'Authorization': `Bearer ${this.token}`,
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
      console.log(`[v0]   Sub-Step 1a: Fetching project ${projectUuid} details...`)
      
      // Отримуємо проект та його середовища
      const project = await this.getProject(projectUuid)
      if (!project) {
        console.error(`[v0]   ❌ Project not found: ${projectUuid}`)
        return []
      }

      console.log(`[v0]   ✅ Project found: ${project.name}`)
      
      if (!project.environments) {
        console.error(`[v0]   ❌ Project has no environments field`)
        return []
      }

      // Збираємо всі environment IDs цього проекту
      const envIds = (project.environments as any[]).map((env: any) => env.id)
      console.log(`[v0]   Sub-Step 1b: Project has ${envIds.length} environment(s):`, envIds)

      console.log(`[v0]   Sub-Step 1c: Fetching all resources from server...`)
      
      // Отримуємо всі ресурси сервера
      const allResources = await this.getAllResources()
      console.log(`[v0]   ✅ Total resources on server: ${allResources.length}`)
      
      // Фільтруємо ресурси за environment_id (НЕ project_uuid!)
      console.log(`[v0]   Sub-Step 1d: Filtering resources by environment_id...`)
      const filtered = allResources.filter((r: any) => {
        const matches = envIds.includes(r.environment_id)
        if (matches) {
          console.log(`[v0]     ✓ Matched: ${r.name} (env_id: ${r.environment_id})`)
        }
        return matches
      })
      
      console.log(`[v0]   Sub-Step 1e: Filtering complete. Found ${filtered.length} matching resources`)
      
      return filtered
    } catch (error) {
      console.error(`[v0] ❌ Error fetching resources for project ${projectUuid}:`, error)
      return []
    }
  }

  async stopApplication(applicationUuid: string): Promise<boolean> {
    try {
      await this.request(`/api/v1/applications/${applicationUuid}/stop`, {
        method: 'GET',
      })
      console.log(`[v0] Successfully stopped application ${applicationUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error stopping application ${applicationUuid}:`, error)
      return false
    }
  }

  async startApplication(applicationUuid: string): Promise<boolean> {
    try {
      await this.request(`/api/v1/applications/${applicationUuid}/start`, {
        method: 'GET',
      })
      console.log(`[v0] Successfully started application ${applicationUuid}`)
      return true
    } catch (error) {
      console.error(`[v0] Error starting application ${applicationUuid}:`, error)
      return false
    }
  }

  async stopProject(projectUuid: string): Promise<boolean> {
    try {
      console.log(`[v0] ========== STOP PROJECT TRACE ==========`)
      console.log(`[v0] Project UUID: ${projectUuid}`)
      console.log(`[v0] Step 1: Fetching project details from Coolify...`)
      
      // Отримуємо ресурси проекту (правильно фільтровані за environment_id)
      const resources = await this.getProjectResources(projectUuid)
      
      console.log(`[v0] Step 2: Project resources fetched`)
      console.log(`[v0]   Total resources found: ${resources.length}`)
      
      if (resources.length === 0) {
        console.warn(`[v0] ⚠️  No resources found for project ${projectUuid}`)
        return false
      }

      // Виводимо інформацію про кожен ресурс
      console.log(`[v0] Step 3: Resource details:`)
      resources.forEach((res: any, idx: number) => {
        console.log(`[v0]   ${idx + 1}. ${res.name}`)
        console.log(`[v0]      UUID: ${res.uuid}`)
        console.log(`[v0]      Type: ${res.type}`)
        console.log(`[v0]      Status: ${res.status}`)
        console.log(`[v0]      Environment ID: ${res.environment_id}`)
      })

      console.log(`[v0] Step 4: Stopping ${resources.length} resources in parallel...`)
      
      // Зупиняємо всі ресурси паралельно
      const results = await Promise.all(
        resources.map((resource: any, idx: number) => {
          console.log(`[v0]   Starting stop for resource ${idx + 1}/${resources.length}: ${resource.name}`)
          return this.stopResource(resource)
        })
      )
      
      const successCount = results.filter(r => r === true).length
      const success = results.every(res => res === true)
      
      console.log(`[v0] Step 5: Results:`)
      console.log(`[v0]   Successful: ${successCount}/${resources.length}`)
      console.log(`[v0]   Failed: ${results.length - successCount}/${resources.length}`)
      console.log(`[v0] Project stop completed: ${success ? '✅ SUCCESS' : '❌ PARTIAL FAILURE'}`)
      console.log(`[v0] ========================================\n`)
      
      return success
    } catch (error) {
      console.error(`[v0] ❌ Fatal error stopping project ${projectUuid}:`, error)
      return false
    }
  }

  async startProject(projectUuid: string): Promise<boolean> {
    try {
      console.log(`[v0] Starting project ${projectUuid}`)
      
      // Отримуємо ресурси проекту (правильно фільтровані за environment_id)
      const resources = await this.getProjectResources(projectUuid)
      console.log(`[v0] Found ${resources.length} resources to start`)
      
      if (resources.length === 0) {
        console.warn(`[v0] No resources found for project ${projectUuid}`)
        return false
      }

      // Запускаємо всі ресурси паралельно
      const results = await Promise.all(
        resources.map(resource => this.startResource(resource))
      )
      
      const success = results.every(res => res === true)
      console.log(`[v0] Project start completed: ${success ? 'success' : 'partial failure'}`)
      return success
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

  async stopResource(resource: any): Promise<boolean> {
    try {
      console.log(`[v0]   Resource Stop:`)
      console.log(`[v0]     Name: ${resource.name}`)
      console.log(`[v0]     UUID: ${resource.uuid}`)
      console.log(`[v0]     Type: ${resource.type}`)
      console.log(`[v0]     Current Status: ${resource.status}`)
      
      // 1. Перевіряємо, чи ресурс уже зупинений
      if (resource.status && resource.status.toLowerCase().includes('exited')) {
        console.log(`[v0]     ℹ️  Already stopped (status: ${resource.status})`)
        return true
      }

      // 2. Визначаємо правильну категорію для API
      let category = 'applications'
      const type = resource.type.toLowerCase()

      if (type.includes('postgresql') || type.includes('database')) {
        category = 'databases'
      } else if (type === 'service') {
        category = 'services'
      }

      const endpoint = `/api/v1/${category}/${resource.uuid}/stop`
      console.log(`[v0]     Calling: ${category}/${resource.uuid}/stop`)

      await this.request(endpoint, { method: 'POST' })
      console.log(`[v0]     ✅ Stop successful`)
      return true
    } catch (error) {
      console.error(`[v0]     ❌ Stop failed:`, error instanceof Error ? error.message : error)
      return false
    }
  }

  async startResource(resource: any): Promise<boolean> {
    try {
      // 1. Перевіряємо, чи ресурс уже запущений
      if (resource.status && resource.status.toLowerCase().includes('running')) {
        console.log(`[v0] ${resource.name} is already running (Status: ${resource.status})`)
        return true
      }

      // 2. Визначаємо категорію
      let category = 'applications'
      const type = resource.type.toLowerCase()

      if (type.includes('postgresql') || type.includes('database')) {
        category = 'databases'
      } else if (type === 'service') {
        category = 'services'
      }

      const endpoint = `/api/v1/${category}/${resource.uuid}/start`
      console.log(`[v0] Starting ${category}/${resource.uuid} (${resource.name})`)

      await this.request(endpoint, { method: 'POST' })
      return true
    } catch (error) {
      console.error(`[v0] Error starting resource ${resource.name}:`, error)
      return false
    }
  }

  async getResourceDetails(resourceUuid: string): Promise<any> {
    try {
      console.log(`[v0] Fetching resource details for ${resourceUuid}`)
      
      // Спробуємо отримати дані як application
      try {
        const data = await this.request(`/api/v1/applications/${resourceUuid}`)
        return data
      } catch (appError) {
        // Якщо не application, спробуємо як database
        try {
          const data = await this.request(`/api/v1/databases/${resourceUuid}`)
          return data
        } catch (dbError) {
          // Якщо не database, спробуємо як service
          try {
            const data = await this.request(`/api/v1/services/${resourceUuid}`)
            return data
          } catch (serviceError) {
            console.error(`[v0] Could not fetch resource as application, database, or service`)
            throw new Error('Resource not found')
          }
        }
      }
    } catch (error) {
      console.error(`[v0] Error fetching resource details ${resourceUuid}:`, error)
      return null
    }
  }

  // Отримати список бекапів БД
  async getDatabaseBackups(databaseUuid: string): Promise<any[]> {
    try {
      console.log(`[v0] Fetching backups for database ${databaseUuid}`)
      const data = await this.request(`/api/v1/databases/${databaseUuid}/backups`)
      return data || []
    } catch (error) {
      console.error(`[v0] Error fetching backups:`, error)
      return []
    }
  }

  // Запросити новий бекап БД
  async createDatabaseBackup(databaseUuid: string): Promise<boolean> {
    try {
      console.log(`[v0] Creating backup for database ${databaseUuid}`)
      await this.request(`/api/v1/databases/${databaseUuid}/backups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency: 'manual',
          enabled: true,
          save_s3: false,
          backup_now: true,
          database_backup_retention_amount_locally: 5,
          database_backup_retention_days_locally: 7,
        }),
      })
      console.log(`[v0] Backup requested successfully`)
      return true
    } catch (error) {
      console.error(`[v0] Error creating backup:`, error)
      return false
    }
  }

  // Отримати файл бекапу для завантаження
  async getDatabaseBackupFile(databaseUuid: string, backupFilename: string): Promise<Blob | null> {
    try {
      console.log(`[v0] Downloading backup: ${backupFilename}`)
      const response = await fetch(
        `${this.baseUrl}/api/v1/databases/${databaseUuid}/backups/${backupFilename}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.blob()
    } catch (error) {
      console.error(`[v0] Error downloading backup:`, error)
      return null
    }
  }
}

export const coolify = new CoolifyClient(COOLIFY_API_URL, COOLIFY_API_TOKEN)

export type { CoolifyProject, CoolifyResource }
