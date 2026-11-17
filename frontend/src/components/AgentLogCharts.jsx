import { useMemo, useState } from 'react'

const EVENT_COLORS = {
  support: '#b4441f',
  tool_call: '#175cd3',
  tool_result: '#5c6678',
  manager: '#9a6700',
  risk: '#b42318',
  final: '#067647',
}

export function AgentStatCards({ summary, activeEvent, onSelectEvent }) {
  const cards = [
    {
      key: null,
      label: 'All events',
      value: summary.log_count,
      tone: 'violet',
      hint: 'Every agent step',
    },
    {
      key: 'tool_call',
      label: 'Tool calls',
      value: summary.tool_call_count,
      tone: 'pink',
      hint: 'Tools the agent chose',
    },
    {
      key: 'tool_result',
      label: 'Tool results',
      value: summary.tool_result_count,
      tone: 'amber',
      hint: 'Data tools returned',
    },
    {
      key: 'final',
      label: 'Final replies',
      value: summary.final_count,
      tone: 'green',
      hint: 'Answers sent to you',
    },
  ]

  return (
    <div className="stat-grid">
      {cards.map((card) => {
        const selected =
          card.key === null
            ? !activeEvent
            : activeEvent === card.key
        return (
          <button
            key={card.label}
            type="button"
            className={`stat-card tone-${card.tone} clickable ${selected ? 'selected' : ''}`}
            onClick={() => onSelectEvent(card.key)}
          >
            <small>{card.label}</small>
            <strong>{card.value}</strong>
            <span className="stat-hint">{card.hint}</span>
          </button>
        )
      })}
    </div>
  )
}

