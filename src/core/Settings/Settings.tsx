import { useEffect, useState } from 'react'
import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'
import {
  Bot,
  Database,
  Palette,
  RefreshCw,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { AppConfig } from '../../store/appStore'

type SettingsProps = {
  config: AppConfig
  saveConfig: (config: AppConfig) => void
}

const providerLabels: Record<AppConfig['aiProvider'], string> = {
  anthropic: 'Anthropic',
  ollamaCloud: 'Ollama Cloud',
  openai: 'OpenAI',
}

const modelOptions: Record<AppConfig['aiProvider'], string[]> = {
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
  ollamaCloud: [
    'gemma3:4b',
    'gemma3:12b',
    'gemma3:27b',
    'gpt-oss:20b',
    'gpt-oss:120b',
    'qwen3-coder-next',
    'qwen3-coder:480b',
    'qwen3-next:80b',
    'deepseek-v3.2',
    'devstral-small-2:24b',
    'ministral-3:8b',
    'ministral-3:14b',
    'kimi-k2.6',
    'minimax-m2.7',
  ],
  openai: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o'],
}

const settingsSections: Array<{ icon: LucideIcon; label: string }> = [
  { icon: SettingsIcon, label: 'General' },
  { icon: Bot, label: 'AI Provider' },
  { icon: Palette, label: 'Appearance' },
  { icon: Database, label: 'Registry' },
  { icon: RefreshCw, label: 'Updates' },
  { icon: SlidersHorizontal, label: 'Advanced' },
]

export function Settings({ config, saveConfig }: SettingsProps) {
  const selectedModels = modelOptions[config.aiProvider]
  const selectedApiKey = config.apiKeys[config.aiProvider]
  const selectedModel = selectedModels.includes(config.aiModel) ? config.aiModel : selectedModels[0]
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null)
  const [updateStatus, setUpdateStatus] = useState('')
  const [installingUpdate, setInstallingUpdate] = useState(false)

  useEffect(() => {
    if (config.aiModel !== selectedModel) {
      saveConfig({ ...config, aiModel: selectedModel })
    }
  }, [config, saveConfig, selectedModel])

  useEffect(() => {
    let cancelled = false

    async function detectUpdate() {
      try {
        const update = await check()

        if (cancelled || !update) {
          return
        }

        setAvailableUpdate(update)
        setUpdateStatus(`DawnDesk ${update.version} is available`)
      } catch (error) {
        console.warn('Unable to check for DawnDesk updates', error)
      }
    }

    detectUpdate()

    return () => {
      cancelled = true
    }
  }, [])

  function saveProvider(aiProvider: AppConfig['aiProvider']) {
    saveConfig({
      ...config,
      aiProvider,
      aiModel: modelOptions[aiProvider][0],
      apiKeyConfigured: Boolean(config.apiKeys[aiProvider].trim()),
    })
  }

  function saveApiKey(value: string) {
    const apiKeys = {
      ...config.apiKeys,
      [config.aiProvider]: value,
    }

    saveConfig({
      ...config,
      apiKeys,
      apiKeyConfigured: Boolean(value.trim()),
    })
  }

  async function installUpdate() {
    if (!availableUpdate) {
      return
    }

    setInstallingUpdate(true)
    setUpdateStatus(`Downloading DawnDesk ${availableUpdate.version}`)

    try {
      let downloaded = 0
      let total = 0

      await availableUpdate.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? 0
          setUpdateStatus(`Downloading DawnDesk ${availableUpdate.version}`)
        }

        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength
          const progress = total > 0 ? Math.round((downloaded / total) * 100) : null
          setUpdateStatus(
            progress
              ? `Downloading DawnDesk ${availableUpdate.version} (${progress}%)`
              : `Downloading DawnDesk ${availableUpdate.version}`,
          )
        }

        if (event.event === 'Finished') {
          setUpdateStatus('Installing update')
        }
      })

      setUpdateStatus('Update installed. Restarting DawnDesk')
      await relaunch()
    } catch (error) {
      setUpdateStatus(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setInstallingUpdate(false)
    }
  }

  return (
    <section className="settingsPage">
      <aside className="settingsNav" aria-label="Settings sections">
        {settingsSections.map((section, index) => {
          const Icon = section.icon

          return (
            <button className={index === 0 ? 'active' : ''} key={section.label} type="button">
              <Icon size={15} aria-hidden="true" />
              {section.label}
            </button>
          )
        })}
      </aside>
      <section className="settingsGrid">
        <label className="field wide">
          <span>Data Root Directory</span>
          <input
            onChange={(event) => saveConfig({ ...config, dataRoot: event.target.value })}
            value={config.dataRoot}
          />
        </label>
        <label className="field">
          <span>Language</span>
          <select defaultValue="system">
            <option value="system">System</option>
          </select>
        </label>
        <label className="field">
          <span>Theme</span>
          <select
            onChange={(event) =>
              saveConfig({ ...config, theme: event.target.value as AppConfig['theme'] })
            }
            value={config.theme}
          >
            <option value="system">System</option>
            <option value="light">Dark (Yellow)</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="field">
          <span>AI Provider</span>
          <select
            onChange={(event) => saveProvider(event.target.value as AppConfig['aiProvider'])}
            value={config.aiProvider}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollamaCloud">Ollama Cloud</option>
          </select>
        </label>
        <label className="field">
          <span>{providerLabels[config.aiProvider]} API Key</span>
          <input
            autoComplete="off"
            onChange={(event) => saveApiKey(event.target.value)}
            type="password"
            value={selectedApiKey}
          />
        </label>
        <label className="field">
          <span>Model</span>
          <select
            onChange={(event) => saveConfig({ ...config, aiModel: event.target.value })}
            value={selectedModel}
          >
            {selectedModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
        <label className="field wide">
          <span>Registry URL</span>
          <input
            onChange={(event) => saveConfig({ ...config, registryUrl: event.target.value })}
            value={config.registryUrl}
          />
        </label>
        {availableUpdate ? (
          <section className="settingsAction wide" aria-label="DawnDesk updates">
            <div>
              <span>Updates</span>
              <p>{updateStatus}</p>
            </div>
            <button
              className="primaryButton"
              disabled={installingUpdate}
              type="button"
              onClick={installUpdate}
            >
              <Sparkles size={15} aria-hidden="true" />
              {installingUpdate ? 'Updating' : 'Update now'}
            </button>
          </section>
        ) : null}
      </section>
    </section>
  )
}
