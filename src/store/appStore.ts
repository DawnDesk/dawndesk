export type View = 'workspace' | 'store' | 'ai' | 'settings'

export type PluginMeta = {
  id: string
  name: string
  version: string
  description: string
  enabled: boolean
  installedAt: string
  category?: string
  icon?: string
}

export type ToolDefinition = {
  pluginId: string
  name: string
  description: string
  inputSchema?: unknown
}

export type AppConfig = {
  dataRoot: string
  aiProvider: 'anthropic' | 'openai'
  apiKeyConfigured: boolean
  theme: 'light' | 'dark' | 'system'
  registryUrl: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export const fallbackPlugins: PluginMeta[] = [
  {
    id: 'notes',
    name: 'Notes',
    version: '1.0.0',
    description: 'Clean, fast note-taking with AI writing assistance.',
    enabled: true,
    installedAt: 'Not installed locally',
    category: 'productivity',
  },
  {
    id: 'photo-editor',
    name: 'Photo Editor',
    version: '1.0.0',
    description: 'Image editing plugin slot ready for installation.',
    enabled: false,
    installedAt: 'Available in registry',
    category: 'media',
  },
]

export const fallbackConfig: AppConfig = {
  dataRoot: 'Default application data directory',
  aiProvider: 'openai',
  apiKeyConfigured: false,
  theme: 'system',
  registryUrl: 'https://github.com/dawndesk/registry',
}

export const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'DawnDesk host is ready. Install plugins to expose productivity tools here.',
  },
]
