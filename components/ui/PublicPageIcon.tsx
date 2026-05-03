import React from 'react';

export type PublicPageIconName =
  | 'arrowLeft'
  | 'book'
  | 'brain'
  | 'chart'
  | 'checklist'
  | 'compass'
  | 'creditCard'
  | 'database'
  | 'device'
  | 'envelope'
  | 'feather'
  | 'headphones'
  | 'heart'
  | 'image'
  | 'lock'
  | 'microphone'
  | 'pen'
  | 'robot'
  | 'shield'
  | 'sparkle'
  | 'tag'
  | 'trash'
  | 'user';

type PublicPageIconProps = {
  name: PublicPageIconName;
  size?: number;
  className?: string;
};

const iconPaths: Record<PublicPageIconName, React.ReactNode> = {
  arrowLeft: <path d="M15 6 9 12l6 6M10 12h10" />,
  book: <path d="M5 5.8A3.2 3.2 0 0 1 8.2 4H19v15H8.2A3.2 3.2 0 0 0 5 20.8V5.8Zm0 0A3.2 3.2 0 0 1 8.2 4H19" />,
  brain: <path d="M9 5.5A3 3 0 0 0 6 8.4a3.2 3.2 0 0 0-1.8 5.7A3.3 3.3 0 0 0 9 18.7V5.5Zm6 0a3 3 0 0 1 3 2.9 3.2 3.2 0 0 1 1.8 5.7 3.3 3.3 0 0 1-4.8 4.6V5.5Z" />,
  chart: <path d="M5 19V5m0 14h14M9 15v-4m4 4V8m4 7v-6" />,
  checklist: <path d="m5 7 1.6 1.6L10 5.2M13 7h6M5 13l1.6 1.6L10 11.2M13 13h6M5 19l1.6 1.6L10 17.2M13 19h6" />,
  compass: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2.1 5-5 2.1 2.1-5 5-2.1Z" />,
  creditCard: <path d="M4 7h16v10H4V7Zm0 3h16M7 15h4" />,
  database: <path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3Zm0 0v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />,
  device: <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 15h2" />,
  envelope: <path d="M4 6h16v12H4V6Zm1 1 7 6 7-6" />,
  feather: <path d="M20 4c-6.8.3-11.2 3.7-12.5 9.5L4 17l3.7-.8C13.9 15 18.2 10.9 20 4ZM7.5 13.5 4 20" />,
  headphones: <path d="M4 14v-2a8 8 0 0 1 16 0v2M6 14h3v6H6a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Zm9 0h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3v-6Z" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  image: <path d="M4 5h16v14H4V5Zm3 10 3.2-3.2 2.4 2.4 2.2-2.7L19 16M8 9h.1" />,
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Zm6 4v2" />,
  microphone: <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm7-3a7 7 0 0 1-14 0m7 7v3" />,
  pen: <path d="m4 20 1.1-4.4L15.7 5a2.1 2.1 0 0 1 3 3L8.1 18.6 4 20Zm10-13 3 3" />,
  robot: <path d="M8 8V5m8 3V5M6 9h12v9H6V9Zm3 4h.1M15 13h.1M9 17h6" />,
  shield: <path d="M12 3 19 6v5c0 4.8-3 8.3-7 10-4-1.7-7-5.2-7-10V6l7-3Z" />,
  sparkle: <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3Zm6 11 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />,
  tag: <path d="M4 5h8l8 8-7 7-8-8V5Zm4 4h.1" />,
  trash: <path d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13M10 11v5m4-5v5" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
};

export const PublicPageIcon: React.FC<PublicPageIconProps> = ({
  name,
  size = 24,
  className = '',
}) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    width={size}
    height={size}
    fill="none"
  >
    <g
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </g>
  </svg>
);
