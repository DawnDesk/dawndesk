export type View = 'dashboard' | 'workspace' | 'store' | 'ai' | 'settings'

export type PluginMeta = {
  id: string
  name: string
  version: string
  description: string
  enabled: boolean
  installedAt: string
  category?: string
  icon?: string
  entryPath?: string
}

export type RegistryRelease = {
  url: string
  checksum: string
}

export type RegistryPlugin = {
  id: string
  name: string
  description: string
  author?: string
  repository?: string
  icon?: string
  category?: string
  tags?: string[]
  latestVersion: string
  minHostVersion?: string
  verified?: boolean
  releases: Record<string, RegistryRelease>
}

export type PluginRegistry = {
  schemaVersion: number
  updatedAt: string
  plugins: RegistryPlugin[]
}

export type PluginDownloadProgress = {
  pluginId: string
  progress: number
  receivedBytes: number
  totalBytes?: number | null
  status: string
}

export type ToolDefinition = {
  pluginId: string
  name: string
  description: string
  inputSchema?: unknown
}

export type AppConfig = {
  dataRoot: string
  activeUserId?: string | null
  aiProvider: 'anthropic' | 'ollamaCloud' | 'openai'
  apiKeyConfigured: boolean
  apiKeys: {
    anthropic: string
    ollamaCloud: string
    openai: string
  }
  aiModel: string
  theme: 'light' | 'dark' | 'system'
  registryUrl: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export type ChatAttachment = {
  id: string
  content?: string
  kind: 'binary' | 'text'
  name: string
  size: number
  type: string
}

export type SavedChat = {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export const fallbackPlugins: PluginMeta[] = [
  {
    id: 'notes',
    name: 'Notes',
    version: '0.1.0',
    description: 'Clean, fast note-taking with Markdown support and AI writing assistance.',
    enabled: false,
    installedAt: 'Available in registry',
    category: 'productivity',
  },
]

export const fallbackConfig: AppConfig = {
  dataRoot: 'Default application data directory',
  activeUserId: null,
  aiProvider: 'openai',
  apiKeyConfigured: false,
  apiKeys: {
    anthropic: '',
    ollamaCloud: '',
    openai: '',
  },
  aiModel: 'gpt-4.1-mini',
  theme: 'system',
  registryUrl: 'https://raw.githubusercontent.com/DawnDesk/registry/main/index.json',
}

export const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'DawnDesk host is ready. Install plugins to expose productivity tools here.',
  },
]
