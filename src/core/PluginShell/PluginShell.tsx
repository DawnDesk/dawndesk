import { convertFileSrc } from '@tauri-apps/api/core'
import type { PluginMeta, ToolDefinition } from '../../store/appStore'

type PluginShellProps = {
  activePlugin: PluginMeta | null
  tools: ToolDefinition[]
}

export function PluginShell({ activePlugin, tools }: PluginShellProps) {
  const pluginTools = tools.filter((tool) => tool.pluginId === activePlugin?.id)
  const pluginEntryUrl = activePlugin?.entryPath ? convertFileSrc(activePlugin.entryPath) : null

  if (!activePlugin) {
    return (
      <section className="emptyState">
        <h2>No plugin selected</h2>
        <p>Install and enable a plugin to mount its interface in the host shell.</p>
      </section>
    )
  }

  return (
    <section className="workspaceGrid">
      <article className="pluginFrame">
        <div className="frameToolbar">
          <div>
            <strong>{activePlugin.name}</strong>
            <span>{activePlugin.description}</span>
          </div>
          <span className="statusPill">v{activePlugin.version}</span>
        </div>
        <div className="frameBody">
          {pluginEntryUrl ? (
            <iframe className="pluginWebview" src={pluginEntryUrl} title={activePlugin.name} />
          ) : (
            <div>
              <h2>Plugin UI not found</h2>
              <p>This plugin is installed, but its package does not include an index.html entry.</p>
            </div>
          )}
        </div>
      </article>

      <aside className="detailPanel">
        <h2>Manifest</h2>
        <dl>
          <div>
            <dt>ID</dt>
            <dd>{activePlugin.id}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{activePlugin.category ?? 'uncategorized'}</dd>
          </div>
          <div>
            <dt>Installed</dt>
            <dd>{activePlugin.installedAt}</dd>
          </div>
        </dl>
        <h2>AI tools</h2>
        {pluginTools.length === 0 ? (
          <p className="muted">No tools registered for this plugin yet.</p>
        ) : (
          <ul className="toolList">
            {pluginTools.map((tool) => (
              <li key={tool.name}>
                <strong>{tool.name}</strong>
                <span>{tool.description}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </section>
  )
}
