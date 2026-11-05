import { useEffect, useRef, useState } from 'react'
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
  const [accountOpen, setAccountOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function onClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to={user ? '/home' : '/login'} className="site-brand">
          <span className="site-logo" aria-hidden="true">
            AI
          </span>
          <span>
            <strong>AI Employee</strong>
            <small>Your order assistant</small>
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
                My orders
              </Link>
            </>
          )}
        </nav>

        {user ? (
          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className={`account-trigger ${accountOpen ? 'open' : ''}`}
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              aria-haspopup="true"
            >
              <span className="user-avatar" aria-hidden="true">
                {initials(user.name)}
              </span>
              <span className="user-meta">
                <strong>{user.name || 'User'}</strong>
                <small>Account</small>
              </span>
              <span className="account-caret" aria-hidden="true">
                ▾
              </span>
            </button>

            {accountOpen ? (
              <div className="account-dropdown" role="menu">
                <div className="account-dropdown-head">
                  <span className="user-avatar lg" aria-hidden="true">
                    {initials(user.name)}
                  </span>
                  <div>
                    <strong>{user.name || 'User'}</strong>
                    <small>{user.email}</small>
                  </div>
                </div>
                <Link
                  to="/home"
                  role="menuitem"
                  onClick={() => setAccountOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/orders"
                  role="menuitem"
                  onClick={() => setAccountOpen(false)}
                >
                  My orders
                </Link>
                {onLogout ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="account-logout"
                    onClick={() => {
                      setAccountOpen(false)
                      onLogout()
                    }}
                  >
                    Log out
                  </button>
                ) : null}
              </div>
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
