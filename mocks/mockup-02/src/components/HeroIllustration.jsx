export function HeroIllustration() {
  return (
    <svg
      className="hero-illu"
      viewBox="50 40 420 420"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Tablet mostrando localização de um médico ou hospital"
    >
      <defs>
        <linearGradient id="blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5CE1E6" />
          <stop offset="55%" stopColor="#2EC4B6" />
          <stop offset="100%" stopColor="#1FA8B8" />
        </linearGradient>
      </defs>

      {/* Composition centered on viewBox (260, 250) */}
      <ellipse cx="260" cy="250" rx="200" ry="190" fill="url(#blob)" opacity="0.95" />

      {/* Tablet */}
      <rect x="185" y="140" width="150" height="210" rx="18" fill="#173B6B" />
      <rect x="197" y="156" width="126" height="168" rx="10" fill="#E8F7F8" />

      {/* Full-screen mini map */}
      <rect x="207" y="166" width="106" height="148" rx="8" fill="#D4F1F3" />
      <path
        d="M220 200h80M220 240h80M220 280h80M235 175v130M270 175v130"
        stroke="#A8D8DC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M215 255c18-8 35 10 52 2s28-14 48-4"
        fill="none"
        stroke="#B7E4E8"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Pin with doctor icon only */}
      <g transform="translate(260 230)">
        <path
          d="M0-32c-13.5 0-24.5 10.5-24.5 24 0 18 24.5 40 24.5 40s24.5-22 24.5-40C24.5-21.5 13.5-32 0-32z"
          fill="#FF6B4A"
        />
        <circle cx="0" cy="-10" r="13" fill="#fff" />
        {/* Doctor */}
        <circle cx="0" cy="-14" r="5" fill="#173B6B" />
        <path d="M-8-2c0-5 3.5-7.5 8-7.5s8 2.5 8 7.5" fill="#173B6B" />
        <path
          d="M-4.5-6c-2.2 1-3.5 3.2-3.2 5.8"
          fill="none"
          stroke="#2EC4B6"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="-8" cy="0.5" r="2" fill="none" stroke="#2EC4B6" strokeWidth="1.4" />
      </g>

      {/* Floating ambulance — half in, half out */}
      <g transform="translate(415 130)">
        <circle r="34" fill="#fff" opacity="0.96" />
        <rect x="-16" y="-6" width="28" height="16" rx="3" fill="#173B6B" />
        <path d="M12-2h6l4 6v6h-10V-2z" fill="#173B6B" />
        <rect x="-12" y="-2" width="10" height="7" rx="1.2" fill="#E8F7F8" />
        <rect x="2" y="-2" width="7" height="7" rx="1.2" fill="#E8F7F8" />
        <rect x="-3" y="-18" width="6" height="14" rx="1" fill="#E23B2F" />
        <rect x="-7" y="-14" width="14" height="6" rx="1" fill="#E23B2F" />
        <circle cx="-8" cy="12" r="4" fill="#173B6B" />
        <circle cx="-8" cy="12" r="1.6" fill="#fff" />
        <circle cx="10" cy="12" r="4" fill="#173B6B" />
        <circle cx="10" cy="12" r="1.6" fill="#fff" />
      </g>

      {/* Floating doctor badge */}
      <g transform="translate(120 210)">
        <circle r="30" fill="#fff" opacity="0.96" />
        <circle cx="0" cy="-8" r="8" fill="#173B6B" />
        <path d="M-13 16c0-8 5.5-12 13-12s13 4 13 12" fill="#173B6B" />
        <path
          d="M-7 2c-3.5 1.5-5.5 5-5 9"
          fill="none"
          stroke="#2EC4B6"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="-12" cy="12" r="3" fill="none" stroke="#2EC4B6" strokeWidth="2" />
        <circle cx="-12" cy="12" r="1.1" fill="#FF6B4A" />
      </g>

      {/* Floating hospital badge */}
      <g transform="translate(380 330)">
        <circle r="32" fill="#fff" opacity="0.96" />
        <rect x="-14" y="-4" width="28" height="22" rx="2" fill="#173B6B" />
        <rect x="-8" y="-16" width="16" height="12" rx="1.5" fill="#173B6B" />
        <rect x="-3" y="-13" width="6" height="14" rx="1" fill="#E23B2F" />
        <rect x="-7" y="-9" width="14" height="6" rx="1" fill="#E23B2F" />
        <rect x="-9" y="2" width="6" height="7" rx="0.8" fill="#E8F7F8" />
        <rect x="3" y="2" width="6" height="7" rx="0.8" fill="#E8F7F8" />
        <rect x="-3" y="12" width="6" height="6" rx="0.6" fill="#2EC4B6" />
      </g>

      <g fill="#173B6B">
        <circle cx="445" cy="250" r="5" />
        <circle cx="145" cy="320" r="4" />
        <circle cx="95" cy="150" r="5" />
      </g>
      <path
        d="M155 360c40 28 100 40 160 28"
        stroke="#fff"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.35"
        fill="none"
      />
    </svg>
  )
}
