const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  ticket: 'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z M15 5v3m0 3v2m0 3v3',
  room: 'M4 21V3h12v18 M2 21h20 M16 9h4v12 M8 7h4m-4 4h4m-4 4h4',
  calendar: 'M4 5h16v16H4z M8 3v4m8-4v4M4 11h16m-12 4h2m4 0h2',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  users: 'M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M3 21v-2a8 8 0 0 1 16 0v2 M18 3a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5v2',
  search: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0m-2 4 7 7',
  receipt: 'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 7h8m-8 4h8m-8 4h4',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  moon: 'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  logout: 'M9 3H4v18h5m5-15 6 6-6 6m-7-6h13',
  check: 'm5 12 4 4L19 6',
  dumbbell: 'm6 6 12 12M3 7l4-4m-5 8 9-9m2 20 9-9m-5 8 4-4',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'm6 6 12 12M6 18 18 6',
  shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z m-5 9 3 3 6-6',
  trend: 'm3 17 6-6 4 4 8-10m-6 0h6v6',
}
export default function Icon({ name = 'grid', size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.grid} /></svg>
}
