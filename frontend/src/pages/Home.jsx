import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboard } from '../api'
import AppLayout from '../components/AppLayout'
import StatusBadge from '../components/StatusBadge'

export default function Home() {
  const navigate = useNavigate()
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (!user) return

    let active = true
    setLoading(true)
    getDashboard()
      .then((data) => {
        if (active) setDashboard(data)
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
  }, [user])

  if (!user) return null

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const summary = dashboard?.summary
  const recent = dashboard?.recent_orders || []
  const active = recent.filter((o) =>
    ['pending', 'processing', 'shipped'].includes(o.status),
  )
  const earlier = recent.filter((o) => !active.includes(o))
  const inTransit = summary?.shipped_count ?? 0
  const firstName = (user.name || '').split(' ')[0]
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <AppLayout
      user={user}
      onLogout={logout}
      title={
        summary
          ? `${summary.order_count} ${summary.order_count === 1 ? 'order' : 'orders'},`
          : `Hi ${firstName},`
      }
      accent={summary ? `${inTransit} on the way` : 'one moment'}
      sub={`${today}${firstName ? ` · ${firstName}'s account` : ''}`}
    >
      <section className="page">
        {loading ? <p className="muted">Loading…</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        {summary && recent.length === 0 ? (
          <p className="muted">You have no orders yet.</p>
        ) : null}

        {active.length ? (
          <div className="sheet-card">
            {active.map((order) => (
              <div className="order-line" key={order.id}>
                <span className="leaf">#{order.id}</span>
                <div className="order-line-text">
                  <strong>${order.total_amount}</strong>
                  <small>{order.carrier_display || 'Carrier pending'}</small>
                </div>
                <StatusBadge status={order.status} />
                <Link to={`/orders/${order.id}`} className="pill-btn">
                  Open
                </Link>
              </div>
            ))}
          </div>
        ) : null}

        {earlier.length ? (
          <>
            <div className="section-head">
              <h2>Earlier</h2>
              <Link to="/orders">All orders</Link>
            </div>
            <ul className="quiet-list">
              {earlier.map((order) => (
                <li key={order.id}>
                  <span className="leaf quiet">#{order.id}</span>
                  <Link to={`/orders/${order.id}`}>
                    {order.carrier_display || 'Order'} · ${order.total_amount}
                  </Link>
                  <StatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </AppLayout>
  )
}
