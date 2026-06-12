import type { AppConfig } from '../../store/appStore'

type SettingsProps = {
  config: AppConfig
  saveConfig: (config: AppConfig) => void
}

export function Settings({ config, saveConfig }: SettingsProps) {
  return (
    <section className="settingsGrid">
      <label className="field">
        <span>Data root</span>
        <input
          onChange={(event) => saveConfig({ ...config, dataRoot: event.target.value })}
          value={config.dataRoot}
        />
      </label>
      <label className="field">
        <span>AI provider</span>
        <select
          onChange={(event) =>
            saveConfig({
              ...config,
              aiProvider: event.target.value as AppConfig['aiProvider'],
            })
          }
          value={config.aiProvider}
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
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
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label className="field wide">
        <span>Registry URL</span>
        <input
          onChange={(event) => saveConfig({ ...config, registryUrl: event.target.value })}
          value={config.registryUrl}
        />
      </label>
    </section>
  )
}
