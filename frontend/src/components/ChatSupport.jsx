import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getOrderChatSupport,
  sendChatSupport,
  sendOrderChatSupport,
} from '../api'
import AgentLogo from './AgentLogo'

function welcomeMessage(orderId) {
  if (orderId) {
    return {
      id: 'welcome',
      from: 'agent',
      text: `Hi, I can help with order #${orderId} — tracking, status, or refunds.`,
    }
  }
  return {
    id: 'welcome',
    from: 'agent',
    text: 'Hi, I am your AI Employee support agent. Ask about orders, tracking, or refunds.',
  }
}

function mapHistoryMessages(history, orderId) {
  if (!Array.isArray(history) || !history.length) {
    return [welcomeMessage(orderId)]
  }

  const sorted = [...history].sort((a, b) => {
    const left = a.created_at || ''
    const right = b.created_at || ''
    if (left === right) return (a.id || 0) - (b.id || 0)
    return left.localeCompare(right)
  })

  return sorted
    .map((item) => ({
      id: item.id ?? `${item.role}-${item.created_at}`,
      from: item.role === 'user' || item.from === 'user' ? 'user' : 'agent',
      text: item.content || item.text || item.message || '',
      created_at: item.created_at || null,
    }))
    .filter((item) => item.text)
}

function agentTextFromResponse(data) {
  if (!data) return 'No reply received.'
  if (typeof data.message === 'string') return data.message
  if (typeof data.reply === 'string') return data.reply
  if (typeof data.content === 'string') return data.content
  if (typeof data.text === 'string') return data.text
  return 'Got a response, but could not read the message.'
}

export default function ChatSupport({
  orderId = null,
  variant = 'floating',
  open: openProp,
  onOpenChange,
}) {
  const isInline = variant === 'inline'
  const [internalOpen, setInternalOpen] = useState(Boolean(isInline && openProp))
  const open = openProp !== undefined ? openProp : internalOpen
  const [typing, setTyping] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState(() => [welcomeMessage(orderId)])
  const endRef = useRef(null)

  function setOpen(next) {
    const value = typeof next === 'function' ? next(open) : next
    if (onOpenChange) onOpenChange(value)
    if (openProp === undefined) setInternalOpen(value)
  }

  const loadHistory = useCallback(async () => {
    if (!orderId) {
      setMessages([welcomeMessage(null)])
      setConversationId(null)
      return
    }

    setLoadingHistory(true)
    setError('')
    try {
      const data = await getOrderChatSupport(orderId)
      setConversationId(data.conversation_id ?? null)
      setMessages(mapHistoryMessages(data.messages || data.history, orderId))
    } catch (err) {
      setMessages([welcomeMessage(orderId)])
      setError(err.message || 'Could not load previous chat.')
    } finally {
      setLoadingHistory(false)
    }
  }, [orderId])

  useEffect(() => {
    setMessages([welcomeMessage(orderId)])
    setConversationId(null)
    setError('')
    setMessage('')
  }, [orderId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open, loadingHistory])

  useEffect(() => {
    if (!open) return undefined
    loadHistory()
    return undefined
  }, [open, loadHistory])

  async function sendMessage(event) {
    event.preventDefault()
    const text = message.trim()
    if (!text || typing || loadingHistory) return

    const tempId = `local-${Date.now()}`
    setError('')
    setMessages((prev) => [...prev, { id: tempId, from: 'user', text }])
    setMessage('')
    setTyping(true)

    try {
      const data = orderId
        ? await sendOrderChatSupport(orderId, { message: text })
        : await sendChatSupport({ message: text })

      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          from: 'agent',
          text: agentTextFromResponse(data),
        },
      ])
    } catch (err) {
      setError(err.message || 'Could not send message.')
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          from: 'agent',
          text: 'Sorry, I could not reach support right now. Please try again.',
        },
      ])
    } finally {
      setTyping(false)
    }
  }

  const panel = open ? (
    <div
      className={`chat-panel ${isInline ? 'inline' : ''}`}
      role="dialog"
      aria-label={orderId ? `Chat support for order ${orderId}` : 'Chat support'}
    >
      <div className="chat-panel-header">
        <div className="chat-agent-identity">
          <AgentLogo size="sm" pulse />
          <div>
            <strong>{orderId ? `Order #${orderId} support` : 'AI Support Agent'}</strong>
            <small>
              {loadingHistory
                ? 'Loading previous chat…'
                : conversationId
                  ? 'Previous conversation restored'
                  : orderId
                    ? 'This order only'
                    : 'Orders · tracking · refunds'}
            </small>
          </div>
        </div>
        <button type="button" className="ghost-btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <div className="chat-messages">
        {loadingHistory ? (
          <div className="chat-row agent">
            <AgentLogo size="xs" pulse />
            <div className="chat-bubble agent typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : (
          messages.map((item) => (
            <div
              key={item.id}
              className={`chat-row ${item.from === 'user' ? 'user' : 'agent'}`}
            >
              {item.from === 'agent' ? <AgentLogo size="xs" /> : null}
              <div className={`chat-bubble ${item.from === 'user' ? 'user' : 'agent'}`}>
                {item.text}
              </div>
            </div>
          ))
        )}
        {typing ? (
          <div className="chat-row agent">
            <AgentLogo size="xs" pulse />
            <div className="chat-bubble agent typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {error ? <p className="auth-error chat-error">{error}</p> : null}

      <form className="chat-compose" onSubmit={sendMessage}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={orderId ? `Ask about order #${orderId}...` : 'Ask about an order...'}
          aria-label="Chat message"
          disabled={typing || loadingHistory}
        />
        <button
          type="submit"
          className="btn-space"
          disabled={typing || loadingHistory || !message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  ) : null

  if (isInline) {
    return open ? <div className="chat-support inline">{panel}</div> : null
  }

  return (
    <div className="chat-support">
      {panel}
      <button
        type="button"
        className={`chat-launcher ${open ? 'open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Hide chat support' : 'Open chat support'}
      >
        <AgentLogo size="sm" pulse={!open} />
      </button>
    </div>
  )
}
