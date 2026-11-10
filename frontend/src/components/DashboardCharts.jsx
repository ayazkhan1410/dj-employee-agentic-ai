import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'

const STATUS_COLORS = {
  pending: '#9a6700',
  processing: '#175cd3',
  shipped: '#7e22ce',
  delivered: '#067647',
  cancelled: '#b42318',
}

const USER_STATUS_COPY = {
  pending: 'Waiting to start',
  processing: 'Being prepared',
  shipped: 'On the way',
  delivered: 'Arrived',
  cancelled: 'Cancelled',
}

export function StatCards({ summary }) {
  const navigate = useNavigate()
  const cards = [
    {
      label: 'My orders',
      value: summary.order_count,
      tone: 'violet',
      hint: 'All purchases',
      to: '/orders',
    },
    {
      label: 'Needs attention',
      value: summary.pending_count + summary.processing_count,
      tone: 'amber',
      hint: 'Pending or processing',
      to: '/orders?status=pending',
    },
    {
      label: 'On the way',
      value: summary.shipped_count,
      tone: 'pink',
      hint: 'Shipped to you',
      to: '/orders?status=shipped',
    },
    {
      label: 'Delivered',
      value: summary.delivered_count,
      tone: 'green',
      hint: 'Completed',
      to: '/orders?status=delivered',
    },
  ]

  return (
    <div className="stat-grid">
      {cards.map((card) => (
        <button
          key={card.label}
          type="button"
          className={`stat-card tone-${card.tone} clickable`}
          onClick={() => navigate(card.to)}
        >
          <small>{card.label}</small>
          <strong>{card.value}</strong>
          <span className="stat-hint">{card.hint}</span>
        </button>
      ))}
    </div>
  )
}

export function StatusDonut({ data }) {
  const navigate = useNavigate()
  const [active, setActive] = useState(null)
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1

  const slices = useMemo(() => {
    let offset = 0
    return data.map((item) => {
      const portion = (item.value / total) * 100
      const slice = {
        ...item,
        portion,
        offset,
        color: STATUS_COLORS[item.key] || '#8b5cff',
      }
      offset += portion
      return slice
    })
  }, [data, total])

  const gradient = slices
    .map((slice) => `${slice.color} ${slice.offset}% ${slice.offset + slice.portion}%`)
    .join(', ')

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-head">
        <h3>Where your orders are</h3>
        <small>Tap a status to open it</small>
      </div>
      <div className="donut-wrap">
        <div className="donut" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="donut-hole">
            <strong>
              {active ? active.value : data.reduce((sum, item) => sum + item.value, 0)}
            </strong>
            <small>
              {active ? USER_STATUS_COPY[active.key] || active.label : 'Your orders'}
            </small>
          </div>
        </div>
        <ul className="chart-legend">
          {slices.map((slice) => (
            <li key={slice.key}>
              <button
                type="button"
                className={`legend-btn ${active?.key === slice.key ? 'active' : ''}`}
                onMouseEnter={() => setActive(slice)}
                onFocus={() => setActive(slice)}
                onMouseLeave={() => setActive(null)}
                onClick={() => navigate(`/orders?status=${slice.key}`)}
              >
                <StatusBadge status={slice.key} />
                <span>{slice.value}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function VolumeBars({ data }) {
  const [active, setActive] = useState(null)
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-head">
        <h3>Your activity this week</h3>
        <small>
          {active
            ? `${active.label}: ${active.value} order${active.value === 1 ? '' : 's'}`
            : 'Days you placed orders'}
        </small>
      </div>
      <div className="bar-chart">
        {data.map((item) => {
          const height = `${Math.max((item.value / max) * 100, item.value ? 8 : 2)}%`
          return (
            <button
              key={item.date}
              type="button"
              className={`bar-col ${active?.date === item.date ? 'active' : ''}`}
              onMouseEnter={() => setActive(item)}
              onFocus={() => setActive(item)}
              onMouseLeave={() => setActive(null)}
              aria-label={`${item.label}: ${item.value} orders`}
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

export function NextSteps({ summary }) {
  const navigate = useNavigate()
  const steps = [
    {
      title: 'Track a shipment',
      detail: `${summary.shipped_count} order${summary.shipped_count === 1 ? '' : 's'} currently shipping`,
      action: () => navigate('/orders?status=shipped'),
    },
    {
      title: 'Check pending orders',
      detail: `${summary.pending_count} waiting to be processed`,
      action: () => navigate('/orders?status=pending'),
    },
    {
      title: 'Ask the AI support agent',
      detail: 'Open chat for tracking, status, or refunds',
      action: () => document.querySelector('.chat-launcher')?.click(),
    },
  ]

  return (
    <div className="chart-card glass-card">
      <div className="chart-card-head">
        <h3>Helpful next steps</h3>
      </div>
      <div className="next-steps">
        {steps.map((step) => (
          <button key={step.title} type="button" className="next-step" onClick={step.action}>
            <strong>{step.title}</strong>
            <small>{step.detail}</small>
          </button>
        ))}
      </div>
    </div>
  )
}
