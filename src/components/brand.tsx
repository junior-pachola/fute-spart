// Escudo + ícones SVG próprios — sem emoji, padrão app de clube.

export function Shield({ size = 56, primaria = "#C8102E", secundaria = "#7A0C1E", nome = "SPARTAX" }: { size?: number; primaria?: string; secundaria?: string; nome?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="48" cy="48" r="45" fill="#fff" />
      <circle cx="48" cy="48" r="45" stroke="#C9A227" strokeWidth="3" />
      <circle cx="48" cy="48" r="37.5" fill={primaria} />
      <circle
        cx="48"
        cy="48"
        r="37.5"
        stroke={secundaria}
        strokeWidth="2"
      />
      {/* capacete espartano estilizado */}
      <path
        d="M48 22c-11 0-18 7.5-18 17 0 4.5 1.6 8.4 4.2 11.4L32 66l6.4-2.6c2.9 1.7 6.6 2.8 9.6 2.8s6.7-1.1 9.6-2.8L64 66l-2.2-15.6c2.6-3 4.2-6.9 4.2-11.4 0-9.5-7-17-18-17Z"
        fill="#fff"
      />
      <path
        d="M48 22c-4.5 0-8.6 1.6-11.7 4.3l3.2 1.5c-2.4 2.6-3.9 6.2-3.9 10.1 0 3.4 1.2 6.5 3.1 8.9l-1.2 8.4 4-1.6c1.9.8 4 1.3 6.5 1.3v12.5c8-2.5 13.5-9 15.4-16.5 2.4-2.9 3.8-6.4 3.8-10 0-9.5-8.2-18.9-19.2-18.9Z"
        fill={secundaria}
      />
      <path
        d="M38 44h20M40 49h16M43 54h10"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* faixa nome */}
      <path
        d="M14 62c8 10 20 15.5 34 15.5S74 72 82 62l-4-4.5C70 65 59 69.5 48 69.5S26 65 18 57.5L14 62Z"
        fill="#0B0B0C"
      />
      <text
        x="48"
        y="66.5"
        textAnchor="middle"
        fontSize={nome.length > 7 ? 8 : 9.5}
        fontWeight="800"
        fill="#fff"
        letterSpacing="1.5"
        fontFamily="Barlow Condensed, sans-serif"
      >
        {nome}
      </text>
    </svg>
  );
}

type IconName =
  | "home"
  | "users"
  | "calendar"
  | "trophy"
  | "news"
  | "gallery"
  | "handshake"
  | "chart"
  | "folder"
  | "bell"
  | "chat"
  | "gear"
  | "menu"
  | "back"
  | "search"
  | "pin"
  | "clock"
  | "chevron"
  | "shield"
  | "check"
  | "play"
  | "filter";

const PATHS: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  calendar:
    "M8 2v4M16 2v4M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  trophy:
    "M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4ZM7 6H4a2 2 0 0 0 2 6h1M17 6h3a2 2 0 0 1-2 6h-1",
  news: "M4 22h16M6 18h12M6 14h12M6 10h8M4 2h16v20H4z",
  gallery:
    "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6M9 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  handshake:
    "M2 12l4-4 4 4 3-3 4 4 3-3 2 2-5 5-4-4-3 3-3-3-3 3-2-4ZM7 8l3-4 4 1 4-1 3 4",
  chart: "M3 3v18h18M8 16v-5M13 16V8M18 16v-8",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a2 2 0 0 0 3.4 0",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  back: "M15 18l-6-6 6-6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2",
  chevron: "M9 18l6-6-6-6",
  shield: "M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z",
  check: "M20 6 9 17l-5-5",
  play: "M6 4l14 8-14 8V4Z",
  filter: "M22 3H2l8 9.5V19l4 2v-8.5L22 3Z",
};

export function Icon({
  name,
  size = 20,
  className = "",
  strokeWidth = 1.9,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
