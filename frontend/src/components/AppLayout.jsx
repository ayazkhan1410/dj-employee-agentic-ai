import ChatSupport from './ChatSupport'
import Footer from './Footer'
import Header from './Header'
import SupportBackdrop from './SupportBackdrop'

export default function AppLayout({
  children,
  user,
  onLogout,
  showGlobalChat = true,
}) {
  return (
    <div className="site-frame">
      <SupportBackdrop disabled={!showGlobalChat} />
      <Header user={user} onLogout={onLogout} />
      <main className="site-main">
        <div className="site-panel">{children}</div>
      </main>
      <Footer />
      {showGlobalChat ? <ChatSupport /> : null}
    </div>
  )
}
