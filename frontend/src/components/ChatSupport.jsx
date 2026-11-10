import { useEffect, useRef, useState } from 'react'
import {
  getChatSupport,
  getOrderChatSupport,
  sendChatSupport,
  sendOrderChatSupport,
} from '../api'
import AgentLogo from './AgentLogo'

function welcomeMessage(orderId) {
  if (orderId) {
    return {
      from: 'agent',
      text: `Hi, I can help with order #${orderId} — tracking, status, or refunds.`,
    }
  }
  return {
    from: 'agent',
    text: 'Hi, I am your AI Employee support agent. Ask about orders, tracking, or refunds.',
  }
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
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState(() => [welcomeMessage(orderId)])
  const endRef = useRef(null)

  function setOpen(next) {
    const value = typeof next === 'function' ? next(open) : next
    if (onOpenChange) onOpenChange(value)
    if (openProp === undefined) setInternalOpen(value)
  }

  useEffect(() => {
    setMessages([welcomeMessage(orderId)])
    setError('')
    setMessage('')
  }, [orderId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  useEffect(() => {
    if (!open) return undefined

    let active = true
    const loader = orderId ? getOrderChatSupport(orderId) : getChatSupport()
    loader
      .then((data) => {
        if (!active) return
        const history = data.messages || data.history
        if (Array.isArray(history) && history.length) {
          setMessages(
            history.map((item) => ({
              from: item.role === 'user' || item.from === 'user' ? 'user' : 'agent',
              text: item.content || item.text || item.message || '',
            })),
          )
        }
      })
      .catch(() => {
        // Keep local welcome if history endpoint is still a stub.
      })

    return () => {
      active = false
    }
  }, [open, orderId])

  async function sendMessage(event) {
    event.preventDefault()
    const text = message.trim()
    if (!text || typing) return

    setError('')
    setMessages((prev) => [...prev, { from: 'user', text }])
    setMessage('')
    setTyping(true)

    try {
      const data = orderId
        ? await sendOrderChatSupport(orderId, { message: text })
        : await sendChatSupport({ message: text })
      setMessages((prev) => [
        ...prev,
        { from: 'agent', text: agentTextFromResponse(data) },
      ])
    } catch (err) {
      setError(err.message || 'Could not send message.')
      setMessages((prev) => [
        ...prev,
        {
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
              {orderId ? 'This order only' : 'Orders · tracking · refunds'}
            </small>
          </div>
        </div>
        <button type="button" className="ghost-btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((item, index) => (
          <div
            key={`${item.from}-${index}`}
            className={`chat-row ${item.from === 'user' ? 'user' : 'agent'}`}
          >
            {item.from === 'agent' ? <AgentLogo size="xs" /> : null}
            <div className={`chat-bubble ${item.from === 'user' ? 'user' : 'agent'}`}>
              {item.text}
            </div>
          </div>
        ))}
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
          disabled={typing}
        />
        <button type="submit" className="btn-space" disabled={typing || !message.trim()}>
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
        aria-label="Open chat support"
      >
        <AgentLogo size="sm" pulse={!open} />
        {open ? 'Hide' : 'Chat'}
      </button>
    </div>
  )
}
