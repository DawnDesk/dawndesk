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
              <MessageContent content={message.content} />
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

function MessageContent({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className="messageContent">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return <h3 key={index}>{renderInlineMarkdown(block.content)}</h3>
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
              ))}
            </ListTag>
          )
        }

        if (block.type === 'table') {
          return (
            <div className="messageTableWrap" key={index}>
              <table className="messageTable">
                <thead>
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th key={headerIndex}>{renderInlineMarkdown(header)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {block.headers.map((_, cellIndex) => (
                        <td key={cellIndex}>{renderInlineMarkdown(row[cellIndex] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return <p key={index}>{renderInlineMarkdown(block.content)}</p>
      })}
    </div>
  )
}

type MarkdownBlock =
  | { type: 'heading'; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'paragraph'; content: string }

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let listOrdered = false
  let tableRows: string[][] = []

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', content: paragraph.join(' ') })
      paragraph = []
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', ordered: listOrdered, items: listItems })
      listItems = []
    }
  }

  function flushTable() {
    if (tableRows.length > 1) {
      const [headers, ...rows] = tableRows
      blocks.push({ type: 'table', headers, rows })
    } else if (tableRows.length === 1) {
      blocks.push({ type: 'paragraph', content: tableRows[0].join(' | ') })
    }
    tableRows = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      flushTable()
      continue
    }

    if (isMarkdownTableSeparator(trimmed)) {
      flushParagraph()
      flushList()
      continue
    }

    if (isMarkdownTableRow(trimmed)) {
      flushParagraph()
      flushList()
      tableRows.push(parseTableRow(trimmed))
      continue
    }

    const heading = trimmed.match(/^#{1,4}\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      flushTable()
      blocks.push({ type: 'heading', content: heading[1] })
      continue
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/)
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (bullet || numbered) {
      flushParagraph()
      flushTable()
      const ordered = Boolean(numbered)
      if (listItems.length > 0 && listOrdered !== ordered) flushList()
      listOrdered = ordered
      listItems.push((bullet?.[1] ?? numbered?.[1] ?? '').trim())
      continue
    }

    if (/^\*\*[^*]+:\*\*/.test(trimmed)) {
      flushParagraph()
      flushList()
      flushTable()
      blocks.push({ type: 'heading', content: trimmed.replace(/^\*\*([^*]+):\*\*/, '$1') })
      continue
    }

    flushList()
    flushTable()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()
  flushTable()

  return blocks.length > 0 ? blocks : [{ type: 'paragraph', content }]
}

function isMarkdownTableRow(line: string) {
  return line.includes('|') && line.split('|').length >= 3
}

function isMarkdownTableSeparator(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)
}

function parseTableRow(line: string) {
  const normalized = line.replace(/^\|/, '').replace(/\|$/, '')
  return normalized.split('|').map((cell) => cell.trim())
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }

    return <span key={index}>{part}</span>
  })
}
