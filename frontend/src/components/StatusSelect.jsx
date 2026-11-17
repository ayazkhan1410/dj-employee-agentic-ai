import { getStatusMeta } from './StatusBadge'

const OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function StatusSelect({ value, onChange, disabled = false }) {
  return (
    <select
      className="status-select"
      aria-label="Order status"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {OPTIONS.map((option) => (
        <option key={option} value={option}>
          {getStatusMeta(option).label}
        </option>
      ))}
    </select>
  )
}
