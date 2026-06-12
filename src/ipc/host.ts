import { invoke } from '@tauri-apps/api/core'
import type { AppConfig, ChatMessage, PluginMeta, ToolDefinition } from '../store/appStore'

type HostChatMessage = Pick<ChatMessage, 'role' | 'content'>

async function callHost<T>(command: string, args?: Record<string, unknown>) {
  return invoke<T>(command, args)
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

export async function getTools() {
  return callHost<ToolDefinition[]>('ai_get_tools')
}

export async function sendAIMessage(messages: HostChatMessage[], stream = false) {
  return callHost<string>('ai_chat', { messages, stream })
}
