// Icon set — minimal stroke icons
const Icon = ({ name, size = 16, strokeWidth = 1.75 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></>,
    chart: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
    file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></>,
    cube: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M16 11a3 3 0 1 0 0-6" /><path d="M22 21c0-2.8-2-5-5-5.5" /></>,
    clipboard: <><rect x="6" y="4" width="12" height="18" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M9 10h6M9 14h6M9 18h4" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chev_right: <path d="M9 6l6 6-6 6" />,
    chev_down: <path d="M6 9l6 6 6-6" />,
    chev_left: <path d="M15 6l-6 6 6 6" />,
    check: <path d="M5 12l4 4 10-10" />,
    x: <><path d="M6 6l12 12M18 6L6 18" /></>,
    alert: <><path d="M12 8v5" /><circle cx="12" cy="16.5" r="0.7" fill="currentColor" stroke="none" /><path d="M10.3 3.4L2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.4a2 2 0 0 0-3.4 0z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 8v.01M12 11v5" /></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
    pulse: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    cog: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
    download: <><path d="M12 3v13M7 12l5 5 5-5" /><path d="M3 21h18" /></>,
    upload: <><path d="M12 21V8M7 12l5-5 5 5" /><path d="M3 3h18" /></>,
    edit: <><path d="M14 4l6 6L8 22H2v-6z" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    filter: <path d="M3 5h18l-7 9v6l-4-2v-4z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 11h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    link: <><path d="M9 15l6-6" /><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" /><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" /></>,
    dot_grid: <><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="12" cy="6" r="1" fill="currentColor"/><circle cx="18" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/><circle cx="12" cy="18" r="1" fill="currentColor"/><circle cx="18" cy="18" r="1" fill="currentColor"/></>,
    sparkle: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />,
    chat: <path d="M21 12a8 8 0 0 1-12 7l-5 1 1.5-4A8 8 0 1 1 21 12z" />,
    book: <><path d="M4 4h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4z" /><path d="M20 4h-7a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h7z" /></>,
    audit: <><path d="M9 11l2 2 4-4" /><circle cx="12" cy="12" r="9" /></>,
    sleep: <><path d="M3 12c0-3 2-5 5-5s5 2 5 5h3a3 3 0 0 1 0 6H3" /><path d="M3 12v6" /></>,
    paper: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    pen: <><path d="M3 21l3-1 11-11-2-2L4 18z" /><path d="M14 7l3 3" /></>,
    arrow_right: <path d="M5 12h14M13 5l7 7-7 7" />,
    arrow_up_right: <><path d="M7 17L17 7" /><path d="M8 7h9v9" /></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
};

export default Icon;
