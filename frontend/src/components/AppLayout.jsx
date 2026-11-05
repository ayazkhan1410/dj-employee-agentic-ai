import ChatSupport from './ChatSupport'
import Footer from './Footer'
import Header from './Header'

export default function AppLayout({ children, user, onLogout }) {
  return (
    <div className="site-frame">
      <div className="glow glow-a" aria-hidden="true" />
      <div className="glow glow-b" aria-hidden="true" />
      <Header user={user} onLogout={onLogout} />
      <main className="site-main">
        <div className="site-panel">{children}</div>
      </main>
      <Footer />
      <ChatSupport />
    </div>
  )
}
