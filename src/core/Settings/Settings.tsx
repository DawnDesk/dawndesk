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
  showToast: (kind: 'error' | 'info' | 'success' | 'warning', title: string, detail?: string) => void
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

const primaryButton =
  'inline-flex min-h-[38px] items-center justify-center gap-[var(--dd-space-2)] justify-self-start rounded-[var(--dd-radius-md)] border border-transparent bg-[var(--dd-accent)] px-[var(--dd-space-4)] py-[var(--dd-space-2)] font-extrabold text-[var(--dd-accent-contrast)] shadow-[var(--dd-shadow-sm)] transition-[background,color,transform,border-color] duration-150 hover:-translate-y-px hover:bg-[var(--dd-accent-hover)] active:scale-[0.98] active:bg-[var(--dd-accent-active)] disabled:cursor-not-allowed disabled:opacity-70'
const fieldControl =
  'w-full rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[var(--dd-control-bg)] p-[var(--dd-space-3)] text-[var(--dd-text-primary)] focus:border-[var(--dd-accent)] focus:outline focus:outline-2 focus:outline-[var(--dd-focus-ring)]'

export function Settings({ config, saveConfig, showToast }: SettingsProps) {
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
        showToast('info', `DawnDesk ${update.version} is available`, 'You can install it from Settings.')
      } catch (error) {
        console.warn('Unable to check for DawnDesk updates', error)
        showToast(
          'warning',
          'Unable to check for updates',
          error instanceof Error ? error.message : 'The updater did not return details.',
        )
      }
    }

    detectUpdate()

    return () => {
      cancelled = true
    }
  }, [showToast])

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
    showToast('info', `Downloading DawnDesk ${availableUpdate.version}`)

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
      showToast('success', 'Update installed', 'Restarting DawnDesk now.')
      await relaunch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed'
      setUpdateStatus(message)
      showToast('error', 'Update failed', message)
    } finally {
      setInstallingUpdate(false)
    }
  }

  return (
    <section className="grid grid-cols-[180px_minmax(0,1fr)] gap-[var(--dd-space-5)] p-[var(--dd-space-5)] max-[900px]:grid-cols-1 max-[900px]:px-[var(--dd-space-4)]">
      <aside
        className="flex flex-col gap-[var(--dd-space-1)] rounded-[var(--dd-radius-md)] border border-[var(--dd-border-soft)] bg-[var(--dd-bg-surface)] p-[var(--dd-space-3)] shadow-[var(--dd-shadow-sm)]"
        aria-label="Settings sections"
      >
        {settingsSections.map((section, index) => {
          const Icon = section.icon

          return (
            <button
              className={`inline-flex min-h-9 items-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-sm)] border border-transparent bg-transparent px-[var(--dd-space-3)] py-0 text-left text-[var(--dd-text-secondary)] hover:border-[var(--dd-border-soft)] hover:bg-[var(--dd-accent-muted)] hover:text-[var(--dd-accent)] ${
                index === 0
                  ? 'border-[var(--dd-border-soft)] bg-[var(--dd-accent-muted)] text-[var(--dd-accent)]'
                  : ''
              }`}
              key={section.label}
              type="button"
            >
              <Icon size={15} aria-hidden="true" />
              {section.label}
            </button>
          )
        })}
      </aside>
      <section className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[var(--dd-space-4)] rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[linear-gradient(180deg,var(--dd-panel-sheen),transparent),var(--dd-bg-surface)] p-[var(--dd-space-5)] shadow-[var(--dd-shadow-md)] animate-[panelIn_260ms_ease_both]">
        <label className="col-span-full grid gap-[var(--dd-space-2)]">
          <span className="font-bold text-[var(--dd-text-secondary)]">Data Root Directory</span>
          <input
            className={fieldControl}
            onChange={(event) => saveConfig({ ...config, dataRoot: event.target.value })}
            value={config.dataRoot}
          />
        </label>
        <label className="grid gap-[var(--dd-space-2)]">
          <span className="font-bold text-[var(--dd-text-secondary)]">Language</span>
          <select className={fieldControl} defaultValue="system">
            <option value="system">System</option>
          </select>
        </label>
        <label className="grid gap-[var(--dd-space-2)]">
          <span className="font-bold text-[var(--dd-text-secondary)]">Theme</span>
          <select
            className={fieldControl}
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
        <label className="grid gap-[var(--dd-space-2)]">
          <span className="font-bold text-[var(--dd-text-secondary)]">AI Provider</span>
          <select
            className={fieldControl}
            onChange={(event) => saveProvider(event.target.value as AppConfig['aiProvider'])}
            value={config.aiProvider}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollamaCloud">Ollama Cloud</option>
          </select>
        </label>
        <label className="grid gap-[var(--dd-space-2)]">
          <span className="font-bold text-[var(--dd-text-secondary)]">
            {providerLabels[config.aiProvider]} API Key
          </span>
          <input
            className={fieldControl}
            autoComplete="off"
            onChange={(event) => saveApiKey(event.target.value)}
            type="password"
            value={selectedApiKey}
          />
        </label>
        <label className="grid gap-[var(--dd-space-2)]">
          <span className="font-bold text-[var(--dd-text-secondary)]">Model</span>
          <select
            className={fieldControl}
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
        <label className="col-span-full grid gap-[var(--dd-space-2)]">
          <span className="font-bold text-[var(--dd-text-secondary)]">Registry URL</span>
          <input
            className={fieldControl}
            onChange={(event) => saveConfig({ ...config, registryUrl: event.target.value })}
            value={config.registryUrl}
          />
        </label>
        {availableUpdate ? (
          <section
            className="col-span-full flex items-center justify-between gap-[var(--dd-space-4)] border-t border-[var(--dd-border)] pt-[var(--dd-space-4)]"
            aria-label="DawnDesk updates"
          >
            <div>
              <span className="font-bold text-[var(--dd-text-primary)]">Updates</span>
              <p className="m-0 mt-[var(--dd-space-1)] text-[var(--dd-text-secondary)]">
                {updateStatus}
              </p>
            </div>
            <button
              className={primaryButton}
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
