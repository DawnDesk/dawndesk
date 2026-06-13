import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Plus,
  Save,
  Send,
  Terminal,
  Trash2,
  User,
  X,
} from 'lucide-react'
import type { ChatAttachment, ChatMessage, SavedChat } from '../../store/appStore'

type AIPanelProps = {
  activeChatId: string | null
  attachments: ChatAttachment[]
  draft: string
  isGenerating: boolean
  messages: ChatMessage[]
  onAttachFiles: (files: FileList | File[]) => void
  onDeleteChat: (id: string) => void
  onNewChat: () => void
  onOpenChat: (chat: SavedChat) => void
  onRemoveAttachment: (id: string) => void
  onSaveChat: () => void
  savedChats: SavedChat[]
  sendMessage: () => void
  setDraft: (value: string) => void
  streamingMessageId: string | null
  toolCount: number
}

const primaryButton =
  'inline-flex min-h-[38px] items-center justify-center gap-[var(--dd-space-2)] justify-self-start rounded-full border border-transparent bg-[var(--dd-accent)] px-[var(--dd-space-4)] py-[var(--dd-space-2)] font-semibold text-[var(--dd-accent-contrast)] shadow-[var(--dd-shadow-sm)] transition-[background,color,transform,border-color] duration-150 hover:bg-[var(--dd-accent-hover)] active:scale-[0.98] active:bg-[var(--dd-accent-active)] disabled:cursor-not-allowed disabled:opacity-70'
const secondaryButton =
  'inline-flex min-h-[38px] items-center justify-center gap-[var(--dd-space-2)] justify-self-start rounded-full border border-[var(--dd-border)] bg-transparent px-[var(--dd-space-4)] py-[var(--dd-space-2)] text-[var(--dd-text-secondary)] transition-[background,color,border-color] duration-150 hover:border-[var(--dd-border-strong)] hover:bg-[var(--dd-bg-hover)] hover:text-[var(--dd-text-primary)] disabled:cursor-not-allowed disabled:opacity-70'
const panel =
  'rounded-[24px] border border-[var(--dd-border)] bg-[var(--dd-bg-surface)] shadow-[var(--dd-shadow-md)] animate-[panelIn_260ms_ease_both]'
const field =
  'w-full border-0 bg-transparent px-[var(--dd-space-3)] py-[var(--dd-space-2)] text-[var(--dd-text-primary)] outline-none placeholder:text-[var(--dd-text-muted)] disabled:cursor-wait disabled:opacity-70'
const messageShell =
  'group flex w-full gap-[var(--dd-space-3)] animate-[messageIn_240ms_ease_both]'
const messageAvatar =
  'mt-1 grid size-8 shrink-0 place-items-center rounded-[var(--dd-radius-sm)] border border-[var(--dd-border)] bg-[var(--dd-bg-elevated)] text-[var(--dd-text-muted)] opacity-80'

