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

  return (
    <AppLayout user={user} onLogout={logout}>
      <section className="orders-panel">
        <div className="detail-top">
          <Link to="/orders" className="ghost-btn">
            ← Back to orders
          </Link>
          <button
            type="button"
            className="action-chip primary ask-support-btn"
            onClick={() => document.querySelector('.chat-launcher')?.click()}
          >
            <AgentLogo size="xs" label="" />
            Ask support
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
      </section>
    </AppLayout>
  )
}
