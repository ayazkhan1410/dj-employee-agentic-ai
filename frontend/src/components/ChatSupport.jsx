import { useEffect, useRef, useState } from 'react'
import { getChatSupport, sendChatSupport } from '../api'
import AgentLogo from './AgentLogo'

const WELCOME = {
  from: 'agent',
  text: 'Hi, I am your AI Employee support agent. Ask about orders, tracking, or refunds.',
}

function agentTextFromResponse(data) {
  if (!data) return 'No reply received.'
  if (typeof data.message === 'string') return data.message
  if (typeof data.reply === 'string') return data.reply
  if (typeof data.content === 'string') return data.content
  if (typeof data.text === 'string') return data.text
  return 'Got a response, but could not read the message.'
}

export default function ChatSupport() {
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([WELCOME])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  useEffect(() => {
    if (!open || !conversationId) return undefined

    let active = true
    getChatSupport(conversationId)
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
        // Keep local messages if history endpoint is still a stub.
      })

    return () => {
      active = false
    }
  }, [open, conversationId])

  async function sendMessage(event) {
    event.preventDefault()
    const text = message.trim()
    if (!text || typing) return

    setError('')
    setMessages((prev) => [...prev, { from: 'user', text }])
    setMessage('')
    setTyping(true)

    try {
      const data = await sendChatSupport({
        message: text,
        conversationId,
      })
      const nextId = data.conversation_id || data.id || conversationId
      if (nextId && nextId !== conversationId) {
        setConversationId(nextId)
      }
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

  return (
    <div className="chat-support">
      {open ? (
        <div className="chat-panel" role="dialog" aria-label="Chat support">
          <div className="chat-panel-header">
            <div className="chat-agent-identity">
              <AgentLogo size="sm" pulse />
              <div>
                <strong>AI Employee Support</strong>
                <small>Online</small>
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
              placeholder="Ask about an order..."
              aria-label="Chat message"
              disabled={typing}
            />
            <button type="submit" className="btn-space" disabled={typing || !message.trim()}>
              Send
            </button>
          </form>
        </div>
      ) : null}

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
