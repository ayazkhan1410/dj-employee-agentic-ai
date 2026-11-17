import ChatSupport from './ChatSupport'
import Footer from './Footer'
import Header from './Header'

export default function AppLayout({
  children,
  user,
  onLogout,
  title,
  accent,
  sub,
  showGlobalChat = false, // site-wide chat button is off for now
  orderChatId = null,
}) {
  return (
    <div className="site-frame">
      <div className="hero">
        <Header user={user} onLogout={onLogout} />
        <div className="hero-body">
          <h1>
            {title} {accent ? <span className="accent">{accent}</span> : null}
          </h1>
          {sub ? <p>{sub}</p> : null}
        </div>
      </div>
      <main className="site-main">
        <div className="site-panel">{children}</div>
      </main>
      <Footer />
      {orderChatId ? <ChatSupport orderId={orderChatId} /> : null}
      {!orderChatId && showGlobalChat ? <ChatSupport /> : null}
    </div>
  )
}
