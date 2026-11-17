import { Link, useLocation } from 'react-router-dom'
import useTheme from '../hooks/useTheme'

const LINKS = [
  ['/home', 'Today'],
  ['/orders', 'Orders'],
  ['/agent-logs', 'Agent logs'],
]

export default function Header({ user, onLogout }) {
  const { pathname } = useLocation()
  const { theme, setTheme } = useTheme()
  const isAuth = pathname === '/login' || pathname === '/signup'
  const links = isAuth
    ? [
        ['/login', 'Sign in'],
        ['/signup', 'Sign up'],
      ]
    : LINKS

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to={user ? '/home' : '/login'} className="site-brand">
          AI Employee
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {links.map(([to, label]) => (
            <Link key={to} to={to} className={pathname === to ? 'active' : ''}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="text-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          {user && onLogout ? (
            <>
              <span className="header-user">{user.name || user.email}</span>
              <button type="button" className="text-btn" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
