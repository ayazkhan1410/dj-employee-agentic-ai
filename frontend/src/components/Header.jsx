import { Link, useLocation } from 'react-router-dom'

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function Header({ user, onLogout }) {
  const { pathname } = useLocation()
  const isAuth = pathname === '/login' || pathname === '/signup'

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to={user ? '/home' : '/login'} className="site-brand">
          <span className="site-logo" aria-hidden="true">
            AI
          </span>
          <span>
            <strong>AI Employee</strong>
            <small>Order management assistant</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {isAuth ? (
            <>
              <Link to="/login" className={pathname === '/login' ? 'active' : ''}>
                Sign in
              </Link>
              <Link to="/signup" className={pathname === '/signup' ? 'active' : ''}>
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link to="/home" className={pathname === '/home' ? 'active' : ''}>
                Home
              </Link>
              <Link to="/orders" className={pathname === '/orders' ? 'active' : ''}>
                Orders
              </Link>
            </>
          )}
        </nav>

        {user ? (
          <div className="user-profile">
            <div className="user-avatar" aria-hidden="true">
              {initials(user.name)}
            </div>
            <div className="user-meta">
              <strong>{user.name || 'User'}</strong>
              <small>{user.email}</small>
            </div>
            {onLogout ? (
              <button type="button" className="ghost-btn" onClick={onLogout}>
                Log out
              </button>
            ) : null}
          </div>
        ) : (
          <div className="user-profile guest">
            <small>Guest session</small>
          </div>
        )}
      </div>
    </header>
  )
}
