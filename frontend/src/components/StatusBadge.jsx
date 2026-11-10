const STATUS_META = {
  pending: { label: 'Pending', tone: 'pending' },
  processing: { label: 'Processing', tone: 'processing' },
  shipped: { label: 'Shipped', tone: 'shipped' },
  delivered: { label: 'Delivered', tone: 'delivered' },
  cancelled: { label: 'Cancelled', tone: 'cancelled' },
}

export function getStatusMeta(status) {
  return (
    STATUS_META[status] || {
      label: status || 'Unknown',
      tone: 'pending',
    }
  )
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
        <span className="status-icon" aria-hidden="true" />
        <span>{meta.label}</span>
      </button>
    )
  }

  return (
    <span className={`status-badge status-${meta.tone}`}>
      <span className="status-icon" aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  )
}
