'use client';

import type { SVGProps } from 'react';

const PATHS = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.35-4.35',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  metro: 'M4 19 8.5 5h.5l3 8 3-8h.5L20 19M3 19h4m10 0h4',
  bus: 'M6 17V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11M6 17h12M6 17v2m12-2v2M6 11h12M8.5 14h.01m7 0h.01M10 7h4',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4m-4 4h10',
  wifi:'M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0M12 20h.01',
  heart: 'M12 20.5s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.9c0 5.9-8 10.6-8 10.6Z',
  check: 'M5 12.5 10 17.5 19 7',
  shield: 'M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Zm-3.2 9 2.2 2.2 4.2-4.4',
  calendar: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12ZM4 10h16M8 3v4m8-4v4',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5m1-16a3.5 3.5 0 0 1 0 7m2.5 3.6C20.5 15.4 21 17.4 21 20',
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z',
  plus: 'M12 5v14M5 12h14',
  chevronDown: 'm6 9 6 6 6-6',
  chevronLeft: 'm15 6-6 6 6 6',
  chevronRight: 'm9 6 6 6-6 6',
  arrowRight: 'M5 12h14m-5-5 5 5-5 5',
  phone: 'M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
  send: 'M21 3 3 10.5l7 2.5m11-10-8 18-3-8m11-10L10 13',
  lock: 'M6 11h12v9H6v-9Zm2.5 0V8a3.5 3.5 0 1 1 7 0v3',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.4 3.8 5.4 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  x: 'M6 6l12 12M18 6 6 18',
  filter: 'M4 6h16M7 12h10m-7 6h4',
  image: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Zm0 9 4.5-4.5 4 4 2.5-2.5 5 5M15.5 9.5h.01',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4',
  trash: 'M4 7h16M9 7V4.5h6V7m-8.5 0 1 13h9l1-13',
  pause: 'M8 5v14m8-14v14',
  play: 'M7 5v14l12-7L7 5Z',
  inbox: 'M3 13.5 5.5 5h13l2.5 8.5V19H3v-5.5Zm0 0h5l1.5 2.5h5l1.5-2.5h5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8.5c0-3.6 3.1-6 7-6s7 2.4 7 6',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4Zm-9 9h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  bed: 'M3 18V6m0 7h18v5m0-5v-1.5A2.5 2.5 0 0 0 18.5 9H11v4M6.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  ruler: 'm4 15 11-11 5 5L9 20l-5-5Zm4-3 2 2m1-5 2 2m1-5 2 2',
  layers: 'm12 4 9 4.5-9 4.5-9-4.5L12 4Zm-9 8.5 9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  wallet: 'M4 7.5A1.5 1.5 0 0 1 5.5 6H19v12H5.5A1.5 1.5 0 0 1 4 16.5v-9Zm12 5.5h.01M4 8h15',
  bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5v-4.5m0-3h.01',
  locate: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-13v3m0 14v3M2 12h3m14 0h3',
  smoke: 'M3 15h13v3H3v-3Zm16 0v3m2-3v3M16 11c0-2 2-2 2-4s-2-2-2-4',
  paw: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 14a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 5 14Zm14 0a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm-7-1c-3 0-5 3.5-5 5.5 0 1.5 1.5 2 3 1.5s2.5-.5 4 0 3 0 3-1.5c0-2-2-5.5-5-5.5Z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
