import { useEffect, useRef, useState } from 'react'
import AgentLogo from './AgentLogo'

export default function ChatSupport() {
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      from: 'agent',
      text: 'Hi, I am your AI Employee support agent. Ask about orders, tracking, or refunds. Full chat will be connected soon.',
    },
  ])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  function sendMessage(event) {
    event.preventDefault()
    const text = message.trim()
    if (!text || typing) return

    setMessages((prev) => [...prev, { from: 'user', text }])
    setMessage('')
    setTyping(true)

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: 'agent',
          text: 'Thanks for your message. Agent replies will be available once chat support is implemented.',
        },
      ])
      setTyping(false)
    }, 700)
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
                <small>Online · coming soon</small>
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

          <form className="chat-compose" onSubmit={sendMessage}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about an order..."
              aria-label="Chat message"
            />
            <button type="submit" className="btn-space" disabled={typing}>
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
