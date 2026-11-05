const STATUS_META = {
  pending: { label: 'Pending', icon: '⏳', tone: 'pending' },
  processing: { label: 'Processing', icon: '⚙️', tone: 'processing' },
  shipped: { label: 'Shipped', icon: '📦', tone: 'shipped' },
  delivered: { label: 'Delivered', icon: '✅', tone: 'delivered' },
  cancelled: { label: 'Cancelled', icon: '⛔', tone: 'cancelled' },
}

export function getStatusMeta(status) {
  return STATUS_META[status] || {
    label: status || 'Unknown',
    icon: '•',
    tone: 'pending',
  }
}

export default function StatusBadge({ status, onClick, interactive = false }) {
  const meta = getStatusMeta(status)

  if (interactive && onClick) {
    return (
      <button
        type="button"
        className={`status-badge status-${meta.tone} interactive`}
        onClick={onClick}
        title={`Status: ${meta.label}`}
      >
        <span className="status-icon" aria-hidden="true">
          {meta.icon}
        </span>
        <span>{meta.label}</span>
      </button>
    )
  }

  return (
    <span className={`status-badge status-${meta.tone}`}>
      <span className="status-icon" aria-hidden="true">
        {meta.icon}
      </span>
      <span>{meta.label}</span>
    </span>
  )
}
