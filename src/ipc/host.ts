import { invoke } from '@tauri-apps/api/core'
import type { AppConfig, ChatMessage, PluginMeta, ToolDefinition } from '../store/appStore'

type HostChatMessage = Pick<ChatMessage, 'role' | 'content'>

async function callHost<T>(command: string, args?: Record<string, unknown>) {
  if (!isTauriRuntime()) {
    throw new Error('This action requires the DawnDesk desktop app. Browser preview cannot install, delete, or load plugins.')
  }

  return invoke<T>(command, args)
}

function isTauriRuntime() {
  return Boolean(
    '__TAURI_INTERNALS__' in window ||
      '__TAURI__' in window ||
      navigator.userAgent.includes('Tauri'),
  )
}

export async function getSettings() {
  return callHost<AppConfig>('settings_get')
}

export async function saveSettings(config: AppConfig) {
  return callHost<void>('settings_set', { config })
}

export async function listPlugins() {
  return callHost<PluginMeta[]>('plugin_list')
}

export async function installPlugin(id: string, url: string, checksum: string) {
  return callHost<void>('plugin_install', { id, url, checksum })
}

export async function uninstallPlugin(id: string, keepData = false) {
  return callHost<void>('plugin_uninstall', { id, keepData })
}

export async function getPluginEntryDocument(pluginId: string) {
  return callHost<string>('plugin_entry_document', { pluginId })
}

export async function getTools() {
  return callHost<ToolDefinition[]>('ai_get_tools')
}

export async function sendAIMessage(messages: HostChatMessage[], stream = false) {
  return callHost<string>('ai_chat', { messages, stream })
}
