/**
 * Kozmoz teması — kozmozinovasyon.com paleti.
 *
 * Koyu tema gibi karanlık, ancak mor yerine turuncu vurgulu ve arka planlar
 * mavimsi lacivert yerine nötr/siyaha yakın. Anlamsal renkler (başarı, hata,
 * bilgi) koyu temayla aynı bırakıldı; sadece uyarı tonu, birincil turuncuyla
 * karışmasın diye sarıya kaydırıldı.
 */
export const kozmozColors = {
  background: "#0A0A0B",
  backgroundSoft: "#111113",
  backgroundDeep: "#050506",
  backgroundElevated: "#18181B",

  surface: "#1C1C20",
  surfaceSoft: "#232328",
  surfaceMuted: "#151517",

  tabBar: "#0A0A0B",

  card: "#161619",
  cardSoft: "#1C1C20",
  cardElevated: "#232328",
  projectCard: "#18181C",

  border: "rgba(161,161,170,0.14)",
  borderLight: "rgba(161,161,170,0.1)",
  borderStrong: "rgba(161,161,170,0.24)",
  borderSoft: "rgba(161,161,170,0.08)",

  primary: "#F97316",
  primarySoft: "rgba(249,115,22,0.22)",
  primaryLight: "#FB923C",
  primaryDark: "#EA580C",
  primaryGlow: "rgba(249,115,22,0.45)",

  secondary: "#FB923C",
  accent: "#FDBA74",
  accentSoft: "rgba(253,186,116,0.2)",
  cyan: "#38BDF8",

  info: "#60A5FA",
  infoSoft: "rgba(96,165,250,0.2)",

  text: "#FAFAFA",
  textSoft: "#E4E4E7",
  textMuted: "#A1A1AA",
  textDisabled: "#71717A",

  success: "#34D399",
  successSoft: "rgba(52,211,153,0.2)",
  successDark: "#10B981",

  warning: "#FACC15",
  warningSoft: "rgba(250,204,21,0.2)",

  financeAccent: "#34D399",

  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.2)",
  dangerLogout: "#FF6B6B",

  purple: "#C084FC",
  purpleSoft: "rgba(192,132,252,0.2)",

  metricGreen: "#34D399",
  metricGreenBg: "rgba(52,211,153,0.18)",
  metricBlue: "#60A5FA",
  metricBlueBg: "rgba(96,165,250,0.18)",
  metricRed: "#F87171",
  metricRedBg: "rgba(248,113,113,0.18)",
  metricPurple: "#C084FC",
  metricPurpleBg: "rgba(192,132,252,0.18)",
  metricOrange: "#FB923C",
  metricOrangeBg: "rgba(251,146,60,0.18)",

  input: "#0F0F11",
  inputBorder: "rgba(161,161,170,0.18)",
  inputBorderFocus: "rgba(249,115,22,0.75)",

  overlay: "rgba(5,5,6,0.88)",

  white: "#FFFFFF",
  black: "#000000",

  shortcutProjects: "#FB923C",
  shortcutFinance: "#34D399",
  shortcutCompleted: "#C084FC",
  shortcutSearch: "#FACC15",
  shortcutNotifications: "#F87171",
  shortcutCalendar: "#60A5FA",

  gradientStart: "#FB923C",
  gradientEnd: "#EA580C",

  progressBg: "rgba(249,115,22,0.25)",
  progressFill: "#F97316",
  progressTrack: "rgba(161,161,170,0.12)",

  chatOwn: "#EA580C",
  chatOther: "#27272A",
} as const;
