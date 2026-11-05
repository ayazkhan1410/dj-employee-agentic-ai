import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <strong>AI Employee</strong>
          <p>Manage orders, tracking, and customer updates in one place.</p>
        </div>
        <div className="footer-links">
          <Link to="/home">Home</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/login">Sign in</Link>
          <a href="mailto:support@aiemployee.com">Support</a>
        </div>
        <p className="footer-copy">© {year} AI Employee. All rights reserved.</p>
      </div>
    </footer>
  )
}