export function EventDonut({ data, activeEvent, onSelectEvent }) {
  const [hover, setHover] = useState(null)
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1

  const slices = useMemo(() => {
    let offset = 0
    return data.map((item) => {
      const portion = (item.value / total) * 100
      const slice = {
        ...item,
        portion,
        offset,
        color: EVENT_COLORS[item.key] || 'var(--accent)',
      }
      offset += portion
      return slice
    })
  }, [data, total])

  const gradient = slices
    .map(
      (slice) =>
        `${slice.color} ${slice.offset}% ${slice.offset + slice.portion}%`,
    )
    .join(', ')

  const focus = hover || slices.find((slice) => slice.key === activeEvent)
  const shownTotal = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-head">
        <h3>Event mix</h3>
        <small>Tap a type to filter the feed</small>
      </div>
      <div className="donut-wrap">
        <div
          className="donut"
          style={{ background: `conic-gradient(${gradient || 'var(--line)'})` }}
        >
          <div className="donut-hole">
            <strong>{focus ? focus.value : shownTotal}</strong>
            <small>{focus ? focus.label : 'All events'}</small>
          </div>
        </div>
        <ul className="chart-legend">
          {slices.map((slice) => (
            <li key={slice.key}>
              <button
                type="button"
                className={`legend-btn ${activeEvent === slice.key ? 'active' : ''}`}
                onMouseEnter={() => setHover(slice)}
                onFocus={() => setHover(slice)}
                onMouseLeave={() => setHover(null)}
                onClick={() =>
                  onSelectEvent(
                    activeEvent === slice.key ? null : slice.key,
                  )
                }
              >
                <span className="event-swatch" style={{ background: slice.color }} />
                <span className="legend-label">{slice.label}</span>
                <span>{slice.value}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ActivityBars({ data, activeDate, onSelectDate }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...data.map((item) => item.value), 1)
  const focus =
    hover || data.find((item) => item.date === activeDate) || null

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-head">
        <h3>Activity this week</h3>
        <small>
          {focus
            ? `${focus.label}: ${focus.value} event${focus.value === 1 ? '' : 's'}`
            : 'Tap a day to filter'}
        </small>
      </div>
      <div className="bar-chart">
        {data.map((item) => {
          const height = `${Math.max((item.value / max) * 100, item.value ? 8 : 2)}%`
          return (
            <button
              key={item.date}
              type="button"
              className={`bar-col ${activeDate === item.date ? 'active' : ''}`}
              onMouseEnter={() => setHover(item)}
              onFocus={() => setHover(item)}
              onMouseLeave={() => setHover(null)}
              onClick={() =>
                onSelectDate(activeDate === item.date ? null : item.date)
              }
              aria-label={`${item.label}: ${item.value} events`}
            >
              <span className="bar-fill" style={{ height }} />
              <small>{item.label}</small>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ToolBars({ data }) {
  const [active, setActive] = useState(null)
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-head">
        <h3>Tools the agent used</h3>
        <small>
          {active
            ? `${active.label}: ${active.value} call${active.value === 1 ? '' : 's'}`
            : data.length
              ? 'Hover a bar for detail'
              : 'No tool calls yet'}
        </small>
      </div>
      {data.length ? (
        <div className="h-bar-chart">
          {data.map((item) => {
            const width = `${Math.max((item.value / max) * 100, 6)}%`
            return (
              <button
                key={item.key}
                type="button"
                className={`h-bar-row ${active?.key === item.key ? 'active' : ''}`}
                onMouseEnter={() => setActive(item)}
                onFocus={() => setActive(item)}
                onMouseLeave={() => setActive(null)}
              >
                <span className="h-bar-label">{item.label}</span>
                <span className="h-bar-track">
                  <span className="h-bar-fill" style={{ width }} />
                </span>
                <span className="h-bar-value">{item.value}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="home-sub">Chat with support on an order to see tool usage.</p>
      )}
    </div>
  )
}

export function ConversationBars({ data, activeConversation, onSelectConversation }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...data.map((item) => item.value), 1)
  const focus =
    hover ||
    data.find(
      (item) => String(item.conversation_id) === String(activeConversation),
    )

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-head">
        <h3>Busy conversations</h3>
        <small>
          {focus
            ? `${focus.label}: ${focus.value} log${focus.value === 1 ? '' : 's'}`
            : 'Tap a chat to filter'}
        </small>
      </div>
      {data.length ? (
        <div className="h-bar-chart">
          {data.map((item) => {
            const width = `${Math.max((item.value / max) * 100, 6)}%`
            const selected =
              String(activeConversation) === String(item.conversation_id)
            return (
              <button
                key={item.key}
                type="button"
                className={`h-bar-row ${selected ? 'active' : ''}`}
                onMouseEnter={() => setHover(item)}
                onFocus={() => setHover(item)}
                onMouseLeave={() => setHover(null)}
                onClick={() =>
                  onSelectConversation(
                    selected ? null : item.conversation_id,
                  )
                }
              >
                <span className="h-bar-label">
                  {item.label}
                  {item.order_id ? ` · order #${item.order_id}` : ''}
                </span>
                <span className="h-bar-track">
                  <span className="h-bar-fill" style={{ width }} />
                </span>
                <span className="h-bar-value">{item.value}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="home-sub">No logged conversations yet.</p>
      )}
    </div>
  )
}

export function AgentLogFeed({ logs, filters }) {
  return (
    <div className="glass-card agent-log-feed-card">
      <div className="chart-card-head">
        <h3>Live story feed</h3>
        <small>
          Showing {logs.length}
          {filters.event_type || filters.date || filters.conversation_id
            ? ' filtered'
            : ''}{' '}
          events
        </small>
      </div>
      <div className="agent-log-feed">
        {logs.length ? (
          logs.map((log) => (
            <article
              key={log.id}
              className={`agent-log-row event-${log.event_type}`}
            >
              <div className="agent-log-meta">
                <span
                  className="event-pill"
                  style={{
                    background: `${EVENT_COLORS[log.event_type] || 'var(--accent)'}22`,
                    color: EVENT_COLORS[log.event_type] || 'var(--accent)',
                  }}
                >
                  {log.event_label}
                </span>
                <small>
                  {new Date(log.created_at).toLocaleString()}
                  {log.order_id ? ` · order #${log.order_id}` : ''}
                </small>
              </div>
              <p>{log.content}</p>
            </article>
          ))
        ) : (
          <p className="home-sub">
            No agent logs match these filters yet. Ask support on an order and
            refresh.
          </p>
        )}
      </div>
    </div>
  )
}
