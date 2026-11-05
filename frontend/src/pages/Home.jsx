import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'

export default function Home() {
  const navigate = useNavigate()
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

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
        <div className="user-card">
          <div className="user-avatar lg" aria-hidden="true">
            {(user.name || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="eyebrow">Signed in</p>
            <h1>
              {greeting}, {firstName}
            </h1>
            <p className="home-sub">{user.email}</p>
          </div>
        </div>

        <div className="home-actions">
          <button type="button" className="action-chip" onClick={() => navigate('/orders')}>
            View orders
          </button>
          <button type="button" className="action-chip" onClick={() => navigate('/orders')}>
            Create order
          </button>
        </div>

        <div className="home-grid">
          <article className="glass-card info-card">
            <h3>Orders</h3>
            <p>List, filter, update status, and delete your own orders.</p>
          </article>
          <article className="glass-card info-card">
            <h3>Account</h3>
            <p>You are logged in with JWT authentication for protected APIs.</p>
          </article>
        </div>
      </section>
    </AppLayout>
  )
}
