import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrder, patchOrder } from '../api'
import AgentLogo from '../components/AgentLogo'
import AppLayout from '../components/AppLayout'
import StatusBadge from '../components/StatusBadge'
import StatusSelect from '../components/StatusSelect'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentInput, setAgentInput] = useState('')
  const [agentMessages, setAgentMessages] = useState([])
  const [agentBusy, setAgentBusy] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (!user || !id) return

    let active = true
    setLoading(true)
    getOrder(id)
      .then((data) => {
        if (active) setOrder(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, id])

  if (!user) return null

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    navigate('/login')
  }

  async function handleStatusChange(nextStatus) {
    try {
      const updated = await patchOrder(id, { status: nextStatus })
      setOrder(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  function askAgent(event) {
    event.preventDefault()
    const text = agentInput.trim()
    if (!text || agentBusy) return

    setAgentMessages((prev) => [...prev, { from: 'user', text }])
    setAgentInput('')
    setAgentBusy(true)

    window.setTimeout(() => {
      setAgentMessages((prev) => [
        ...prev,
        {
          from: 'agent',
          text: `Got it for order #${id}. Agent help is not connected yet — soon I can explain status, tracking, and refunds.`,
        },
      ])
      setAgentBusy(false)
    }, 650)
  }

  return (
    <AppLayout user={user} onLogout={logout}>
      <section className="orders-panel">
        <div className="detail-top">
          <Link to="/orders" className="ghost-btn">
            ← Back to orders
          </Link>
          <button
            type="button"
            className={`agent-help-btn ${agentOpen ? 'active' : ''}`}
            onClick={() => setAgentOpen((value) => !value)}
          >
            <AgentLogo size="sm" pulse={!agentOpen} />
            {agentOpen ? 'Hide Agent' : 'Ask AI Agent'}
          </button>
        </div>

        {loading ? <p className="home-sub">Loading order…</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        {order ? (
          <article className="glass-card order-detail-card">
            <div className="orders-hero">
              <div>
                <p className="eyebrow">Order detail</p>
                <h1>Order #{order.id}</h1>
                <div className="detail-status-row">
                  <StatusBadge status={order.status} />
                  <span className="home-sub">${order.total_amount}</span>
                </div>
              </div>
              <StatusSelect value={order.status} onChange={handleStatusChange} />
            </div>

            <div className="detail-grid">
              <div>
                <small>Carrier</small>
                <strong>{order.carrier_display || '—'}</strong>
              </div>
              <div>
                <small>Tracking</small>
                <strong>{order.tracking_number || '—'}</strong>
              </div>
              <div>
                <small>Phone</small>
                <strong>{order.customer_phone || '—'}</strong>
              </div>
              <div>
                <small>Created</small>
                <strong>{new Date(order.created_at).toLocaleString()}</strong>
              </div>
              <div className="full">
                <small>Shipping address</small>
                <strong>{order.shipping_address || '—'}</strong>
              </div>
            </div>

            {order.items?.length ? (
              <div className="detail-items">
                <h3>Items</h3>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product_name || `Product #${item.product}`} · qty{' '}
                      {item.quantity} · ${item.price}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="home-sub">No line items on this order.</p>
            )}
          </article>
        ) : null}

        {agentOpen ? (
          <aside className="glass-card agent-helper">
            <div className="agent-helper-head">
              <AgentLogo
                size="md"
                pulse
                interactive
                onClick={() =>
                  setAgentMessages((prev) => [
                    ...prev,
                    {
                      from: 'agent',
                      text: 'Ready when you are. Ask about tracking, status, or refunds for this order.',
                    },
                  ])
                }
                label="Activate order agent"
              />
              <div>
                <strong>Order Agent</strong>
                <small>Interactive helper · coming soon</small>
              </div>
            </div>

            <div className="agent-quick-actions">
              <button
                type="button"
                className="action-chip"
                onClick={() => setAgentInput('Where is my shipment?')}
              >
                📦 Tracking
              </button>
              <button
                type="button"
                className="action-chip"
                onClick={() => setAgentInput('Explain this order status')}
              >
                ℹ️ Status
              </button>
              <button
                type="button"
                className="action-chip"
                onClick={() => setAgentInput('Can I request a refund?')}
              >
                💸 Refund
              </button>
            </div>

            <div className="agent-thread">
              {agentMessages.length === 0 ? (
                <p className="home-sub">
                  Click the agent logo or a quick action to start. Backend replies will
                  be wired later.
                </p>
              ) : (
                agentMessages.map((item, index) => (
                  <div
                    key={`${item.from}-${index}`}
                    className={`chat-row ${item.from === 'user' ? 'user' : 'agent'}`}
                  >
                    {item.from === 'agent' ? <AgentLogo size="xs" /> : null}
                    <div className={`chat-bubble ${item.from}`}>
                      {item.text}
                    </div>
                  </div>
                ))
              )}
              {agentBusy ? (
                <div className="chat-row agent">
                  <AgentLogo size="xs" pulse />
                  <div className="chat-bubble agent typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}
            </div>

            <form onSubmit={askAgent} className="agent-helper-form">
              <input
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder={`Help with order #${id}...`}
                aria-label="Ask order agent"
              />
              <button type="submit" className="btn-space" disabled={agentBusy}>
                Ask
              </button>
            </form>
          </aside>
        ) : null}
      </section>
    </AppLayout>
  )
}