export function AIPanel({
  activeChatId,
  attachments,
  draft,
  isGenerating,
  messages,
  onAttachFiles,
  onDeleteChat,
  onNewChat,
  onOpenChat,
  onRemoveAttachment,
  onSaveChat,
  savedChats,
  sendMessage,
  setDraft,
  streamingMessageId,
  toolCount,
}: AIPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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
    <section className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px] gap-[var(--dd-space-5)] overflow-hidden bg-[var(--dd-bg-base)] p-[var(--dd-space-5)] max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto max-[900px]:px-[var(--dd-space-4)]">
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] border border-[var(--dd-border)] bg-[var(--dd-bg-base)]">
        <div
          className="mx-auto flex min-h-0 w-full max-w-[940px] flex-1 flex-col gap-[var(--dd-space-6)] overflow-y-auto scroll-smooth px-[var(--dd-space-8)] py-[var(--dd-space-8)] max-[900px]:px-[var(--dd-space-4)]"
          ref={messageListRef}
        >
          {messages.map((message) => {
            const isUser = message.role === 'user'
            const isStreaming = message.id === streamingMessageId

            return (
              <article
                className={`${messageShell} ${isUser ? 'ml-auto max-w-[74%] flex-row-reverse' : 'max-w-[820px]'}`}
                key={message.id}
              >
                <span
                  className={`${messageAvatar} ${
                    isUser
                      ? 'hidden border-[var(--dd-border)] bg-[var(--dd-message-user-bg)] text-[var(--dd-accent)]'
                      : ''
                  }`}
                  aria-hidden="true"
                >
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </span>
                <div
                  className={`min-w-0 leading-[1.6] ${
                    isUser
                      ? 'rounded-[22px] bg-[var(--dd-message-user-bg)] px-[var(--dd-space-4)] py-[var(--dd-space-3)] text-left text-[var(--dd-text-primary)]'
                      : 'px-0 py-[var(--dd-space-1)]'
                  } ${
                    isStreaming
                      ? 'rounded-[22px] border border-[var(--dd-stream-border)] px-[var(--dd-space-4)] py-[var(--dd-space-3)] shadow-[0_0_0_1px_var(--dd-stream-ring)]'
                      : ''
                  }`}
                >
                  <span
                    className={`${isUser ? 'sr-only' : 'mb-[var(--dd-space-2)] block'} text-[0.72rem] font-semibold capitalize tracking-normal text-[var(--dd-text-muted)]`}
                  >
                    {message.role}
                  </span>
                  <MessageContent content={message.content} isStreaming={isStreaming} />
                </div>
              </article>
            )
          })}
        </div>
        <div className="mx-auto mb-[var(--dd-space-5)] grid w-[calc(100%_-_var(--dd-space-8))] max-w-[940px] gap-[var(--dd-space-2)] max-[900px]:w-[calc(100%_-_var(--dd-space-4))]">
          {attachments.length > 0 ? (
            <ul className="m-0 flex list-none flex-wrap gap-[var(--dd-space-2)] p-0">
              {attachments.map((attachment) => (
                <li
                  className="inline-flex max-w-[240px] items-center gap-[var(--dd-space-2)] rounded-full border border-[rgba(250,204,21,0.28)] bg-[rgba(250,204,21,0.08)] px-[var(--dd-space-3)] py-[var(--dd-space-2)] text-[0.82rem] text-[var(--dd-text-secondary)]"
                  key={attachment.id}
                >
                  <FileText size={14} className="shrink-0 text-[var(--dd-accent)]" aria-hidden="true" />
                  <span className="min-w-0 truncate">{attachment.name}</span>
                  <button
                    className="grid size-5 shrink-0 place-items-center rounded-full text-[var(--dd-text-muted)] hover:bg-[rgba(250,204,21,0.14)] hover:text-[var(--dd-text-primary)]"
                    type="button"
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() => onRemoveAttachment(attachment.id)}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <form
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-2)] rounded-full border border-[var(--dd-border)] bg-[var(--dd-composer-bg)] p-[var(--dd-space-2)] shadow-[0_12px_34px_rgba(0,0,0,0.28)]"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
          >
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              multiple
              onChange={(event) => {
                if (event.currentTarget.files) onAttachFiles(event.currentTarget.files)
                event.currentTarget.value = ''
              }}
            />
            <button
              className="grid size-11 place-items-center rounded-full text-[var(--dd-text-secondary)] transition-colors hover:bg-[var(--dd-bg-hover)] hover:text-[var(--dd-text-primary)]"
              type="button"
              aria-label="Attach files"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={20} aria-hidden="true" />
            </button>
            <textarea
              className={`${field} min-h-[48px] resize-none`}
              aria-label="Message"
              disabled={isGenerating}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                toolCount > 0
                  ? `Ask DawnDesk to use ${toolCount} available plugin tool${toolCount === 1 ? '' : 's'}`
                  : 'Ask DawnDesk to use installed plugin tools'
              }
              value={draft}
            />
            <button
              className={`${primaryButton} relative min-h-12 min-w-[96px] overflow-hidden disabled:after:absolute disabled:after:inset-0 disabled:after:animate-[shimmer_1.1s_linear_infinite] disabled:after:bg-[linear-gradient(90deg,transparent,var(--dd-shimmer),transparent)]`}
              disabled={isGenerating}
              type="submit"
            >
              <Send size={16} aria-hidden="true" />
              {isGenerating ? 'Sending' : 'Send'}
            </button>
          </form>
        </div>
      </div>
      <aside
        className={`${panel} flex min-h-0 flex-col gap-[var(--dd-space-4)] overflow-hidden p-[var(--dd-space-5)]`}
      >
        <div className="flex items-center justify-between gap-[var(--dd-space-3)] border-b border-[var(--dd-border)] pb-[var(--dd-space-3)]">
          <h2 className="m-0 text-base">Saved chats</h2>
          <button className={secondaryButton} type="button" onClick={onNewChat}>
            <Plus size={15} aria-hidden="true" />
            New
          </button>
        </div>
        <button
          className={`${primaryButton} w-full justify-self-stretch`}
          type="button"
          onClick={onSaveChat}
        >
          <Save size={15} aria-hidden="true" />
          Save current chat
        </button>
        {savedChats.length === 0 ? (
          <p className="text-[var(--dd-text-muted)]">Saved conversations will appear here.</p>
        ) : (
          <ul className="m-0 grid min-h-0 flex-1 content-start list-none gap-[var(--dd-space-3)] overflow-y-auto p-0 pr-[var(--dd-space-1)]">
            {savedChats.map((chat) => (
              <li
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[var(--dd-control-bg)] p-[var(--dd-space-2)] ${
                  chat.id === activeChatId
                    ? 'border-[var(--dd-accent)] bg-[linear-gradient(90deg,var(--dd-accent-muted-strong),var(--dd-accent-muted-soft)),var(--dd-bg-elevated)]'
                    : ''
                }`}
                key={chat.id}
              >
                <button
                  className="grid min-w-0 cursor-pointer gap-[var(--dd-space-1)] border-0 bg-transparent text-left font-inherit text-inherit"
                  type="button"
                  onClick={() => onOpenChat(chat)}
                >
                  <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.92rem] text-[var(--dd-text-primary)]">
                    {chat.title}
                  </strong>
                  <span className="text-[0.78rem] text-[var(--dd-text-muted)]">
                    {formatSavedDate(chat.updatedAt)}
                  </span>
                </button>
                <button
                  className="grid size-8 cursor-pointer place-items-center rounded-[var(--dd-radius-sm)] border border-[var(--dd-border)] bg-transparent p-0 text-[var(--dd-danger)] hover:bg-[var(--dd-bg-elevated)]"
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
      <div
        className="inline-flex min-h-[22px] items-center gap-[var(--dd-space-2)]"
        aria-label="Assistant is writing"
      >
        <span className="size-[7px] rounded-full bg-[var(--dd-accent)] opacity-40 animate-[typingPulse_900ms_ease-in-out_infinite]" />
        <span className="size-[7px] rounded-full bg-[var(--dd-accent)] opacity-40 animate-[typingPulse_900ms_ease-in-out_infinite] [animation-delay:120ms]" />
        <span className="size-[7px] rounded-full bg-[var(--dd-accent)] opacity-40 animate-[typingPulse_900ms_ease-in-out_infinite] [animation-delay:240ms]" />
      </div>
    )
  }

  const { displayContent, commands } = extractPluginCommands(content)
  const blocks = displayContent ? parseMarkdownBlocks(displayContent) : []

  return (
    <div
      className={`block text-[0.94rem] text-[var(--dd-text-secondary)] [&>*+*]:mt-[var(--dd-space-2)] [&_code]:rounded-[var(--dd-radius-sm)] [&_code]:border [&_code]:border-[var(--dd-border)] [&_code]:bg-[var(--dd-bg-elevated)] [&_code]:px-[var(--dd-space-1)] [&_code]:font-[var(--dd-font-mono)] [&_code]:text-[var(--dd-text-primary)] [&_h3]:m-0 [&_h3]:mt-[var(--dd-space-1)] [&_h3]:text-[0.98rem] [&_h3]:text-[var(--dd-text-primary)] [&_ol]:m-0 [&_ol]:block [&_ol]:pl-[var(--dd-space-5)] [&_p]:m-0 [&_span]:text-inherit [&_strong]:text-[var(--dd-text-primary)] [&_ul]:m-0 [&_ul]:block [&_ul]:pl-[var(--dd-space-5)] ${
        isStreaming ? 'relative' : ''
      }`}
    >
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
            <div className="max-w-full overflow-x-auto" key={index}>
              <table className="w-full min-w-[520px] border-collapse text-[0.9rem] [&_td]:border [&_td]:border-[var(--dd-border)] [&_td]:p-[var(--dd-space-2)] [&_td]:text-left [&_td]:align-top [&_th]:border [&_th]:border-[var(--dd-border)] [&_th]:bg-[var(--dd-bg-elevated)] [&_th]:p-[var(--dd-space-2)] [&_th]:text-left [&_th]:align-top [&_th]:font-bold [&_th]:text-[var(--dd-text-primary)]">
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

        if (block.type === 'code') {
          return <CodeBlock block={block} key={index} />
        }

        return <p key={index}>{renderInlineMarkdown(block.content)}</p>
      })}
      {commands.map((command, index) => (
        <PluginCommandDisclosure command={command} key={`${command.pluginId}-${command.name}-${index}`} />
      ))}
      {isStreaming && (
        <span
          className="ml-[var(--dd-space-1)] inline-block h-[1.05em] w-[7px] rounded-full bg-[var(--dd-accent)] align-[-0.15em] animate-[cursorBlink_860ms_steps(2,start)_infinite]"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

type PluginCommand = {
  pluginId: string
  name: string
  arguments: unknown
}

function extractPluginCommands(content: string): {
  displayContent: string
  commands: PluginCommand[]
} {
  const commands: PluginCommand[] = []
  const consumedRanges: Array<[number, number]> = []
  const fencedJson = /```(?:json)?\s*([\s\S]*?)```/gi

  for (const match of content.matchAll(fencedJson)) {
    const candidate = parsePluginCommand(match[1])
    if (!candidate || match.index === undefined) continue
    commands.push(candidate)
    consumedRanges.push([match.index, match.index + match[0].length])
  }

  const objectPattern = /\{\s*"pluginId"\s*:\s*"[^"]+"\s*,\s*"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\[[\s\S]*?\]|null|"[^"]*"|\d+|true|false)\s*\}/g
  for (const match of content.matchAll(objectPattern)) {
    if (match.index === undefined || rangeConsumed(match.index, consumedRanges)) continue
    const candidate = parsePluginCommand(match[0])
    if (!candidate) continue
    commands.push(candidate)
    consumedRanges.push([match.index, match.index + match[0].length])
  }

  if (commands.length === 0) return { displayContent: content, commands }

  const displayContent = removeRanges(content, consumedRanges)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { displayContent, commands }
}

function parsePluginCommand(value: string): PluginCommand | null {
  try {
    const parsed = JSON.parse(value.trim())
    if (!parsed || typeof parsed !== 'object') return null

    const command = parsed as { pluginId?: unknown; name?: unknown; arguments?: unknown }
    if (typeof command.pluginId !== 'string' || typeof command.name !== 'string') return null

    return {
      pluginId: command.pluginId,
      name: command.name,
      arguments: command.arguments ?? {},
    }
  } catch {
    return null
  }
}

function rangeConsumed(index: number, ranges: Array<[number, number]>) {
  return ranges.some(([start, end]) => index >= start && index < end)
}

function removeRanges(content: string, ranges: Array<[number, number]>) {
  const sortedRanges = [...ranges].sort((left, right) => left[0] - right[0])
  let cursor = 0
  let output = ''

  for (const [start, end] of sortedRanges) {
    output += content.slice(cursor, start)
    cursor = end
  }

  return output + content.slice(cursor)
}

type MarkdownBlock =
  | { type: 'heading'; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code'; language: string; content: string }
  | { type: 'paragraph'; content: string }

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let listOrdered = false
  let tableRows: string[][] = []
  let codeLines: string[] = []
  let codeLanguage = ''

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

  function flushCode() {
    blocks.push({
      type: 'code',
      language: codeLanguage || 'text',
      content: codeLines.join('\n'),
    })
    codeLines = []
    codeLanguage = ''
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (codeLanguage || codeLines.length > 0) {
      if (trimmed.startsWith('```')) {
        flushCode()
      } else {
        codeLines.push(line)
      }
      continue
    }

    if (!trimmed) {
      flushParagraph()
      flushList()
      flushTable()
      continue
    }

    if (trimmed.startsWith('```')) {
      flushParagraph()
      flushList()
      flushTable()
      codeLanguage = trimmed.slice(3).trim() || 'text'
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
  if (codeLanguage || codeLines.length > 0) flushCode()

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

function CodeBlock({ block }: { block: Extract<MarkdownBlock, { type: 'code' }> }) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(block.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <figure className="m-0 overflow-hidden rounded-[22px] border border-[var(--dd-border)] bg-[#171717] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
      <figcaption className="flex min-h-12 items-center justify-between gap-[var(--dd-space-3)] bg-[#202020] px-[var(--dd-space-4)] text-[0.84rem] text-[var(--dd-text-secondary)]">
        <span className="font-semibold text-[var(--dd-text-primary)]">
          {block.language}
        </span>
        <button
          className="inline-flex size-9 items-center justify-center rounded-full text-[var(--dd-text-secondary)] transition-colors hover:bg-[var(--dd-bg-hover)] hover:text-[var(--dd-text-primary)]"
          type="button"
          aria-label={copied ? 'Copied code' : 'Copy code'}
          onClick={copyCode}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        </button>
      </figcaption>
      <pre className="m-0 max-h-[460px] overflow-auto p-[var(--dd-space-5)] text-left text-[0.9rem] leading-relaxed text-[var(--dd-text-secondary)]">
        <code className="!border-0 !bg-transparent !p-0 font-[var(--dd-font-mono)] !text-inherit">
          {block.content}
        </code>
      </pre>
    </figure>
  )
}

function PluginCommandDisclosure({ command }: { command: PluginCommand }) {
  const [copied, setCopied] = useState(false)
  const commandJson = JSON.stringify(command, null, 2)

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(commandJson)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <details className="group overflow-hidden rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[var(--dd-command-bg)] transition-colors hover:bg-[var(--dd-command-bg-hover)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-[var(--dd-space-3)] px-[var(--dd-space-3)] py-[var(--dd-space-2)] text-[0.88rem] text-[var(--dd-text-secondary)] [&::-webkit-details-marker]:hidden">
        <span className="inline-flex min-w-0 items-center gap-[var(--dd-space-2)]">
          <Terminal size={15} className="shrink-0 text-[var(--dd-accent)]" aria-hidden="true" />
          <span className="min-w-0 truncate">
            Plugin command: <strong className="font-semibold text-[var(--dd-text-primary)]">{command.name}</strong>
          </span>
        </span>
        <ChevronDown
          size={16}
          className="shrink-0 text-[var(--dd-text-muted)] transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="grid gap-[var(--dd-space-3)] border-t border-[var(--dd-border)] bg-[var(--dd-bg-base)] p-[var(--dd-space-3)]">
        <dl className="m-0 grid grid-cols-[92px_minmax(0,1fr)] gap-x-[var(--dd-space-3)] gap-y-[var(--dd-space-2)] text-[0.84rem]">
          <dt className="text-[var(--dd-text-muted)]">Plugin</dt>
          <dd className="m-0 font-[var(--dd-font-mono)] text-[var(--dd-text-primary)]">
            {command.pluginId}
          </dd>
          <dt className="text-[var(--dd-text-muted)]">Command</dt>
          <dd className="m-0 font-[var(--dd-font-mono)] text-[var(--dd-text-primary)]">
            {command.name}
          </dd>
        </dl>
        <pre className="m-0 max-h-64 overflow-auto rounded-[var(--dd-radius-sm)] border border-[var(--dd-border)] bg-[var(--dd-control-bg)] p-[var(--dd-space-3)] text-[0.82rem] leading-relaxed text-[var(--dd-text-secondary)]">
          <code className="!border-0 !bg-transparent !p-0 font-[var(--dd-font-mono)] !text-inherit">
            {JSON.stringify(command.arguments, null, 2)}
          </code>
        </pre>
        <button
          className="inline-flex w-fit items-center gap-[var(--dd-space-1)] rounded-[var(--dd-radius-sm)] border border-[var(--dd-border)] bg-transparent px-[var(--dd-space-2)] py-[var(--dd-space-1)] text-[0.82rem] text-[var(--dd-text-secondary)] transition-colors hover:border-[var(--dd-border-strong)] hover:text-[var(--dd-text-primary)]"
          type="button"
          onClick={copyCommand}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? 'Copied command' : 'Copy command'}
        </button>
      </div>
    </details>
  )
}
