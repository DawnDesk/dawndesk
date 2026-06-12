import type { ChatMessage, ToolDefinition } from '../../store/appStore'

type AIPanelProps = {
  draft: string
  messages: ChatMessage[]
  sendMessage: () => void
  setDraft: (value: string) => void
  tools: ToolDefinition[]
}

export function AIPanel({ draft, messages, sendMessage, setDraft, tools }: AIPanelProps) {
  return (
    <section className="aiLayout">
      <div className="chatPanel">
        <div className="messageList">
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <span>{message.role}</span>
              <p>{message.content}</p>
            </article>
          ))}
        </div>
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <textarea
            aria-label="Message"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask DawnDesk to use installed plugin tools"
            value={draft}
          />
          <button className="primaryButton" type="submit">
            Send
          </button>
        </form>
      </div>
      <aside className="detailPanel">
        <h2>Registered tools</h2>
        {tools.length === 0 ? (
          <p className="muted">Tools will appear after plugins with aiTools are installed.</p>
        ) : (
          <ul className="toolList">
            {tools.map((tool) => (
              <li key={`${tool.pluginId}-${tool.name}`}>
                <strong>{tool.name}</strong>
                <span>{tool.pluginId}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </section>
  )
}
