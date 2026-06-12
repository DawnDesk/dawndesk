import type { PluginMeta, ToolDefinition } from '../../store/appStore'

type PluginShellProps = {
  activePlugin: PluginMeta | null
  tools: ToolDefinition[]
}

export function PluginShell({ activePlugin, tools }: PluginShellProps) {
  const pluginTools = tools.filter((tool) => tool.pluginId === activePlugin?.id)

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
          <h2>Plugin WebView mount point</h2>
          <p>
            The host owns lifecycle, permissions, and navigation. The plugin frontend will render
            here after installation and manifest validation.
          </p>
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
