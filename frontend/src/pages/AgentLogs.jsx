import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAgentLogsDashboard } from '../api'
import AppLayout from '../components/AppLayout'
import {
  ActivityBars,
  AgentLogFeed,
  AgentStatCards,
  ConversationBars,
  EventDonut,
  ToolBars,
} from '../components/AgentLogCharts'

export default function AgentLogs() {
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
  const [eventType, setEventType] = useState(null)
  const [date, setDate] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  const loadDashboard = useCallback(() => {
    if (!user) return Promise.resolve()

    setLoading(true)
    return getAgentLogsDashboard({
      event_type: eventType || undefined,
      date: date || undefined,
      conversation_id: conversationId || undefined,
    })
      .then((data) => {
        setDashboard(data)
        setError('')
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user, eventType, date, conversationId])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (!user || !autoRefresh) return undefined
    const timer = window.setInterval(() => {
      loadDashboard()
    }, 12000)
    return () => window.clearInterval(timer)
  }, [user, autoRefresh, loadDashboard])

  if (!user) return null

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    navigate('/login')
  }

  function clearFilters() {
    setEventType(null)
    setDate(null)
    setConversationId(null)
  }

  const hasFilters = Boolean(eventType || date || conversationId)

  return (
    <AppLayout
      user={user}
      onLogout={logout}
      title="What the support agent"
      accent="is doing"
      sub="Each request: your message, the tools it chose, the results, and the reply."
    >
      <section className="home-hero">
        <div className="dash-hero">
          <div className="home-actions">
            <button
              type="button"
              className={`action-chip ${autoRefresh ? 'primary' : ''}`}
              onClick={() => setAutoRefresh((value) => !value)}
            >
              {autoRefresh ? 'Live refresh on' : 'Live refresh off'}
            </button>
            <button
              type="button"
              className="action-chip"
              onClick={() => loadDashboard()}
            >
              Refresh now
            </button>
            {hasFilters ? (
              <button
                type="button"
                className="action-chip"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {loading && !dashboard ? (
          <p className="home-sub">Loading agent activity…</p>
        ) : null}
        {error ? <p className="auth-error">{error}</p> : null}

        {dashboard ? (
          <>
            <AgentStatCards
              summary={dashboard.summary}
              activeEvent={eventType}
              onSelectEvent={setEventType}
            />

            <div className="chart-grid">
              <EventDonut
                data={dashboard.charts.events}
                activeEvent={eventType}
                onSelectEvent={setEventType}
              />
              <ActivityBars
                data={dashboard.charts.volume}
                activeDate={date}
                onSelectDate={setDate}
              />
              <ToolBars data={dashboard.charts.tools} />
              <ConversationBars
                data={dashboard.charts.conversations}
                activeConversation={conversationId}
                onSelectConversation={setConversationId}
              />
            </div>

            <AgentLogFeed
              logs={dashboard.recent_logs}
              filters={dashboard.filters}
            />
          </>
        ) : null}
      </section>
    </AppLayout>
  )
}
