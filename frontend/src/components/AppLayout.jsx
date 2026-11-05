import { useEffect, useRef } from 'react'
import ChatSupport from './ChatSupport'
import Footer from './Footer'
import Header from './Header'

export default function AppLayout({ children, user, onLogout }) {
  const frameRef = useRef(null)

  useEffect(() => {
    const node = frameRef.current
    if (!node) return undefined

    function onMove(event) {
      const x = (event.clientX / window.innerWidth) * 100
      const y = (event.clientY / window.innerHeight) * 100
      node.style.setProperty('--mx', `${x}%`)
      node.style.setProperty('--my', `${y}%`)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="site-frame" ref={frameRef}>
      <div className="glow glow-a" aria-hidden="true" />
      <div className="glow glow-b" aria-hidden="true" />
      <div className="glow glow-cursor" aria-hidden="true" />
      <Header user={user} onLogout={onLogout} />
      <main className="site-main">
        <div className="site-panel">{children}</div>
      </main>
      <Footer />
      <ChatSupport />
    </div>
  )
}
