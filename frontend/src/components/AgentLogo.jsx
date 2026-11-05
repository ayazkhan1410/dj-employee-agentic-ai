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
      <span className="agent-logo-ring" aria-hidden="true" />
      <span className="agent-logo-core" aria-hidden="true">
        ∞
      </span>
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
