import { getStatusMeta } from './StatusBadge'

const OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function StatusSelect({ value, onChange, disabled = false }) {
  return (
    <div className="status-select">
      <label className="sr-only" htmlFor={`status-${value}`}>
        Order status
      </label>
      <div className="status-select-face" aria-hidden="true">
        <span>{getStatusMeta(value).icon}</span>
      </div>
      <select
        id={`status-${value}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {OPTIONS.map((option) => {
          const meta = getStatusMeta(option)
          return (
            <option key={option} value={option}>
              {meta.icon} {meta.label}
            </option>
          )
        })}
      </select>
    </div>
  )
}
