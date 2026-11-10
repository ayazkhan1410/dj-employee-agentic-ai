function RobotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="agent-robot-svg">
      <rect x="5" y="8" width="14" height="11" rx="3" fill="currentColor" opacity="0.95" />
      <rect x="8" y="11" width="3" height="3" rx="1" fill="var(--robot-eye, #fff)" />
      <rect x="13" y="11" width="3" height="3" rx="1" fill="var(--robot-eye, #fff)" />
      <path
        d="M12 3v3M9 19.5v1.5M15 19.5v1.5M5 13H3.5A1.5 1.5 0 0 1 2 11.5v0A1.5 1.5 0 0 1 3.5 10H5M19 13h1.5a1.5 1.5 0 0 0 1.5-1.5v0A1.5 1.5 0 0 0 20.5 10H19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="3" r="1.2" fill="currentColor" />
    </svg>
  )
}

export default function AgentLogo({
  size = 'md',
  pulse = false,
  interactive = false,
  onClick,
  label = 'AI Agent',
}) {
  const className = [
    'agent-logo',
    `agent-logo-${size}`,
    pulse ? 'pulse' : '',
    interactive ? 'interactive' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <RobotIcon />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  )

  if (interactive) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={label}>
        {content}
      </button>
    )
  }

  return (
    <span className={className} aria-hidden={label ? undefined : true}>
      {content}
    </span>
  )
}
