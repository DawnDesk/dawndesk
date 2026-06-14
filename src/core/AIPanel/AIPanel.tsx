import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import {
  Check,
  Code2,
  Copy,
  FileImage,
  FileText,
  Link,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { userAvatarUrl, userDisplayName, type AuthUser } from '../../auth/supabase'
import type { ChatAttachment, ChatMessage, SavedChat } from '../../store/appStore'

type AIPanelProps = {
  activeChatId: string | null
  attachments: ChatAttachment[]
  currentUser: AuthUser | null
  draft: string
  isGenerating: boolean
  messages: ChatMessage[]
  onAttachFiles: (files: FileList | File[]) => void
  onDeleteChat: (id: string) => void
  onNewChat: () => void
  onOpenChat: (chat: SavedChat) => void
  onRemoveAttachment: (id: string) => void
  savedChats: SavedChat[]
  sendMessage: () => void
  setDraft: (value: string) => void
  streamingMessageId: string | null
  toolCount: number
}

type HistoryItem = {
  id: string
  chat?: SavedChat
  group: string
  time: string
  title: string
}

const panel =
  'border border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012)),rgba(8,14,20,0.82)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl'
const iconButton =
  'grid size-9 place-items-center rounded-[var(--dd-radius-md)] text-[var(--dd-text-secondary)] transition-[background,color] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--dd-text-primary)] disabled:cursor-not-allowed disabled:opacity-60'

export const sampleMessages: ChatMessage[] = [
  {
    id: 'sample-user',
    role: 'user',
    content: 'Help me optimize this Python function to improve performance.',
  },
  {
    id: 'sample-assistant',
    role: 'assistant',
    content:
      "Here's an optimized version of your Python function with improved performance:\n\n```python\ndef optimize_data(data):\n    lookup = {item['id']: item for item in data}\n    result = []\n\n    for item in data:\n        if item['value'] > 100:\n            result.append(lookup[item['ref_id']])\n\n    return result\n```\n\n- Uses dictionary for O(1) lookup instead of nested loops\n- Reduces time complexity from O(n²) to O(n)\n- Improves overall performance significantly",
  },
]

export const fallbackHistory: HistoryItem[] = [
  { id: 'today-1', group: 'Today', title: 'Help me optimize this code', time: '2:30 PM' },
  { id: 'today-2', group: 'Today', title: 'Summarize this document', time: '11:15 AM' },
  { id: 'today-3', group: 'Today', title: 'Ideas for content calendar', time: '10:02 AM' },
  { id: 'yesterday-1', group: 'Yesterday', title: 'Explain this concept', time: '' },
  { id: 'yesterday-2', group: 'Yesterday', title: 'Create a marketing plan', time: '' },
  { id: 'yesterday-3', group: 'Yesterday', title: 'Best practices for React', time: '' },
  { id: 'previous-1', group: 'Previous 7 Days', title: 'Generate project ideas', time: '' },
  { id: 'previous-2', group: 'Previous 7 Days', title: 'Make a study plan', time: '' },
]

export function AIPanel({
  activeChatId,
  attachments,
  currentUser,
  draft,
  isGenerating,
  messages,
  onAttachFiles,
  onDeleteChat,
  onNewChat,
  onOpenChat,
  onRemoveAttachment,
  savedChats,
  sendMessage,
  setDraft,
  streamingMessageId,
  toolCount,
}: AIPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState('')

  const visibleMessages = useMemo(() => {
    return messages.filter((message) => message.id !== 'welcome' && message.content.trim())
  }, [messages])

  const history = useMemo(() => buildHistory(savedChats), [savedChats])
  const filteredHistory = history.filter((item) =>
    item.title.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const groupedHistory = groupHistory(query.trim() ? filteredHistory : history)

  useEffect(() => {
    const messageList = messageListRef.current
    if (!messageList) return

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: 'smooth',
    })
  }, [isGenerating, visibleMessages])

  return (
    <section className="relative min-h-0 flex-1 overflow-hidden bg-[#03080c] px-[var(--dd-space-7)] pb-[var(--dd-space-5)] pt-[var(--dd-space-6)] max-[900px]:overflow-y-auto max-[900px]:px-[var(--dd-space-4)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_2%,rgba(250,204,21,0.08),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(59,130,246,0.08),transparent_22%)]" />

      <div className="relative mx-auto grid h-full min-h-0 w-full max-w-[1320px] grid-rows-[auto_minmax(0,1fr)_auto] gap-[var(--dd-space-5)]">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-[var(--dd-space-4)]">
          <div>
            <h1 className="m-0 text-[clamp(2rem,3vw,2.75rem)] font-extrabold leading-tight tracking-normal text-[var(--dd-text-primary)]">
              AI Chat
            </h1>
            <p className="m-0 mt-[var(--dd-space-2)] text-[1rem] text-[var(--dd-text-secondary)]">
              Chat with your AI assistant using the power of your plugins and workspace.
            </p>
          </div>
          <div className="flex items-center gap-[var(--dd-space-3)]">
            <button
              className="inline-flex min-h-[50px] items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] border border-[var(--dd-accent)] bg-[var(--dd-accent)] px-[var(--dd-space-5)] text-[0.98rem] font-extrabold text-[var(--dd-accent-contrast)] shadow-[0_14px_30px_rgba(250,204,21,0.2)] transition-[background,transform] hover:-translate-y-px hover:bg-[var(--dd-accent-hover)]"
              type="button"
              onClick={onNewChat}
            >
              <Plus size={20} aria-hidden="true" />
              New Chat
            </button>
          </div>
        </header>

        <div className="grid min-h-0 gap-[var(--dd-space-4)] lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className={`${panel} grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] rounded-[var(--dd-radius-lg)] p-[var(--dd-space-3)]`}>
            <label className="mb-[var(--dd-space-4)] grid h-12 grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.025)] px-[var(--dd-space-3)] text-[var(--dd-text-muted)]">
              <Search size={18} aria-hidden="true" />
              <input
                className="min-w-0 border-0 bg-transparent text-[0.92rem] text-[var(--dd-text-primary)] outline-none placeholder:text-[var(--dd-text-muted)]"
                placeholder="Search chats..."
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="min-h-0 overflow-y-auto pr-[var(--dd-space-1)]">
              {groupedHistory.length > 0 ? groupedHistory.map((group) => (
                <section className="mb-[var(--dd-space-4)] last:mb-0" key={group.name}>
                  <h2 className="m-0 mb-[var(--dd-space-2)] px-[var(--dd-space-3)] text-[0.85rem] font-medium text-[var(--dd-text-muted)]">
                    {group.name}
                  </h2>
                  <div className="grid gap-[var(--dd-space-1)]">
                    {group.items.map((item, itemIndex) => {
                      const isActive = item.chat?.id === activeChatId || (!activeChatId && group.name === 'Today' && itemIndex === 0)

                      return (
                        <div
                          className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[var(--dd-space-1)] rounded-[var(--dd-radius-md)] border border-transparent ${
                            isActive
                              ? 'bg-[linear-gradient(90deg,rgba(250,204,21,0.22),rgba(250,204,21,0.09))] shadow-[inset_3px_0_0_var(--dd-accent)]'
                              : 'hover:bg-[rgba(255,255,255,0.035)]'
                          }`}
                          key={item.id}
                        >
                          <button
                            className="min-w-0 px-[var(--dd-space-3)] py-[var(--dd-space-3)] text-left"
                            type="button"
                            onClick={() => item.chat && onOpenChat(item.chat)}
                          >
                            <strong className="block truncate text-[0.92rem] font-medium text-[var(--dd-text-primary)]">
                              {item.title}
                            </strong>
                            {item.time ? (
                              <small className="mt-1 block text-[0.82rem] text-[var(--dd-text-muted)]">
                                {item.time}
                              </small>
                            ) : null}
                          </button>
                          {item.chat ? (
                            <button
                              className="mr-[var(--dd-space-1)] grid size-8 place-items-center rounded-[var(--dd-radius-sm)] text-[var(--dd-text-muted)] opacity-0 transition-opacity hover:bg-[rgba(239,68,68,0.12)] hover:text-[var(--dd-danger)] group-hover:opacity-100"
                              type="button"
                              aria-label={`Delete ${item.title}`}
                              onClick={() => onDeleteChat(item.chat!.id)}
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )) : (
                <div className="rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.02)] p-[var(--dd-space-4)] text-[0.88rem] leading-6 text-[var(--dd-text-secondary)]">
                  {query.trim() ? 'No saved chats match your search.' : 'Your chats will appear here after you send a message.'}
                </div>
              )}
            </div>

            <p className="m-0 mt-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.14)] px-[var(--dd-space-3)] py-[var(--dd-space-2)] text-center text-[0.82rem] text-[var(--dd-text-muted)]">
              Chats save automatically
            </p>
          </aside>

          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-[var(--dd-space-4)]">
            <div
              className={`${panel} min-h-0 overflow-y-auto rounded-[var(--dd-radius-lg)] px-[var(--dd-space-5)] py-[var(--dd-space-5)]`}
              ref={messageListRef}
            >
              <div className="grid gap-[var(--dd-space-5)]">
                {visibleMessages.length > 0 ? visibleMessages.map((message, index) => (
                  <MessageBubble
                    currentUser={currentUser}
                    isStreaming={message.id === streamingMessageId}
                    key={message.id}
                    message={message}
                    showDivider={index < visibleMessages.length - 1}
                  />
                )) : (
                  <div className="grid min-h-[360px] place-items-center text-center">
                    <div className="max-w-md">
                      <h2 className="m-0 text-[1.3rem] font-extrabold text-[var(--dd-text-primary)]">
                        Start a real conversation
                      </h2>
                      <p className="m-0 mt-[var(--dd-space-2)] text-[0.95rem] leading-7 text-[var(--dd-text-secondary)]">
                        Ask DawnDesk AI something. Your chat will be saved automatically after you send it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Composer
              attachments={attachments}
              draft={draft}
              fileInputRef={fileInputRef}
              isGenerating={isGenerating}
              onAttachFiles={onAttachFiles}
              onRemoveAttachment={onRemoveAttachment}
              sendMessage={sendMessage}
              setDraft={setDraft}
              toolCount={toolCount}
            />

          </div>
        </div>
      </div>
    </section>
  )
}

function MessageBubble({
  currentUser,
  isStreaming,
  message,
  showDivider,
}: {
  currentUser: AuthUser | null
  isStreaming: boolean
  message: ChatMessage
  showDivider: boolean
}) {
  const isUser = message.role === 'user'
  const avatarUrl = userAvatarUrl(currentUser)
  const displayName = userDisplayName(currentUser)

  return (
    <article className={`${showDivider ? 'border-b border-[rgba(148,163,184,0.14)] pb-[var(--dd-space-5)]' : ''}`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-[var(--dd-space-4)]">
        <span
          className={`grid size-10 place-items-center overflow-hidden rounded-full ${
            isUser
              ? 'bg-[linear-gradient(180deg,#f8fafc,#64748b)] text-[var(--dd-accent-contrast)]'
              : 'bg-[linear-gradient(180deg,#f8fafc,#b45309)] text-[#5f3d05] shadow-[0_0_0_5px_rgba(250,204,21,0.12)]'
          }`}
          aria-hidden="true"
        >
          {isUser && avatarUrl ? (
            <img alt="" className="size-full object-cover" src={avatarUrl} />
          ) : isUser ? (
            <User size={19} />
          ) : (
            <img alt="" className="size-8 object-contain" src="/logo.png" />
          )}
        </span>
        <div className="min-w-0">
          <strong className="block text-[1.02rem] font-extrabold text-[var(--dd-text-primary)]">
            {isUser ? displayName : 'DawnDesk AI'}
          </strong>
          <div className="mt-[var(--dd-space-2)] text-[0.98rem] leading-7 text-[var(--dd-text-secondary)]">
            <MessageContent content={message.content} isStreaming={isStreaming} />
          </div>
        </div>
        <time className="whitespace-nowrap text-[0.88rem] text-[var(--dd-text-muted)]">
          2:30 PM
        </time>
      </div>
    </article>
  )
}

function Composer({
  attachments,
  draft,
  fileInputRef,
  isGenerating,
  onAttachFiles,
  onRemoveAttachment,
  sendMessage,
  setDraft,
  toolCount,
}: {
  attachments: ChatAttachment[]
  draft: string
  fileInputRef: MutableRefObject<HTMLInputElement | null>
  isGenerating: boolean
  onAttachFiles: (files: FileList | File[]) => void
  onRemoveAttachment: (id: string) => void
  sendMessage: () => void
  setDraft: (value: string) => void
  toolCount: number
}) {
  return (
    <div className={`${panel} rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)]`}>
      {attachments.length > 0 ? (
        <ul className="m-0 mb-[var(--dd-space-3)] flex list-none flex-wrap gap-[var(--dd-space-2)] p-0">
          {attachments.map((attachment) => (
            <li
              className="inline-flex max-w-[260px] items-center gap-[var(--dd-space-2)] rounded-full border border-[rgba(250,204,21,0.24)] bg-[rgba(250,204,21,0.07)] px-[var(--dd-space-3)] py-[var(--dd-space-2)] text-[0.82rem] text-[var(--dd-text-secondary)]"
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
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[var(--dd-space-3)]"
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
        <div className="min-w-0">
          <textarea
            className="min-h-[44px] w-full resize-none border-0 bg-transparent text-[0.98rem] leading-6 text-[var(--dd-text-primary)] outline-none placeholder:text-[var(--dd-text-muted)] disabled:cursor-wait disabled:opacity-70"
            aria-label="Message DawnDesk AI"
            disabled={isGenerating}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              toolCount > 0
                ? `Message DawnDesk AI with ${toolCount} plugin tool${toolCount === 1 ? '' : 's'}...`
                : 'Message DawnDesk AI...'
            }
            value={draft}
          />
          <div className="mt-[var(--dd-space-2)] flex items-center gap-[var(--dd-space-1)]">
            <button
              className={iconButton}
              type="button"
              aria-label="Attach files"
              onClick={() => fileInputRef.current?.click()}
            >
              <Link size={18} aria-hidden="true" />
            </button>
            <button className={iconButton} type="button" aria-label="Add emoji">
              <Smile size={18} aria-hidden="true" />
            </button>
            <button className={iconButton} type="button" aria-label="Add code">
              <Code2 size={18} aria-hidden="true" />
            </button>
            <button className={iconButton} type="button" aria-label="Attach image">
              <FileImage size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <button
          className="grid size-[54px] place-items-center rounded-[var(--dd-radius-md)] border border-[var(--dd-accent)] bg-[var(--dd-accent)] text-[var(--dd-accent-contrast)] shadow-[0_14px_30px_rgba(250,204,21,0.2)] transition-[background,transform] hover:-translate-y-px hover:bg-[var(--dd-accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isGenerating}
          type="submit"
          aria-label={isGenerating ? 'Sending message' : 'Send message'}
        >
          <Send size={22} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
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

  const blocks = parseMessageBlocks(content)

  return (
    <div className="[&>*+*]:mt-[var(--dd-space-3)]">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return <CodeBlock block={block} key={index} />
        }

        if (block.type === 'list') {
          return (
            <ul className="m-0 grid gap-[var(--dd-space-2)] pl-[var(--dd-space-5)]" key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          )
        }

        return (
          <p className="m-0" key={index}>
            {renderInlineMarkdown(block.content)}
          </p>
        )
      })}
      {isStreaming ? (
        <span
          className="ml-[var(--dd-space-1)] inline-block h-[1.05em] w-[7px] rounded-full bg-[var(--dd-accent)] align-[-0.15em] animate-[cursorBlink_860ms_steps(2,start)_infinite]"
          aria-hidden="true"
        />
      ) : null}
    </div>
  )
}

type MessageBlock =
  | { type: 'code'; language: string; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; content: string }

function parseMessageBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = []
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  let paragraph: string[] = []
  let listItems: string[] = []
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
      blocks.push({ type: 'list', items: listItems })
      listItems = []
    }
  }

  function flushCode() {
    blocks.push({ type: 'code', language: codeLanguage || 'text', content: codeLines.join('\n') })
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
      continue
    }

    if (trimmed.startsWith('```')) {
      flushParagraph()
      flushList()
      codeLanguage = trimmed.slice(3).trim() || 'text'
      continue
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      flushParagraph()
      listItems.push(bullet[1])
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()
  if (codeLanguage || codeLines.length > 0) flushCode()

  return blocks.length > 0 ? blocks : [{ type: 'paragraph', content }]
}

function CodeBlock({ block }: { block: Extract<MessageBlock, { type: 'code' }> }) {
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
    <figure className="m-0 overflow-hidden rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.18)] bg-[#02080c] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
      <figcaption className="flex min-h-11 items-center justify-between gap-[var(--dd-space-3)] border-b border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.035)] px-[var(--dd-space-4)] text-[0.9rem] text-[var(--dd-text-secondary)]">
        <span>{block.language}</span>
        <button
          className="inline-flex items-center gap-[var(--dd-space-2)] text-[0.9rem] text-[var(--dd-text-primary)] transition-colors hover:text-[var(--dd-accent)]"
          type="button"
          onClick={copyCode}
        >
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="m-0 max-h-[360px] overflow-auto p-[var(--dd-space-5)] text-[0.92rem] leading-8 text-[var(--dd-text-secondary)]">
        <code className="font-[var(--dd-font-mono)]">{block.content}</code>
      </pre>
    </figure>
  )
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong className="text-[var(--dd-text-primary)]" key={index}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          className="rounded-[var(--dd-radius-sm)] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.04)] px-[var(--dd-space-1)] font-[var(--dd-font-mono)] text-[var(--dd-text-primary)]"
          key={index}
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    return <span key={index}>{part}</span>
  })
}

function buildHistory(savedChats: SavedChat[]): HistoryItem[] {
  return savedChats.map((chat) => ({
    chat,
    group: groupSavedChat(chat.updatedAt),
    id: chat.id,
    time: formatHistoryTime(chat.updatedAt),
    title: chat.title,
  }))
}

function groupHistory(items: HistoryItem[]) {
  const order = ['Today', 'Yesterday', 'Previous 7 Days']

  return order
    .map((name) => ({
      items: items.filter((item) => item.group === name),
      name,
    }))
    .filter((group) => group.items.length > 0)
}

function groupSavedChat(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Previous 7 Days'

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const timestamp = date.getTime()
  const day = 24 * 60 * 60 * 1000

  if (timestamp >= startOfToday) return 'Today'
  if (timestamp >= startOfToday - day) return 'Yesterday'
  return 'Previous 7 Days'
}

function formatHistoryTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}
