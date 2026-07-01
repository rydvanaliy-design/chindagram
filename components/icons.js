// Minimal inline SVG icons — no icon dependency.
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

export function Home() { return (<svg {...base}><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10h14V10" /></svg>); }
export function Search() { return (<svg {...base}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>); }
export function Users() { return (<svg {...base}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2A3.2 3.2 0 0 1 16 11" /><path d="M17 14.2a5.5 5.5 0 0 1 3.5 4.8" /></svg>); }
export function PlusSquare() { return (<svg {...base}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>); }
export function UserCircle() { return (<svg {...base}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 19a6 6 0 0 1 11 0" /></svg>); }
export function Heart() { return (<svg {...base}><path d="M12 20s-7-4.4-9.2-8.3C1.3 9 2.4 5.8 5.4 5.2 7.3 4.8 9 5.8 12 8c3-2.2 4.7-3.2 6.6-2.8 3 .6 4.1 3.8 2.6 6.5C19 15.6 12 20 12 20Z" /></svg>); }
export function HeartFilled() { return (<svg {...base} fill="currentColor" stroke="currentColor"><path d="M12 20s-7-4.4-9.2-8.3C1.3 9 2.4 5.8 5.4 5.2 7.3 4.8 9 5.8 12 8c3-2.2 4.7-3.2 6.6-2.8 3 .6 4.1 3.8 2.6 6.5C19 15.6 12 20 12 20Z" /></svg>); }
export function Comment() { return (<svg {...base}><path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5Z" /></svg>); }
export function Send() { return (<svg {...base}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>); }
export function Reel() { return (<svg {...base}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="m10 8 5 4-5 4Z" fill="currentColor" /></svg>); }
export function Flag() { return (<svg {...base}><path d="M5 21V4" /><path d="M5 4h11l-1.5 3L16 10H5" /></svg>); }
export function Shield() { return (<svg {...base}><path d="M12 3 5 6v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Z" /></svg>); }
export function ChevronLeft() { return (<svg {...base}><path d="m15 18-6-6 6-6" /></svg>); }
export function ChevronRight() { return (<svg {...base}><path d="m9 6 6 6-6 6" /></svg>); }
export function X() { return (<svg {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>); }
export function Bookmark() { return (<svg {...base}><path d="M6 3h12v18l-6-4-6 4Z" /></svg>); }
export function BookmarkFilled() { return (<svg {...base} fill="currentColor"><path d="M6 3h12v18l-6-4-6 4Z" /></svg>); }
export function Lock() { return (<svg {...base}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>); }
export function Key() { return (<svg {...base}><circle cx="8" cy="15" r="4" /><path d="M11 12 20 3" /><path d="m17 6 3 3" /><path d="m14 9 2.5 2.5" /></svg>); }
export function Bell() { return (<svg {...base}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>); }
export function MoreHorizontal() { return (<svg {...base} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>); }
export function Repost() { return (<svg {...base}><path d="M17 2 21 6l-4 4" /><path d="M3 12V9a3 3 0 0 1 3-3h15" /><path d="M7 22 3 18l4-4" /><path d="M21 12v3a3 3 0 0 1-3 3H3" /></svg>); }
