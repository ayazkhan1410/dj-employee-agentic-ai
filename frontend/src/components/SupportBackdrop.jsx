import AgentLogo from './AgentLogo'

export default function SupportBackdrop() {
  function openChat() {
    document.querySelector('.chat-launcher')?.click()
  }

  return (
    <div className="support-backdrop">
      <svg
        className="support-wave"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="supportWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--wave-a)" />
            <stop offset="55%" stopColor="var(--wave-b)" />
            <stop offset="100%" stopColor="var(--wave-a)" />
          </linearGradient>
        </defs>
        <path
          className="support-wave-path"
          fill="none"
          stroke="url(#supportWaveGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          d="M0,180 C240,40 480,300 720,160 C960,20 1200,260 1440,140"
        />
      </svg>

      <p className="support-backdrop-mark" aria-hidden="true">
        AI SUPPORT AGENT
      </p>

      <button
        type="button"
        className="support-backdrop-orb"
        onClick={openChat}
        aria-label="Open AI support chat"
        title="Chat with AI support"
      >
        <span className="support-backdrop-float">
          <span className="support-backdrop-core">
            <span className="support-backdrop-ring" aria-hidden="true" />
            <span className="support-backdrop-ring delay" aria-hidden="true" />
            <AgentLogo size="md" pulse label="" />
          </span>
        </span>
      </button>
    </div>
  )
}
