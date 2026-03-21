// src/components/Icons.jsx — Custom SVG icon set (stroke-based, Lucide-compatible) v10.4

const Ico = ({ paths = [], circles = [], size = 20, color = "currentColor", weight = 1.8, style: sx = {} }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color}
    strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...sx }}
  >
    {paths.map((d, i) => <path key={i} d={d} />)}
    {circles.map((c, i) => <circle key={i} cx={c[0]} cy={c[1]} r={c[2]} />)}
  </svg>
);

// ── Navigation ──────────────────────────────────────────────────────────────
export const IconBrain = (p) => <Ico {...p} paths={[
  "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",
  "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",
  "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",
  "M17.599 6.5a3 3 0 0 0 .399-1.375",
  "M6.003 5.125A3 3 0 0 0 6.401 6.5",
  "M3.477 10.896a4 4 0 0 1 .585-.396",
  "M19.938 10.5a4 4 0 0 1 .585.396",
  "M6 18a4 4 0 0 1-1.967-.516",
  "M19.967 17.484A4 4 0 0 1 18 18",
]} />;

export const IconChart = (p) => <Ico {...p} paths={[
  "M3 3v18h18", "M18 17V9", "M13 17V5", "M8 17v-3",
]} />;

export const IconPlus = (p) => <Ico {...p} paths={[
  "M5 12h14", "M12 5v14",
]} />;

export const IconSettings = (p) => <Ico {...p}
  paths={["M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]}
  circles={[[12, 12, 3]]}
/>;

// ── Actions ──────────────────────────────────────────────────────────────────
export const IconArrowUp    = (p) => <Ico {...p} paths={["M12 19V5", "M5 12l7-7 7 7"]} />;
export const IconX          = (p) => <Ico {...p} paths={["M18 6 6 18", "M6 6l12 12"]} />;
export const IconChevronDown= (p) => <Ico {...p} paths={["m6 9 6 6 6-6"]} />;
export const IconChevronUp  = (p) => <Ico {...p} paths={["m18 15-6-6-6 6"]} />;
export const IconChevronRight=(p) => <Ico {...p} paths={["m9 18 6-6-6-6"]} />;
export const IconChevronLeft =(p) => <Ico {...p} paths={["m15 18-6-6 6-6"]} />;
export const IconCheck      = (p) => <Ico {...p} paths={["M20 6 9 17l-5-5"]} />;

// ── Log categories ───────────────────────────────────────────────────────────
export const IconUtensils = (p) => <Ico {...p} paths={[
  "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2", "M7 2v20",
  "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7",
]} />;

export const IconDumbbell = (p) => <Ico {...p} paths={[
  "M14.4 14.4 9.6 9.6",
  "M18.657 7.343a4 4 0 0 0-5.657 5.657l3.586 3.586a4 4 0 0 0 5.657-5.657z",
  "M5.343 5.343a4 4 0 0 1 5.657 0l3.586 3.586a4 4 0 0 1-5.657 5.657z",
  "m2 22 1.5-1.5", "m22 2-1.5 1.5",
]} />;

export const IconDrop = (p) => <Ico {...p} paths={[
  "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z",
]} />;

export const IconPill = (p) => <Ico {...p} paths={[
  "m10.5 20.5 10-10a4.95 4.95 0 1 0-7.07-6.95l-10 10a4.95 4.95 0 1 0 7.07 6.95z",
  "M8.5 8.5 16 16",
]} />;

export const IconMoon = (p) => <Ico {...p} paths={[
  "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z",
]} />;

export const IconScale = (p) => <Ico {...p} paths={[
  "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",
  "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",
  "M7 21h10", "M12 3v18",
  "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2",
]} />;

export const IconSmile = (p) => <Ico {...p}
  paths={["M8 13s1.5 2 4 2 4-2 4-2"]}
  circles={[[12, 12, 10], [9, 9, 0.5], [15, 9, 0.5]]}
/>;

export const IconAlertCircle = (p) => <Ico {...p}
  paths={["M12 8v4", "M12 16h.01"]}
  circles={[[12, 12, 10]]}
/>;

export const IconZap = (p) => <Ico {...p} paths={[
  "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
]} />;

export const IconCamera = (p) => <Ico {...p}
  paths={["M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"]}
  circles={[[12, 13, 3]]}
/>;

// ── Settings sections ────────────────────────────────────────────────────────
export const IconUser = (p) => <Ico {...p}
  paths={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"]}
  circles={[[12, 7, 4]]}
/>;

export const IconTarget = (p) => <Ico {...p}
  paths={["M12 2v2", "M12 20v2", "M2 12h2", "M20 12h2"]}
  circles={[[12, 12, 10], [12, 12, 6], [12, 12, 2]]}
/>;

export const IconKey = (p) => <Ico {...p} paths={[
  "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
]} />;

export const IconTrophy = (p) => <Ico {...p} paths={[
  "M6 9H4.5a2.5 2.5 0 0 1 0-5H6", "M18 9h1.5a2.5 2.5 0 0 0 0-5H18",
  "M4 22h16", "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",
  "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",
  "M18 2H6v7a6 6 0 0 0 12 0V2z",
]} />;

export const IconMessage = (p) => <Ico {...p} paths={[
  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
]} />;

export const IconDatabase = (p) => <Ico {...p} paths={[
  "M12 2c5.523 0 10 1.343 10 3s-4.477 3-10 3S2 6.657 2 5s4.477-3 10-3z",
  "M2 5v14c0 1.657 4.477 3 10 3s10-1.343 10-3V5",
  "M2 12c0 1.657 4.477 3 10 3s10-1.343 10-3",
]} />;

export const IconSun = (p) => <Ico {...p}
  paths={["M12 1v2", "M12 21v2", "M4.22 4.22l1.42 1.42", "M18.36 18.36l1.42 1.42",
    "M1 12h2", "M21 12h2", "M4.22 19.78l1.42-1.42", "M18.36 5.64l1.42-1.42"]}
  circles={[[12, 12, 5]]}
/>;

export const IconSave = (p) => <Ico {...p} paths={[
  "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
  "M17 21v-8H7v8", "M7 3v5h8",
]} />;

export const IconDownload = (p) => <Ico {...p} paths={[
  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
  "M7 10l5 5 5-5", "M12 15V3",
]} />;

export const IconUpload = (p) => <Ico {...p} paths={[
  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
  "M17 8l-5-5-5 5", "M12 3v12",
]} />;

export const IconTrash = (p) => <Ico {...p} paths={[
  "M3 6h18", "M8 6V4h8v2",
  "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  "M10 11v6", "M14 11v6",
]} />;

// ── Metrics ──────────────────────────────────────────────────────────────────
export const IconHeart    = (p) => <Ico {...p} paths={["M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"]} />;
export const IconActivity = (p) => <Ico {...p} paths={["M22 12h-4l-3 9L9 3l-3 9H2"]} />;
export const IconWind     = (p) => <Ico {...p} paths={["M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2","M9.6 4.6A2 2 0 1 1 11 8H2","M12.6 19.4A2 2 0 1 0 14 16H2"]} />;
export const IconTrendUp  = (p) => <Ico {...p} paths={["m23 7-9 9-4-4L1 18","M17 7h6v6"]} />;
