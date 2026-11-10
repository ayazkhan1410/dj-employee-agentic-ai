import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboard } from '../api'
import AppLayout from '../components/AppLayout'
import {
  NextSteps,
  StatCards,
  StatusDonut,
  VolumeBars,
} from '../components/DashboardCharts'
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

  const firstName = (user.name || 'there').split(' ')[0]
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <AppLayout user={user} onLogout={logout}>
      <section className="home-hero">
        <div className="dash-hero">
          <div>
            <p className="eyebrow">My home</p>
            <h1>
              {greeting}, {firstName}
            </h1>
            <p className="home-sub">
              Here’s a quick look at your orders and what needs attention.
            </p>
          </div>
          <div className="home-actions">
            <button
              type="button"
              className="action-chip primary"
              onClick={() => navigate('/orders')}
            >
              My orders
            </button>
            <button
              type="button"
              className="action-chip"
              onClick={() => navigate('/orders')}
            >
              Place an order
            </button>
          </div>
        </div>

        {loading ? <p className="home-sub">Loading your overview…</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        {dashboard ? (
          <>
            <StatCards summary={dashboard.summary} />

            <div className="chart-grid">
              <StatusDonut data={dashboard.charts.status} />
              <VolumeBars data={dashboard.charts.volume} />
              <NextSteps summary={dashboard.summary} />
            </div>

            <div className="glass-card recent-card">
              <div className="chart-card-head">
                <h3>Your recent orders</h3>
                <Link to="/orders">See all</Link>
              </div>
              <div className="recent-list">
                {dashboard.recent_orders.length ? (
                  dashboard.recent_orders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="recent-row"
                    >
                      <div>
                        <strong>Order #{order.id}</strong>
                        <small>
                          {order.carrier_display || 'Carrier pending'} · $
                          {order.total_amount}
                        </small>
                      </div>
                      <StatusBadge status={order.status} />
                    </Link>
                  ))
                ) : (
                  <p className="home-sub">
                    You have no orders yet. Place one to get started.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </AppLayout>
  )
}
