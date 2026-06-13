import { useEffect, useRef } from 'react'
import { Plus, Save, Send, Trash2 } from 'lucide-react'
import type { ChatMessage, SavedChat } from '../../store/appStore'

type AIPanelProps = {
  activeChatId: string | null
  draft: string
  isGenerating: boolean
  messages: ChatMessage[]
  onDeleteChat: (id: string) => void
  onNewChat: () => void
  onOpenChat: (chat: SavedChat) => void
  onSaveChat: () => void
  savedChats: SavedChat[]
  sendMessage: () => void
  setDraft: (value: string) => void
  streamingMessageId: string | null
}

export function AIPanel({
  activeChatId,
  draft,
  isGenerating,
  messages,
  onDeleteChat,
  onNewChat,
  onOpenChat,
  onSaveChat,
  savedChats,
  sendMessage,
  setDraft,
  streamingMessageId,
}: AIPanelProps) {
  const messageListRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const messageList = messageListRef.current
    if (!messageList) return

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: 'smooth',
    })
  }, [isGenerating, messages])

  return (
    <section className="aiLayout">
      <div className="chatPanel">
        <div className="messageList" ref={messageListRef}>
          {messages.map((message) => (
            <article
              className={`message ${message.role} ${
                message.id === streamingMessageId ? 'streaming' : ''
              }`}
              key={message.id}
            >
              <span className="messageRole">{message.role}</span>
              <MessageContent
                content={message.content}
                isStreaming={message.id === streamingMessageId}
              />
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
            disabled={isGenerating}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask DawnDesk to use installed plugin tools"
            value={draft}
          />
          <button className="primaryButton sendButton" disabled={isGenerating} type="submit">
            <Send size={16} aria-hidden="true" />
            {isGenerating ? 'Sending' : 'Send'}
          </button>
        </form>
      </div>
      <aside className="detailPanel savedChatsPanel">
        <div className="savedChatsHeader">
          <h2>Saved chats</h2>
          <button className="secondaryButton" type="button" onClick={onNewChat}>
            <Plus size={15} aria-hidden="true" />
            New
          </button>
        </div>
        <button className="primaryButton saveChatButton" type="button" onClick={onSaveChat}>
          <Save size={15} aria-hidden="true" />
          Save current chat
        </button>
        {savedChats.length === 0 ? (
          <p className="muted">Saved conversations will appear here.</p>
        ) : (
          <ul className="savedChatList">
            {savedChats.map((chat) => (
              <li
                className={chat.id === activeChatId ? 'savedChat active' : 'savedChat'}
                key={chat.id}
              >
                <button type="button" onClick={() => onOpenChat(chat)}>
                  <strong>{chat.title}</strong>
                  <span>{formatSavedDate(chat.updatedAt)}</span>
                </button>
                <button
                  className="savedChatDelete"
                  type="button"
                  aria-label={`Delete ${chat.title}`}
                  onClick={() => onDeleteChat(chat.id)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </section>
  )
}

function formatSavedDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Saved'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageContent({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  if (!content && isStreaming) {
    return (
      <div className="typingIndicator" aria-label="Assistant is writing">
        <span />
        <span />
        <span />
      </div>
    )
  }

  const blocks = parseMarkdownBlocks(content)

  return (
    <div className={isStreaming ? 'messageContent streamingContent' : 'messageContent'}>
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
      {isStreaming && <span className="streamCursor" aria-hidden="true" />}
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
