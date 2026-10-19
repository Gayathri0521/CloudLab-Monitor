/**
 * CloudLab Monitor - App.jsx (Complete Redesign)
 *
 * PRESERVED: Cognito OIDC auth, API_URL fetch, normalize(), demo data, CSV export,
 *            alert processing, search/filter, all existing business logic.
 *
 * REDESIGNED: Login, Dashboard, Student Timeline, Usage Alerts, Reports, Faculty Profile.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { cognitoLogoutUrl } from "./authConfig.js";
import { students } from "./data/students";
import {
  Alert, AppBar, Avatar, Box, Button, Chip, CircularProgress, Divider, Drawer,
  IconButton, InputAdornment, LinearProgress, List, ListItemButton, ListItemIcon,
  ListItemText, MenuItem, Paper, Select, Snackbar, Stack, TextField, Toolbar,
  Tooltip, Typography, useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import TimelineRounded from "@mui/icons-material/TimelineRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import CloudRounded from "@mui/icons-material/CloudRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import ShieldRounded from "@mui/icons-material/ShieldRounded";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import ReportProblemRounded from "@mui/icons-material/ReportProblemRounded";
import InfoRounded from "@mui/icons-material/InfoRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip as ChartTooltip, XAxis, YAxis, Legend, Area, AreaChart,
} from "recharts";
import "./App.css";

const API_URL = "https://ucr93h0szl.execute-api.us-east-1.amazonaws.com/dev";
const DRAWER_W = 272;

const T = {
  primary: "#6C5CE7", primaryDk: "#4C3BB5", primaryLt: "#A29BFE",
  violet: "#8B5CF6", teal: "#0FB8A9", amber: "#F59E0B", coral: "#F97316",
  emerald: "#10B981", rose: "#F43F5E", cyan: "#06B6D4",
  bg: "#F0F2FF", surface: "#FFFFFF", surface2: "#F8F7FF",
  border: "#E5E0FF", border2: "#EDEDF7",
  text: "#1E1B4B", text2: "#4C4785", muted: "#7C7AB0",
  sidebar: {
    bg: "#12102B", surface: "#1C1942", active: "#2D2A6E", accent: "#7C6EF5",
    text: "#C4C0F0", muted: "#6B68A0", divider: "#252245",
  },
};

const SVC_COLORS = {
  EC2: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  S3: { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  Lambda: { bg: "#F5F3FF", text: "#6D28D9", dot: "#8B5CF6" },
  DynamoDB: { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
  CloudWatch: { bg: "#ECFEFF", text: "#0E7490", dot: "#06B6D4" },
  IAM: { bg: "#FFF1F2", text: "#BE123C", dot: "#F43F5E" },
  RDS: { bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B" },
  Unknown: { bg: "#F8F8F8", text: "#6B7280", dot: "#9CA3AF" },
};
const svcColor = (s) => SVC_COLORS[s] || SVC_COLORS.Unknown;

const appTheme = createTheme({
  typography: { fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", h6: { fontWeight: 700 } },
  palette: { primary: { main: T.primary }, background: { default: T.bg } },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 12 },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "0 6px 20px rgba(108,92,231,0.35)" } },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, fontSize: 11 } } },
  },
});

const NAV = [
  { label: "Dashboard", icon: DashboardRounded },
  { label: "Student Timeline", icon: TimelineRounded },
  { label: "Usage Alerts", icon: WarningAmberRounded },
  { label: "Reports", icon: BarChartRounded },
  { label: "Faculty Profile", icon: PersonRounded },
];

const DEMO_RAW = [
  ["Aarav Sharma", "25MCA0001", "EC2", "Instance launched", "09:10 AM", "Normal"],
  ["Ananya Rao", "25MCA0002", "S3", "Bucket accessed", "09:15 AM", "Normal"],
  ["Rohan Kumar", "25MCA0003", "Lambda", "Function invoked", "09:20 AM", "Normal"],
  ["Diya Nair", "25MCA0004", "DynamoDB", "High request count", "09:25 AM", "Alert"],
  ["Arjun Reddy", "25MCA0005", "CloudWatch", "Metrics viewed", "09:30 AM", "Normal"],
  ["Meera Iyer", "25MCA0006", "EC2", "Instance stopped", "09:35 AM", "Normal"],
  ["Kiran Patel", "25MCA0007", "S3", "Multiple objects accessed", "09:40 AM", "Alert"],
  ["Sneha Das", "25MCA0008", "Lambda", "Function invoked", "09:45 AM", "Normal"],
  ["Rahul Verma", "25MCA0009", "DynamoDB", "Item retrieved", "09:50 AM", "Normal"],
  ["Priya Menon", "25MCA0010", "EC2", "Instance launched", "09:55 AM", "Normal"],
  ["Vikram Singh", "25MCA0011", "S3", "Bucket accessed", "10:00 AM", "Normal"],
  ["Ishita Reddy", "25MCA0012", "EC2", "High instance usage", "10:05 AM", "Alert"],
  ["Aditya Rao", "25MCA0013", "CloudWatch", "Metrics viewed", "10:10 AM", "Normal"],
  ["Kavya Shetty", "25MCA0014", "Lambda", "Function invoked", "10:15 AM", "Normal"],
  ["Nikhil Kumar", "25MCA0015", "DynamoDB", "Item updated", "10:20 AM", "Normal"],
  ["Pooja Sharma", "25MCA0016", "S3", "Multiple objects accessed", "10:25 AM", "Alert"],
];
const demo = DEMO_RAW.map(([student, usn, service, action, time, status], i) => ({
  id: `demo-${i}`, student, usn, service, action, time, status, source: "Demo",
}));

function normalize(item, i) {
  const rawTime = item.timestamp ?? item.Timestamp ?? item.time;
  let time = "?";
  if (rawTime) {
    if (typeof rawTime === "string" && /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(rawTime)) {
      time = rawTime;
    } else {
      const d = new Date(rawTime);
      if (!Number.isNaN(d.getTime())) time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  }
  const studentId = item.studentId ?? item.StudentId ?? item.student ?? item.userName ?? item.userIdentity?.userName ?? "Unknown";
  const usn = item.usn ?? item.USN ?? item.studentUSN ?? "";
  const action = item.activity ?? item.eventName ?? item.action ?? "Activity recorded";
  const lower = String(action).toLowerCase();
  const statusTxt = String(item.status ?? item.Status ?? "").toLowerCase();
  const alert = ["alert", "review"].includes(statusTxt) || ["high request count", "multiple objects", "high instance usage"].some(x => lower.includes(x));
  const match = Array.isArray(students) ? students.find(s => (usn && s.usn === usn) || s.usn === studentId || s.name === studentId) : null;
  return {
    id: item.eventId ?? item.EventId ?? item.id ?? `activity-${i}`,
    student: match?.name ?? studentId,
    usn: match?.usn ?? usn,
    service: item.service ?? item.Service ?? item.eventSource ?? "Unknown",
    action, time,
    status: alert ? "Alert" : "Normal",
    source: item.source ?? "AWS API",
  };
}

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "F";
}

function humanizeFacultyName(profile = {}) {
  const claimedName = [profile.given_name, profile.family_name].filter(Boolean).join(" ").trim();
  const profileName = String(profile.name || "").trim();
  const realName = claimedName || (profileName && !/[0-9_.-]/.test(profileName) ? profileName : "");
  const candidate = String(realName || profile.preferred_username || profile.email?.split("@")[0] || "").trim();
  if (!candidate) return "Faculty";

  const cleaned = candidate
    .replace(/@.*$/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Faculty";

  const words = cleaned.split(" ").filter(Boolean);
  if (!realName && words.length === 1 && /[a-z]m$/i.test(words[0]) && /\d/.test(candidate)) {
    words[0] = words[0].slice(0, -1);
  }
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getLocalDisplayName(email) {
  if (typeof window === "undefined" || !email) return "";
  return window.localStorage.getItem(`clm-display-name:${email}`) || "";
}

// ─ StatusBadge ─
function StatusBadge({ status }) {
  const isAlert = status === "Alert";
  return (
    <Chip
      label={isAlert ? "Review" : "Normal"}
      size="small"
      icon={isAlert ? <ErrorOutlineRounded sx={{ fontSize: "13px !important" }} /> : <CheckCircleOutlineRounded sx={{ fontSize: "13px !important" }} />}
      sx={{
        bgcolor: isAlert ? "#FFF0E5" : "#E6FAF4",
        color: isAlert ? T.coral : T.emerald,
        border: "none", fontWeight: 700,
        "& .MuiChip-icon": { color: "inherit" },
      }}
    />
  );
}

// ─ ServiceChip ─
function ServiceChip({ service }) {
  const c = svcColor(service);
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.3, borderRadius: 20, bgcolor: c.bg, fontSize: 11, fontWeight: 700, color: c.text, whiteSpace: "nowrap" }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: c.dot, flexShrink: 0 }} />
      {service}
    </Box>
  );
}

// ─ MetricTile ─
function MetricTile({ title, value, helper, icon: Icon, gradient, delay = 0 }) {
  return (
    <Box
      className={`animate-fade-up${delay ? ` delay-${delay}` : ""}`}
      sx={{
        background: gradient, borderRadius: 4, p: { xs: 2.5, md: 3 }, color: "#fff",
        position: "relative", overflow: "hidden", cursor: "default",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 20px 50px rgba(0,0,0,0.22)" },
      }}
    >
      <Box sx={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)", right: -30, top: -30 }} />
      <Box sx={{ position: "absolute", width: 70, height: 70, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)", right: 40, bottom: -20 }} />
      <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
        <Icon sx={{ fontSize: 22, color: "#fff" }} />
      </Box>
      <Typography sx={{ fontSize: 32, fontWeight: 800, lineHeight: 1, mb: 0.5 }}>{value}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, opacity: 0.95, mb: 0.3 }}>{title}</Typography>
      <Typography sx={{ fontSize: 11, opacity: 0.7 }}>{helper}</Typography>
    </Box>
  );
}

// ─ SectionPanel ─
function SectionPanel({ title, subtitle, action, children, sx = {}, className = "" }) {
  return (
    <Paper elevation={0} className={className} sx={{ p: { xs: 2.5, md: 3 }, border: `1px solid ${T.border}`, borderRadius: 4, bgcolor: T.surface, boxShadow: "0 4px 20px rgba(30,27,75,0.06)", ...sx }}>
      {(title || action) && (
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 2.5 }}>
          <Box>
            {title && <Typography sx={{ fontWeight: 700, color: T.text, fontSize: 15.5, letterSpacing: -0.2 }}>{title}</Typography>}
            {subtitle && <Typography variant="body2" sx={{ color: T.muted, mt: 0.3, fontSize: 12.5 }}>{subtitle}</Typography>}
          </Box>
          {action}
        </Stack>
      )}
      {children}
    </Paper>
  );
}

// ─ EmptyState ─
function EmptyState({ icon: Icon = CloudRounded, title = "No data", subtitle = "Nothing to show here yet." }) {
  return (
    <Stack alignItems="center" justifyContent="center" py={6} spacing={1.5}>
      <Box sx={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon sx={{ fontSize: 32, color: T.primary }} />
      </Box>
      <Typography fontWeight={700} color={T.text2}>{title}</Typography>
      <Typography variant="body2" color={T.muted} textAlign="center" maxWidth={280}>{subtitle}</Typography>
    </Stack>
  );
}

// ─ SkeletonRows ─
function SkeletonRows({ count = 4 }) {
  return (
    <Stack spacing={1.5} px={2} py={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Stack key={i} direction="row" spacing={2} alignItems="center">
          <Box className="skeleton" sx={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }} />
          <Stack spacing={0.8} flex={1}>
            <Box className="skeleton" sx={{ height: 12, width: "60%" }} />
            <Box className="skeleton" sx={{ height: 10, width: "40%" }} />
          </Stack>
          <Box className="skeleton" sx={{ width: 60, height: 24, borderRadius: 20 }} />
        </Stack>
      ))}
    </Stack>
  );
}

// ─ ActivityTable ─
function ActivityTable({ rows, loading, demoMode, apiHasRecords, refresh, exportCSV, compactMode = false }) {
  const hdrs = ["STUDENT", "USN", "SERVICE", "ACTIVITY", "TIME", "STATUS"];
  return (
    <Box sx={{ border: `1px solid ${T.border}`, borderRadius: 3, overflow: "hidden" }}>
      {loading && <LinearProgress sx={{ height: 2.5, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#6C5CE7,#A29BFE)" } }} />}
      {loading && !rows.length ? <SkeletonRows count={5} /> : (
        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}>
            <Box component="thead">
              <Box component="tr" sx={{ background: "linear-gradient(90deg,#F5F3FF,#F0F2FF)" }}>
                {hdrs.map(h => (
                  <Box component="th" key={h} sx={{ textAlign: "left", px: 2.5, py: 1.8, color: T.muted, fontSize: 10, letterSpacing: 1, fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {rows.map((r, idx) => (
                <Box component="tr" key={r.id} className="animate-fade-in" sx={{ animationDelay: `${idx * 40}ms`, transition: "background 0.15s", "&:hover": { bgcolor: "#F5F3FF" } }}>
                  <Box component="td" sx={{ px: 2.5, py: compactMode ? 1 : 1.8, borderBottom: `1px solid ${T.border2}` }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ width: 34, height: 34, background: "linear-gradient(135deg,#6C5CE7,#A29BFE)", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{getInitials(r.student)}</Avatar>
                      <Typography variant="body2" fontWeight={700} sx={{ color: T.text }}>{r.student}</Typography>
                    </Stack>
                  </Box>
                  <Box component="td" sx={{ px: 2.5, py: compactMode ? 1 : 1.8, borderBottom: `1px solid ${T.border2}` }}>
                    <Typography variant="caption" sx={{ color: T.muted, fontWeight: 600, fontFamily: "monospace", fontSize: 11 }}>{r.usn || "?"}</Typography>
                  </Box>
                  <Box component="td" sx={{ px: 2.5, py: compactMode ? 1 : 1.8, borderBottom: `1px solid ${T.border2}` }}><ServiceChip service={r.service} /></Box>
                  <Box component="td" sx={{ px: 2.5, py: compactMode ? 1 : 1.8, borderBottom: `1px solid ${T.border2}`, color: T.text2, fontSize: 13 }}>{r.action}</Box>
                  <Box component="td" sx={{ px: 2.5, py: compactMode ? 1 : 1.8, borderBottom: `1px solid ${T.border2}`, whiteSpace: "nowrap", color: T.muted, fontSize: 12.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}><AccessTimeRounded sx={{ fontSize: 12, opacity: 0.7 }} /><span>{r.time}</span></Stack>
                  </Box>
                  <Box component="td" sx={{ px: 2.5, py: compactMode ? 1 : 1.8, borderBottom: `1px solid ${T.border2}` }}><StatusBadge status={r.status} /></Box>
                </Box>
              ))}
              {!loading && !rows.length && (
                <Box component="tr"><Box component="td" colSpan={6} sx={{ p: 0 }}><EmptyState title="No matching activity" subtitle="Adjust your search or filter criteria." /></Box></Box>
              )}
            </Box>
          </Box>
        </Box>
      )}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1} sx={{ px: 2.5, py: 1.5, bgcolor: T.surface2, borderTop: `1px solid ${T.border}` }}>
        <Typography variant="caption" sx={{ color: T.muted }}>
          {demoMode ? "Sample data - not verified AWS activity" : apiHasRecords ? "AWS API + sample records" : "API returned no records; illustrative samples shown"}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<DownloadRounded />} onClick={exportCSV} sx={{ borderRadius: 2.5, borderColor: T.border, color: T.primary }}>Export CSV</Button>
          <Button size="small" variant="contained" startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <RefreshRounded />} onClick={refresh} disabled={loading} sx={{ borderRadius: 2.5, background: "linear-gradient(135deg,#6C5CE7,#A855F7)" }}>Refresh</Button>
        </Stack>
      </Stack>
    </Box>
  );
}

// ─ LOGIN SCREEN ─
function LoginScreen({ auth }) {
  const isMobile = useMediaQuery("(max-width:900px)");
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, bgcolor: "#0C0A1E" }}>
      {!isMobile && (
        <Box className="login-left-panel" sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", p: { md: 7, lg: 10 }, position: "relative", overflow: "hidden", background: "linear-gradient(145deg,#0f0c29 0%,#302b63 55%,#24243e 100%)" }}>
          <Box className="animate-float" sx={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(108,92,231,0.35) 0%,transparent 70%)", top: -80, right: -100 }} />
          <Box className="animate-float delay-500" sx={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,206,201,0.2) 0%,transparent 70%)", bottom: 40, left: -60 }} />
          <Box sx={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 6 }} className="animate-fade-up delay-100">
              <Box sx={{ width: 56, height: 56, borderRadius: 3.5, background: "linear-gradient(135deg,#6C5CE7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(108,92,231,0.5)" }}>
                <CloudRounded sx={{ fontSize: 30, color: "#fff" }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.4, color: "#fff" }}>CloudLab Monitor</Typography>
                <Typography sx={{ fontSize: 10.5, color: "rgba(196,192,240,0.6)", letterSpacing: 1.8, fontWeight: 600 }}>AWS STUDENT MONITORING</Typography>
              </Box>
            </Stack>
            <Typography className="animate-fade-up delay-200" sx={{ fontSize: { md: 36, lg: 44 }, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.8, color: "#fff", mb: 2.5 }}>
              Your Cloud Labs.
              <Box component="span" sx={{ display: "block", background: "linear-gradient(90deg,#A29BFE,#00CEC9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One Clear View.</Box>
            </Typography>
            <Typography className="animate-fade-up delay-300" sx={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(196,192,240,0.8)", mb: 5, maxWidth: 420 }}>
              Understand cloud activity, monitor usage, and identify unusual patterns through one intelligent faculty workspace.
            </Typography>
            <Stack spacing={2} className="animate-fade-up delay-400">
              {[
                { Icon: TimelineRounded, text: "Real-time student AWS activity timelines" },
                { Icon: WarningAmberRounded, text: "Threshold violation alerts and usage monitoring" },
                { Icon: BarChartRounded, text: "Service-wise usage reports and CSV exports" },
                { Icon: PeopleAltRounded, text: "Multi-student overview with filtered search" },
              ].map(({ Icon, text }) => (
                <Stack key={text} direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "rgba(108,92,231,0.18)", border: "1px solid rgba(162,155,254,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon sx={{ fontSize: 17, color: "#A29BFE" }} />
                  </Box>
                  <Typography sx={{ fontSize: 13.5, color: "rgba(196,192,240,0.85)" }}>{text}</Typography>
                </Stack>
              ))}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 6 }} className="animate-fade-up delay-500">
              <Box className="animate-blink" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#00CEC9", boxShadow: "0 0 10px #00CEC9" }} />
              <Typography sx={{ fontSize: 12, color: "rgba(196,192,240,0.5)" }}>Powered by Amazon Cognito ? AWS API Gateway ? DynamoDB</Typography>
            </Stack>
          </Box>
        </Box>
      )}
      <Box className="login-right-panel" sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2.5, sm: 4, md: 5 }, background: { xs: "linear-gradient(145deg,#0f0c29 0%,#302b63 55%,#24243e 100%)", md: "#0E0C22" } }}>
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          {isMobile && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }} className="animate-fade-up">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, background: "linear-gradient(135deg,#6C5CE7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CloudRounded sx={{ fontSize: 24, color: "#fff" }} />
              </Box>
              <Box>
                <Typography fontWeight={800} fontSize={19} color="#fff">CloudLab Monitor</Typography>
                <Typography fontSize={10} color="rgba(196,192,240,0.5)" letterSpacing={1.5}>AWS STUDENT MONITORING</Typography>
              </Box>
            </Stack>
          )}
          <Paper className="login-card" elevation={0} sx={{ p: { xs: 3.5, sm: 5 }, borderRadius: 5, bgcolor: "rgba(30,25,66,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(162,155,254,0.2)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "inline-block", px: 1.5, py: 0.5, borderRadius: 20, background: "linear-gradient(90deg,rgba(108,92,231,0.3),rgba(0,206,201,0.2))", border: "1px solid rgba(162,155,254,0.3)", mb: 2 }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.8, color: "#A29BFE" }}>FACULTY WORKSPACE</Typography>
              </Box>
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.4, mb: 1 }}>Faculty Sign In</Typography>
              <Typography sx={{ color: "rgba(196,192,240,0.65)", fontSize: 14, lineHeight: 1.7 }}>Sign in to access your cloud lab monitoring dashboard.</Typography>
            </Box>
            <Box sx={{ mb: 3.5, p: 2, borderRadius: 3, background: "rgba(108,92,231,0.12)", border: "1px solid rgba(162,155,254,0.2)" }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <InfoRounded sx={{ fontSize: 18, color: "#A29BFE", mt: 0.15, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: "rgba(196,192,240,0.75)", lineHeight: 1.7, fontSize: 12.5 }}>You will be redirected to the Amazon Cognito hosted sign-in page. Enter your faculty credentials there.</Typography>
              </Stack>
            </Box>
            <Button
              variant="contained" fullWidth size="large"
              onClick={() => auth.signinRedirect()}
              sx={{ py: 1.8, fontSize: 15, fontWeight: 700, borderRadius: 3, background: "linear-gradient(135deg,#6C5CE7 0%,#A855F7 100%)", boxShadow: "0 8px 30px rgba(108,92,231,0.5)", "&:hover": { background: "linear-gradient(135deg,#5847D4 0%,#9333EA 100%)", boxShadow: "0 12px 40px rgba(108,92,231,0.65)", transform: "translateY(-1px)" } }}
            >
              Sign in with Faculty Account
            </Button>
            <Divider sx={{ my: 3.5, borderColor: "rgba(255,255,255,0.08)" }} />
            <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: "rgba(196,192,240,0.4)", lineHeight: 2, fontSize: 11.5 }}>
              Secure sign-in powered by Amazon Cognito.<br />Faculty credentials are never stored in this application.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

// ─ FACULTY PROFILE PAGE ─
function FacultyProfilePage({ facultyName, email, initials: ini, auth, handleLogout, loggingOut, compactMode, setCompactMode, darkTopbar, setDarkTopbar, onDisplayNameChange }) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(facultyName);
  const [nameError, setNameError] = useState("");
  const provider = auth?.user?.profile?.iss?.includes("cognito") ? "Amazon Cognito" : "OIDC provider";

  const saveDisplayName = () => {
    const value = draftName.trim().replace(/\s+/g, " ");
    if (value.length < 2 || value.length > 80) {
      setNameError("Enter a display name between 2 and 80 characters.");
      return;
    }
    if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(value)) {
      setNameError("Use letters, spaces, apostrophes, periods, or hyphens only.");
      return;
    }
    onDisplayNameChange(value);
    setNameError("");
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraftName(facultyName);
    setNameError("");
    setEditing(false);
  };

  const infoRows = [
    { label: "Local Display Name", value: facultyName, editable: true },
    { label: "Cognito Email", value: email, readOnly: true },
    { label: "Authentication Provider", value: provider, readOnly: true },
    { label: "Role", value: "Faculty", readOnly: true },
  ];
  return (
    <Box className="animate-fade-up">
      <Box sx={{ borderRadius: 5, background: "linear-gradient(135deg,#6C5CE7 0%,#A855F7 50%,#EC4899 100%)", p: { xs: 3, md: 4.5 }, mb: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.07)", right: -80, top: -80 }} />
        <Box sx={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)", left: -40, bottom: -60 }} />
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={3} sx={{ position: "relative", zIndex: 1 }}>
          <Avatar className="animate-scale-in" sx={{ width: 88, height: 88, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", border: "3px solid rgba(255,255,255,0.5)", fontSize: 30, fontWeight: 800, color: "#fff", boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}>
            {ini}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 800, color: "#fff", mb: 0.5, letterSpacing: -0.4 }}>{facultyName}</Typography>
            <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.7)", mb: 1.5 }}>{email}</Typography>
            <Chip icon={<ShieldRounded sx={{ fontSize: "14px !important", color: "#fff !important" }} />} label="Faculty Account" size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, backdropFilter: "blur(8px)" }} />
          </Box>
        </Stack>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" }, gap: 3 }}>
        <SectionPanel title="Profile Information" subtitle="Account details from Cognito authentication" className="animate-fade-up delay-100" action={!editing && <Button size="small" variant="outlined" startIcon={<PersonRounded />} onClick={() => { setDraftName(facultyName); setEditing(true); }}>Edit Profile</Button>}>
          {editing && (
            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: "#F5F3FF", border: `1px solid ${T.border}` }}>
              <TextField
                fullWidth
                size="small"
                label="Local display name"
                value={draftName}
                onChange={event => { setDraftName(event.target.value); setNameError(""); }}
                error={Boolean(nameError)}
                helperText={nameError || "Only this browser display changes; your Cognito account is not updated."}
                autoFocus
                inputProps={{ maxLength: 80 }}
              />
              <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.5 }}>
                <Button size="small" onClick={cancelEdit}>Cancel</Button>
                <Button size="small" variant="contained" onClick={saveDisplayName}>Save</Button>
              </Stack>
            </Box>
          )}
          <Stack spacing={0}>
            {infoRows.map(({ label, value }, i) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.8, borderBottom: i < infoRows.length - 1 ? `1px solid ${T.border2}` : "none", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="body2" sx={{ color: T.muted, fontWeight: 600, minWidth: 130 }}>{label}</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, maxWidth: "100%" }}>
                  {infoRows[i].editable && <Chip label="Local only" size="small" sx={{ height: 20, bgcolor: "#EDE9FE", color: T.primary, fontSize: 10 }} />}
                  <Typography variant="body2" sx={{ color: T.text, fontWeight: 600, textAlign: "right", overflowWrap: "anywhere" }}>{value || "?"}</Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
          <Box sx={{ mt: 2, p: 2, borderRadius: 2.5, bgcolor: T.surface2, border: `1px solid ${T.border}` }}>
            <Typography variant="caption" sx={{ color: T.muted, lineHeight: 1.8, fontSize: 12 }}>
              Profile attributes are read from the Cognito session. The display name above is a local preference only. Updating the actual Cognito account attributes requires a separately configured Cognito update flow or administrator action.
            </Typography>
          </Box>
        </SectionPanel>
        <Stack spacing={3}>
          <SectionPanel title="Interface Preferences" subtitle="Stored locally in your browser" className="animate-fade-up delay-200">
            <Stack spacing={2}>
              {[
                { label: "Compact view", sub: "Reduce row spacing in tables", val: compactMode, onChange: setCompactMode },
                { label: "Dark header bar", sub: "Use a dark topbar for stronger contrast", val: darkTopbar, onChange: setDarkTopbar },
              ].map(({ label, sub, val, onChange }) => (
                <Stack key={label} direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} color={T.text}>{label}</Typography>
                    <Typography variant="caption" color={T.muted}>{sub}</Typography>
                  </Box>
                  <Box role="switch" aria-checked={val} tabIndex={0} onClick={() => onChange(!val)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") onChange(!val); }} sx={{ width: 44, height: 24, borderRadius: 20, background: val ? "linear-gradient(135deg,#6C5CE7,#A855F7)" : T.border, cursor: "pointer", position: "relative", transition: "background 200ms ease", flexShrink: 0 }}>
                    <Box sx={{ position: "absolute", width: 18, height: 18, borderRadius: "50%", bgcolor: "#fff", top: 3, left: val ? 23 : 3, transition: "left 200ms ease", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
                  </Box>
                </Stack>
              ))}
            </Stack>
            <Typography variant="caption" sx={{ display: "block", mt: 2, color: T.muted, fontSize: 11 }}>These preferences are local and do not update your Cognito account.</Typography>
          </SectionPanel>
          <SectionPanel title="Account Actions" className="animate-fade-up delay-300">
            <Stack spacing={1.5}>
              <Button fullWidth variant="outlined" startIcon={loggingOut ? <CircularProgress size={15} color="inherit" /> : <LogoutRounded />} onClick={handleLogout} disabled={loggingOut} sx={{ borderRadius: 3, borderColor: "#FCA5A5", color: T.rose, fontWeight: 700, py: 1.2, "&:hover": { bgcolor: "#FFF1F2", borderColor: T.rose } }}>
                {loggingOut ? "Signing out..." : "Sign Out of CloudLab Monitor"}
              </Button>
              <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: T.muted, fontSize: 11 }}>You will be redirected to the Cognito logout page.</Typography>
            </Stack>
          </SectionPanel>
        </Stack>
      </Box>
    </Box>
  );
}

// ─ DASHBOARD PAGE ─
function DashboardPage({ activities, alerts, services, loading, demoMode, apiHasRecords, refresh, exportCSV, facultyName, go, compactMode }) {
  const studentCount = new Set(activities.map(x => x.student).filter(x => x && x !== "Unknown")).size;
  const serviceCount = new Set(activities.map(x => x.service).filter(x => x && x !== "Unknown")).size;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const metrics = [
    { title: "Students Recorded", value: studentCount, helper: "Unique names in records", icon: PeopleAltRounded, gradient: "linear-gradient(135deg,#6C5CE7 0%,#A855F7 100%)", delay: 100 },
    { title: "Activity Events", value: activities.length, helper: "AWS and sample records", icon: TimelineRounded, gradient: "linear-gradient(135deg,#0FB8A9 0%,#06B6D4 100%)", delay: 200 },
    { title: "AWS Services", value: serviceCount, helper: "Services in current records", icon: CloudRounded, gradient: "linear-gradient(135deg,#F59E0B 0%,#F97316 100%)", delay: 300 },
    { title: "Usage Alerts", value: alerts.length, helper: "Records flagged for review", icon: WarningAmberRounded, gradient: "linear-gradient(135deg,#F43F5E 0%,#EC4899 100%)", delay: 400 },
  ];
  return (
    <>
      <Box className="animate-fade-up" sx={{ borderRadius: 5, background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4C1D95 100%)", p: { xs: 3, md: 4.5 }, mb: 3.5, position: "relative", overflow: "hidden" }}>
        <Box className="animate-float" sx={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(108,92,231,0.3) 0%,transparent 70%)", right: -80, top: -100 }} />
        <Box className="animate-float delay-300" sx={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,206,201,0.2) 0%,transparent 70%)", left: 80, bottom: -60 }} />
        <Box sx={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, px: 1.5, py: 0.5, borderRadius: 20, bgcolor: "rgba(162,155,254,0.15)", border: "1px solid rgba(162,155,254,0.25)", mb: 1.5 }}>
              <Box className="animate-blink" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#00CEC9" }} />
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, color: "#A29BFE" }}>
                {demoMode ? "SAMPLE DATA MODE" : apiHasRecords ? "LIVE + SAMPLE DATA" : "NO API RECORDS"}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: 22, sm: 28, md: 32 }, fontWeight: 800, color: "#fff", letterSpacing: -0.5, mb: 1 }}>
              Good morning, {facultyName.split(" ")[0]}!
            </Typography>
            <Typography sx={{ fontSize: 14.5, color: "rgba(196,192,240,0.75)", maxWidth: 500, lineHeight: 1.7 }}>
              A centralized view of student cloud-lab activity, AWS service usage, and events that may need your review.
            </Typography>
            <Typography sx={{ fontSize: 12, color: "rgba(196,192,240,0.45)", mt: 1 }}>{today}</Typography>
          </Box>
          <Button variant="contained" startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshRounded />} onClick={refresh} disabled={loading} sx={{ borderRadius: 3, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, "&:hover": { background: "rgba(255,255,255,0.2)" } }}>
            {loading ? "Refreshing..." : "Refresh Activity"}
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 2.5, mb: 3.5 }}>
        {metrics.map(m => <MetricTile key={m.title} {...m} />)}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 0.6fr" }, gap: 3, mb: 3.5 }}>
        <SectionPanel title="AWS Service Usage" subtitle="Activity records grouped by service" className="animate-fade-up delay-200">
          {services.length ? (
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={services} margin={{ top: 8, right: 8, left: -15, bottom: 8 }}>
                  <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6C5CE7" /><stop offset="100%" stopColor="#A855F7" /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border2} />
                  <XAxis dataKey="service" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={48} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <ChartTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12, boxShadow: "0 8px 24px rgba(30,27,75,0.12)" }} cursor={{ fill: "rgba(108,92,231,0.06)" }} />
                  <Bar dataKey="events" name="Activities" fill="url(#barGrad)" radius={[8, 8, 0, 0]} maxBarSize={52} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : <EmptyState title="No service data" subtitle="Service usage will appear here once activity records load." />}
        </SectionPanel>
        <SectionPanel title="Recent Alerts" subtitle={`${alerts.length} records flagged`} className="animate-fade-up delay-300" action={<Button size="small" variant="outlined" onClick={() => go("Usage Alerts")} sx={{ borderRadius: 2.5, fontSize: 12, borderColor: T.border, color: T.primary }}>View all</Button>}>
          {alerts.length === 0 ? <EmptyState icon={CheckCircleOutlineRounded} title="No alerts" subtitle="All activity looks normal." /> : (
            <Stack spacing={0}>
              {alerts.slice(0, 4).map((x, i) => (
                <Stack key={x.id} direction="row" spacing={1.5} alignItems="flex-start" className="alert-entry" sx={{ animationDelay: `${i * 80}ms`, py: 1.5, borderBottom: i < Math.min(alerts.length, 4) - 1 ? `1px solid ${T.border2}` : "none" }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg,#FFF0E5,#FFE4CC)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <WarningAmberRounded sx={{ fontSize: 17, color: T.coral }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap sx={{ color: T.text, fontSize: 13 }}>{x.action}</Typography>
                    <Typography variant="caption" sx={{ color: T.muted }}>{x.student} ? {x.service} ? {x.time}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </SectionPanel>
      </Box>
      <SectionPanel title="Latest Activity" subtitle="Most recent recorded events" className="animate-fade-up delay-400" action={<Button size="small" variant="outlined" onClick={() => go("Student Timeline")} sx={{ borderRadius: 2.5, fontSize: 12, borderColor: T.border, color: T.primary }}>Full timeline</Button>}>
        <ActivityTable rows={activities.slice(0, 6)} loading={loading} demoMode={demoMode} apiHasRecords={apiHasRecords} refresh={refresh} exportCSV={exportCSV} compactMode={compactMode} />
      </SectionPanel>
    </>
  );
}

// ─ STUDENT TIMELINE PAGE ─
function StudentTimelinePage({ visible, loading, demoMode, apiHasRecords, exportCSV, search, setSearch, filter, setFilter }) {
  const uniqueStudents = [...new Set(visible.map(x => x.student))].length;
  const uniqueServices = [...new Set(visible.map(x => x.service))].length;
  const grouped = useMemo(() => {
    const groups = {};
    visible.forEach(item => {
      const h = parseInt((item.time || "00").split(":")[0] || "0", 10);
      const period = h < 10 ? "Morning Session" : h < 14 ? "Midday Session" : "Afternoon Session";
      if (!groups[period]) groups[period] = [];
      groups[period].push(item);
    });
    return Object.entries(groups);
  }, [visible]);

  return (
    <Box className="animate-fade-up">
      <Box sx={{ borderRadius: 4, background: "linear-gradient(135deg,#0FB8A9 0%,#06B6D4 60%,#3B82F6 100%)", p: { xs: 2.5, md: 3.5 }, mb: 3, position: "relative", overflow: "hidden", color: "#fff" }}>
        <Box sx={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)", right: -50, top: -80 }} />
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} sx={{ position: "relative", zIndex: 1 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 800, letterSpacing: -0.4, mb: 0.5 }}>Student Timeline</Typography>
            <Typography sx={{ fontSize: 13.5, opacity: 0.85, maxWidth: 460 }}>Chronological view of recorded AWS activity. Use search and filters to explore events.</Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {[{ val: visible.length, label: "Visible" }, { val: uniqueStudents, label: "Students" }, { val: uniqueServices, label: "Services" }].map(({ val, label }) => (
              <Box key={label} sx={{ textAlign: "center", bgcolor: "rgba(255,255,255,0.15)", px: 2.5, py: 1.2, borderRadius: 3, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Typography sx={{ fontSize: 22, fontWeight: 800 }}>{val}</Typography>
                <Typography sx={{ fontSize: 10.5, opacity: 0.8, letterSpacing: 0.5 }}>{label}</Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>
      <SectionPanel sx={{ mb: 3, p: 2.5 }} className="animate-fade-up delay-100">
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: T.muted, flexShrink: 0 }}>
            <FilterListRounded sx={{ fontSize: 18 }} />
            <Typography variant="body2" fontWeight={600} color={T.muted}>Filter</Typography>
          </Box>
          <TextField fullWidth size="small" placeholder="Search student name, USN, service or activity..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" sx={{ color: T.muted }} /></InputAdornment> }} sx={{ minWidth: 0, flex: { md: "1 1 240px" } }} />
          <Select size="small" value={filter} onChange={e => setFilter(e.target.value)} sx={{ minWidth: { xs: "100%", md: 180 }, flex: { md: "0 0 180px" }, borderRadius: 2.5 }}>
            <MenuItem value="All">All Activities</MenuItem>
            <MenuItem value="Normal">Normal Only</MenuItem>
            <MenuItem value="Alert">Alerts Only</MenuItem>
          </Select>
          <Button variant="contained" startIcon={<DownloadRounded />} onClick={exportCSV} sx={{ minWidth: { xs: "100%", md: 132 }, flexShrink: 0, px: 2, whiteSpace: "nowrap", borderRadius: 2.5, background: "linear-gradient(135deg,#6C5CE7,#A855F7)" }}>Export CSV</Button>
        </Stack>
      </SectionPanel>
      {loading && !visible.length ? <SectionPanel><SkeletonRows count={6} /></SectionPanel> :
        !visible.length ? <SectionPanel><EmptyState title="No matching activities" subtitle="Try adjusting your search or filter criteria." /></SectionPanel> : (
          <Box>
            {grouped.map(([period, items], gi) => (
              <Box key={period} className="animate-fade-up" sx={{ animationDelay: `${gi * 100}ms`, mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
                  <Box sx={{ px: 2, py: 0.7, borderRadius: 20, background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)", border: `1px solid ${T.border}` }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: T.primary, letterSpacing: 0.4 }}>{period}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, height: 1, bgcolor: T.border }} />
                  <Typography variant="caption" sx={{ color: T.muted, flexShrink: 0 }}>{items.length} event{items.length !== 1 ? "s" : ""}</Typography>
                </Stack>
                <Box sx={{ position: "relative", pl: { xs: 3.5, sm: 5 } }}>
                  <Box sx={{ position: "absolute", left: { xs: 12, sm: 16 }, top: 16, bottom: 0, width: 2, background: `linear-gradient(${T.border},transparent)`, borderRadius: 2 }} />
                  <Stack spacing={2}>
                    {items.map((item, idx) => {
                      const c = svcColor(item.service);
                      const isAlert = item.status === "Alert";
                      return (
                        <Stack key={item.id} direction="row" spacing={2} className="animate-fade-up" sx={{ animationDelay: `${idx * 50}ms`, position: "relative" }}>
                          <Box sx={{ position: "absolute", left: { xs: -20, sm: -28 }, top: 14, width: 12, height: 12, borderRadius: "50%", bgcolor: isAlert ? T.coral : c.dot, border: `2px solid ${isAlert ? "#FFECE5" : T.surface}`, boxShadow: isAlert ? `0 0 0 3px rgba(249,115,22,0.2)` : `0 0 0 3px rgba(108,92,231,0.1)`, zIndex: 1, flexShrink: 0 }} />
                          <Box sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: isAlert ? "#FFF8F5" : T.surface, border: `1px solid ${isAlert ? "#FDDDD0" : T.border}`, boxShadow: "0 2px 12px rgba(30,27,75,0.05)", transition: "transform 150ms ease,box-shadow 150ms ease", "&:hover": { transform: "translateX(3px)", boxShadow: "0 6px 20px rgba(30,27,75,0.1)" } }}>
                            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1}>
                              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, background: isAlert ? "linear-gradient(135deg,#F97316,#EF4444)" : "linear-gradient(135deg,#6C5CE7,#A855F7)" }}>{getInitials(item.student)}</Avatar>
                                <Typography variant="body2" fontWeight={700} color={T.text}>{item.student}</Typography>
                                <Typography variant="caption" sx={{ color: T.muted, fontFamily: "monospace" }}>{item.usn || "?"}</Typography>
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
                                <ServiceChip service={item.service} />
                                <StatusBadge status={item.status} />
                              </Stack>
                            </Stack>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
                              <Typography variant="body2" sx={{ color: T.text2, fontWeight: 500 }}>{item.action}</Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <AccessTimeRounded sx={{ fontSize: 12, color: T.muted }} />
                                <Typography variant="caption" color={T.muted}>{item.time}</Typography>
                                {item.source === "Demo" && <Chip label="Sample" size="small" sx={{ height: 16, fontSize: 9, bgcolor: "#FEF9C3", color: "#854D0E", ml: 0.5 }} />}
                              </Stack>
                            </Stack>
                          </Box>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              </Box>
            ))}
            <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: T.surface2, border: `1px solid ${T.border}`, textAlign: "center" }}>
              <Typography variant="caption" color={T.muted}>{demoMode ? "Showing sample data - not verified AWS activity" : apiHasRecords ? "Showing AWS API records + sample records" : "API returned no records; showing illustrative samples"}</Typography>
            </Box>
          </Box>
        )}
    </Box>
  );
}

// ─ USAGE ALERTS PAGE ─
function UsageAlertsPage({ visible, loading, demoMode, apiHasRecords, refresh, exportCSV, search, setSearch, compactMode }) {
  const alertsBySvc = useMemo(() => {
    const m = {};
    visible.forEach(x => { m[x.service] = (m[x.service] || 0) + 1; });
    return Object.entries(m).map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count);
  }, [visible]);

  return (
    <Box className="animate-fade-up">
      <Box sx={{ borderRadius: 4, background: "linear-gradient(135deg,#7C2D12 0%,#C2410C 40%,#EA580C 100%)", p: { xs: 2.5, md: 3.5 }, mb: 3, position: "relative", overflow: "hidden", color: "#fff" }}>
        <Box sx={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)", right: -60, top: -80 }} />
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} sx={{ position: "relative", zIndex: 1 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ReportProblemRounded sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: 20, md: 25 }, fontWeight: 800, letterSpacing: -0.4 }}>Usage Alert Centre</Typography>
                <Typography sx={{ fontSize: 12.5, opacity: 0.8 }}>Activity records flagged for faculty review</Typography>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ bgcolor: "rgba(255,255,255,0.12)", px: 3, py: 1.5, borderRadius: 3, border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", backdropFilter: "blur(8px)" }}>
            <Typography sx={{ fontSize: 32, fontWeight: 800 }}>{visible.length}</Typography>
            <Typography sx={{ fontSize: 11, opacity: 0.8, letterSpacing: 0.5 }}>FLAGGED RECORDS</Typography>
          </Box>
        </Stack>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2.5, mb: 3 }}>
        {[
          { label: "Total Alerts", value: visible.length, icon: WarningAmberRounded, g: "linear-gradient(135deg,#F97316,#EF4444)" },
          { label: "Students Affected", value: new Set(visible.map(x => x.student)).size, icon: PeopleAltRounded, g: "linear-gradient(135deg,#8B5CF6,#6C5CE7)" },
          { label: "Services Involved", value: new Set(visible.map(x => x.service)).size, icon: CloudRounded, g: "linear-gradient(135deg,#F59E0B,#F97316)" },
        ].map((m, i) => (
          <Box key={m.label} className="animate-fade-up" sx={{ animationDelay: `${(i + 1) * 100}ms`, borderRadius: 3.5, background: m.g, p: 2.5, color: "#fff", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)", right: -15, top: -20 }} />
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}><m.icon sx={{ fontSize: 19, color: "#fff" }} /></Box>
            <Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{m.value}</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.85, mt: 0.5 }}>{m.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 0.55fr" }, gap: 3, mb: 3 }}>
        <SectionPanel title="Flagged Activity Records" subtitle="Activities marked for review" className="animate-fade-up delay-200" action={<TextField size="small" placeholder="Search alerts..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" sx={{ color: T.muted }} /></InputAdornment> }} sx={{ width: 200 }} />}>
          {loading && !visible.length ? <SkeletonRows count={5} /> : visible.length === 0 ? (
            <EmptyState icon={CheckCircleOutlineRounded} title="No alerts found" subtitle={search ? "No alerts match your search." : "No activity records are currently flagged."} />
          ) : (
            <Stack spacing={0}>
              {visible.map((item, i) => (
                <Box key={item.id} className="alert-entry" sx={{ animationDelay: `${i * 50}ms`, py: compactMode ? 1.25 : 2, px: 0, borderBottom: i < visible.length - 1 ? `1px solid ${T.border2}` : "none" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: "linear-gradient(135deg,#FFF0E5,#FFE0CC)", border: "1px solid #FDDDD0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <WarningAmberRounded sx={{ fontSize: 20, color: T.coral }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: T.text }}>{item.action}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={0.5}>
                          <Typography variant="caption" fontWeight={600} color={T.text2}>{item.student}</Typography>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", color: T.muted, fontSize: 10.5 }}>{item.usn || "?"}</Typography>
                          <AccessTimeRounded sx={{ fontSize: 11, color: T.muted }} />
                          <Typography variant="caption" color={T.muted}>{item.time}</Typography>
                        </Stack>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
                      <ServiceChip service={item.service} />
                      {item.source === "Demo" && <Chip label="Sample" size="small" sx={{ height: 18, fontSize: 9, bgcolor: "#FEF9C3", color: "#854D0E" }} />}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Typography variant="caption" color={T.muted}>{demoMode ? "Sample data only" : apiHasRecords ? "AWS API + sample records" : "Illustrative samples"}</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<DownloadRounded />} onClick={exportCSV} sx={{ borderRadius: 2.5, borderColor: T.border, color: T.primary }}>Export CSV</Button>
              <Button size="small" variant="contained" startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <RefreshRounded />} onClick={refresh} disabled={loading} sx={{ borderRadius: 2.5, background: "linear-gradient(135deg,#6C5CE7,#A855F7)" }}>Refresh</Button>
            </Stack>
          </Box>
        </SectionPanel>
        <Stack spacing={3}>
          <SectionPanel title="Alerts by Service" subtitle="Distribution across AWS services" className="animate-fade-up delay-300">
            {alertsBySvc.length === 0 ? <EmptyState icon={CheckCircleOutlineRounded} title="No alerts" subtitle="No records flagged." /> : (
              <Stack spacing={1.5}>
                {alertsBySvc.map(({ service, count }, i) => {
                  const c = svcColor(service);
                  const pct = visible.length > 0 ? Math.round((count / visible.length) * 100) : 0;
                  return (
                    <Box key={service} className="animate-fade-up" sx={{ animationDelay: `${i * 80}ms` }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c.dot }} />
                          <Typography variant="body2" fontWeight={600} color={T.text2}>{service}</Typography>
                        </Stack>
                        <Typography variant="caption" fontWeight={700} color={T.text}>{count} <Typography component="span" variant="caption" color={T.muted}>({pct}%)</Typography></Typography>
                      </Stack>
                      <Box sx={{ height: 6, bgcolor: T.border2, borderRadius: 10, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: c.dot, borderRadius: 10, transition: "width 600ms cubic-bezier(0.4,0,0.2,1)" }} />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </SectionPanel>
          <SectionPanel className="animate-fade-up delay-400" sx={{ background: "linear-gradient(135deg,#FFF8F0,#FFF0E5)", border: "1px solid #FDDDD0" }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <InfoRounded sx={{ fontSize: 20, color: T.amber, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" fontWeight={700} color={T.text} sx={{ mb: 0.8 }}>About Alert Detection</Typography>
                <Typography variant="caption" sx={{ color: T.text2, lineHeight: 1.8, fontSize: 12 }}>Activities are flagged when they match configured threshold rules: high request counts, multiple object access, or high instance usage. These are indicative rules, not security conclusions.</Typography>
              </Box>
            </Stack>
          </SectionPanel>
        </Stack>
      </Box>
    </Box>
  );
}

// ─ REPORTS PAGE ─
function ReportsPage({ activities, alerts, services, exportCSV }) {
  const studentCount = new Set(activities.map(x => x.student).filter(x => x && x !== "Unknown")).size;
  const serviceCount = new Set(activities.map(x => x.service).filter(x => x && x !== "Unknown")).size;
  const statusData = [
    { name: "Normal", value: activities.length - alerts.length, color: T.emerald },
    { name: "Alerts", value: alerts.length, color: T.coral },
  ];
  const studentSummary = (Array.isArray(students) ? students : [])
    .map(s => {
      const match = activities.filter(a => a.usn === s.usn || a.student === s.name);
      return { ...s, total: match.length, alerts: match.filter(a => a.status === "Alert").length };
    })
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total);
  const trendData = useMemo(() => {
    const hours = {};
    activities.forEach(a => {
      const h = a.time?.split(":")?.[0] || "09";
      const key = `${h}:00`;
      if (!hours[key]) hours[key] = { time: key, normal: 0, alerts: 0 };
      if (a.status === "Alert") hours[key].alerts++;
      else hours[key].normal++;
    });
    return Object.values(hours).sort((a, b) => a.time.localeCompare(b.time));
  }, [activities]);
  return (
    <Box className="animate-fade-up">
      <Box sx={{ borderRadius: 4, background: "linear-gradient(135deg,#1E1B4B 0%,#4C1D95 60%,#6D28D9 100%)", p: { xs: 3, md: 4 }, mb: 3.5, position: "relative", overflow: "hidden", color: "#fff" }}>
        <Box sx={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)", right: -60, top: -80 }} />
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} sx={{ position: "relative", zIndex: 1 }}>
          <Box>
            <Chip label="ANALYTICS WORKSPACE" size="small" sx={{ bgcolor: "rgba(162,155,254,0.2)", color: "#A29BFE", fontWeight: 700, mb: 1.5, border: "1px solid rgba(162,155,254,0.3)" }} />
            <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800, letterSpacing: -0.5, mb: 0.5 }}>CloudLab Reports</Typography>
            <Typography sx={{ fontSize: 13.5, opacity: 0.75, maxWidth: 460 }}>Service usage, activity distribution, trend visualisation, and student-level summaries.</Typography>
          </Box>
          <Button variant="contained" startIcon={<DownloadRounded />} onClick={exportCSV} sx={{ borderRadius: 3, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>Export All Data</Button>
        </Stack>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 2.5, mb: 3.5 }}>
        {[
          { title: "Total Activities", value: activities.length, icon: TimelineRounded, gradient: "linear-gradient(135deg,#6C5CE7,#A855F7)" },
          { title: "Students with Activity", value: studentCount, icon: PeopleAltRounded, gradient: "linear-gradient(135deg,#0FB8A9,#06B6D4)" },
          { title: "Services Used", value: serviceCount, icon: CloudRounded, gradient: "linear-gradient(135deg,#F59E0B,#F97316)" },
          { title: "Alerts Marked", value: alerts.length, icon: WarningAmberRounded, gradient: "linear-gradient(135deg,#F43F5E,#EC4899)" },
        ].map((m, i) => <MetricTile key={m.title} {...m} delay={(i + 1) * 100} />)}
      </Box>
      <SectionPanel title="Activity Over Time" subtitle="Normal vs. flagged activity by hour" className="animate-fade-up delay-200" sx={{ mb: 3 }}>
        {trendData.length > 0 ? (
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 16, left: -10, bottom: 4 }}>
                <defs>
                  <linearGradient id="normG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.teal} stopOpacity={0.4} /><stop offset="100%" stopColor={T.teal} stopOpacity={0.02} /></linearGradient>
                  <linearGradient id="alrtG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.coral} stopOpacity={0.4} /><stop offset="100%" stopColor={T.coral} stopOpacity={0.02} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border2} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <ChartTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }} cursor={{ stroke: T.primary, strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 12, color: T.muted }}>{v}</span>} />
                <Area type="monotone" dataKey="normal" name="Normal" stroke={T.teal} strokeWidth={2.5} fill="url(#normG)" dot={{ r: 4, fill: T.teal, stroke: "#fff", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="alerts" name="Alerts" stroke={T.coral} strokeWidth={2.5} fill="url(#alrtG)" dot={{ r: 4, fill: T.coral, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        ) : <EmptyState title="No trend data" subtitle="Trend data will appear once activity records are loaded." />}
      </SectionPanel>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.3fr 0.7fr" }, gap: 3, mb: 3 }}>
        <SectionPanel title="Service Usage Breakdown" subtitle="Activity count per AWS service" className="animate-fade-up delay-300">
          {services.length > 0 ? (
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={services} margin={{ top: 8, right: 8, left: -15, bottom: 8 }} layout="vertical">
                  <defs><linearGradient id="hbG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#06B6D4" /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border2} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="service" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} width={80} />
                  <ChartTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }} cursor={{ fill: "rgba(108,92,231,0.06)" }} />
                  <Bar dataKey="events" name="Activities" fill="url(#hbG)" radius={[0, 6, 6, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : <EmptyState title="No service data" />}
        </SectionPanel>
        <SectionPanel title="Activity Distribution" subtitle="Normal vs. flagged records" className="animate-fade-up delay-400">
          <Box sx={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="pG1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#06B6D4" /></linearGradient>
                  <linearGradient id="pG2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#F43F5E" /><stop offset="100%" stopColor="#F97316" /></linearGradient>
                </defs>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="47%" innerRadius={56} outerRadius={88} paddingAngle={4} strokeWidth={0}>
                  <Cell fill="url(#pG1)" />
                  <Cell fill="url(#pG2)" />
                </Pie>
                <ChartTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 12, color: T.muted }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </SectionPanel>
      </Box>
      <SectionPanel title="Student Activity Summary" subtitle="Students matched to currently loaded records" className="animate-fade-up delay-500" action={<Button variant="outlined" startIcon={<DownloadRounded />} onClick={exportCSV} size="small" sx={{ borderRadius: 2.5, borderColor: T.border, color: T.primary }}>Export Data</Button>}>
        {studentSummary.length === 0 ? <EmptyState title="No student records" subtitle="Student activity will appear here once records are loaded." /> : (
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", minWidth: 520, borderCollapse: "collapse" }}>
              <Box component="thead">
                <Box component="tr" sx={{ background: "linear-gradient(90deg,#F5F3FF,#F0F2FF)" }}>
                  {["STUDENT", "USN", "TOTAL ACTIVITIES", "ALERTS", "ACTIVITY LEVEL"].map(h => (
                    <Box component="th" key={h} sx={{ textAlign: "left", px: 2.5, py: 1.8, color: T.muted, fontSize: 10, letterSpacing: 1, fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {studentSummary.slice(0, 12).map((s, i) => {
                  const pct = studentSummary[0]?.total > 0 ? Math.round((s.total / studentSummary[0].total) * 100) : 0;
                  return (
                    <Box component="tr" key={s.usn} className="animate-fade-in" sx={{ animationDelay: `${i * 40}ms`, "&:hover": { bgcolor: "#F5F3FF" }, transition: "background 0.15s" }}>
                      <Box component="td" sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${T.border2}` }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, background: "linear-gradient(135deg,#6C5CE7,#A29BFE)" }}>{s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</Avatar>
                          <Typography variant="body2" fontWeight={600} color={T.text}>{s.name}</Typography>
                        </Stack>
                      </Box>
                      <Box component="td" sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${T.border2}` }}><Typography variant="caption" sx={{ fontFamily: "monospace", color: T.muted, fontWeight: 600 }}>{s.usn}</Typography></Box>
                      <Box component="td" sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${T.border2}` }}><Typography variant="body2" fontWeight={700} color={T.text}>{s.total}</Typography></Box>
                      <Box component="td" sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${T.border2}` }}>
                        {s.alerts > 0 ? <Chip label={s.alerts} size="small" sx={{ bgcolor: "#FFF0E5", color: T.coral, fontWeight: 700, fontSize: 11, border: "none" }} /> : <Typography variant="body2" color={T.muted}>-</Typography>}
                      </Box>
                      <Box component="td" sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${T.border2}`, minWidth: 120 }}>
                        <Box sx={{ height: 5, bgcolor: T.border2, borderRadius: 10, overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#6C5CE7,#A29BFE)", borderRadius: 10, transition: "width 600ms ease" }} />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </SectionPanel>
    </Box>
  );
}

// ─ ROOT APP ─
export default function App() {
  const auth = useAuth();
  if (auth.isLoading) {
    return (
      <ThemeProvider theme={appTheme}>
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg,#0f0c29 0%,#302b63 55%,#24243e 100%)", gap: 2 }}>
          <Box className="animate-pulse-glow" sx={{ width: 64, height: 64, borderRadius: 4, background: "linear-gradient(135deg,#6C5CE7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(108,92,231,0.5)" }}>
            <CloudRounded sx={{ fontSize: 32, color: "#fff" }} />
          </Box>
          <CircularProgress size={28} sx={{ color: "#A29BFE" }} />
          <Typography sx={{ color: "rgba(196,192,240,0.7)", fontSize: 14 }}>Connecting to CloudLab Monitor...</Typography>
        </Box>
      </ThemeProvider>
    );
  }
  if (auth.error) {
    return (
      <ThemeProvider theme={appTheme}>
        <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "#0f0c29", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box sx={{ maxWidth: 480, width: "100%" }}>
            <Alert severity="error" sx={{ borderRadius: 3 }}>Authentication error: {auth.error.message}</Alert>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider theme={appTheme}>
      {!auth.isAuthenticated ? <LoginScreen auth={auth} /> : <MainApp auth={auth} />}
    </ThemeProvider>
  );
}

// ─ MAIN APP SHELL ─
function MainApp({ auth }) {
  const t2 = useTheme();
  const mobile = useMediaQuery(t2.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [apiHasRecords, setApiHasRecords] = useState(false);
  const [updated, setUpdated] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("clm-compact") === "true");
  const [darkTopbar, setDarkTopbar] = useState(() => localStorage.getItem("clm-darktopbar") === "true");

  const profile = auth.user?.profile || {};
  const email = String(profile.email || "").trim();
  const cognitoName = humanizeFacultyName(profile);
  const [localDisplayName, setLocalDisplayName] = useState(() => getLocalDisplayName(email));
  const facultyName = localDisplayName || cognitoName;
  const displayGreetingName = facultyName.split(/\s+/)[0] || "Faculty";
  const ini = getInitials(facultyName);

  const updatePreference = (key, setter) => value => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  const handleDisplayNameChange = value => {
    const trimmed = value.trim().replace(/\s+/g, " ");
    localStorage.setItem(`clm-display-name:${email}`, trimmed);
    setLocalDisplayName(trimmed);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`API request failed (${response.status})`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("The API response is not a list.");
      const real = data.map((item, i) => normalize({ ...item, source: "AWS API" }, `aws-${i}`));
      setActivities([...real, ...demo.map(x => ({ ...x }))]);
      setApiHasRecords(real.length > 0);
      setDemoMode(false);
      setApiError("");
    } catch (error) {
      console.error("Could not load AWS activity:", error);
      setActivities(demo);
      setApiHasRecords(false);
      setDemoMode(true);
      setApiError("AWS API unavailable. Displaying illustrative sample activity records.");
    } finally {
      setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setLoading(false);
    }
  }, []);

  // Initial synchronization intentionally updates local state from the remote API.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    setLogoutError("");
    try { await auth.removeUser(); } catch (err) { console.warn("Could not clear local user session:", err); }
    window.location.assign(cognitoLogoutUrl);
  }, [auth]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter(x =>
      [x.student, x.usn, x.service, x.action].some(v => String(v ?? "").toLowerCase().includes(q)) &&
      (filter === "All" || x.status === filter) &&
      (page !== "Usage Alerts" || x.status === "Alert")
    );
  }, [activities, search, filter, page]);

  const alerts = activities.filter(x => x.status === "Alert");
  const services = Object.entries(activities.reduce((acc, x) => { acc[x.service || "Unknown"] = (acc[x.service || "Unknown"] || 0) + 1; return acc; }, {}))
    .map(([service, events]) => ({ service, events })).sort((a, b) => b.events - a.events);

  const exportCSV = () => {
    const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Student", "USN", "AWS Service", "Activity", "Time", "Status", "Source"], ...visible.map(x => [x.student, x.usn, x.service, x.action, x.time, x.status, x.source])];
    const blob = new Blob(["\uFEFF" + rows.map(r => r.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cloudlab-${page.toLowerCase().replace(/\s+/g, "-")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const go = label => { setPage(label); setSearch(""); setFilter(label === "Usage Alerts" ? "Alert" : "All"); setMobileOpen(false); };

  const pageDescriptions = {
    Dashboard: "Monitor student cloud-lab activity, service usage, and events that need attention.",
    "Student Timeline": "Search and review recorded student activity across AWS services.",
    "Usage Alerts": "Activity records flagged for review based on configured threshold rules.",
    Reports: "Service usage analytics, activity distribution, and student-level summaries.",
    "Faculty Profile": "Your account details, interface preferences, and sign-out controls.",
  };

  const sidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1.5, pt: 1, pb: 3 }}>
        <Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: "linear-gradient(135deg,#6C5CE7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(108,92,231,0.5)", flexShrink: 0 }}>
          <CloudRounded sx={{ fontSize: 22, color: "#fff" }} />
        </Box>
        <Box>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.2 }}>CloudLab</Typography>
          <Typography sx={{ color: T.sidebar.muted, fontSize: 9.5, letterSpacing: 1.4, fontWeight: 600 }}>MONITOR</Typography>
        </Box>
      </Stack>
      <Typography sx={{ px: 2, mb: 1, color: T.sidebar.muted, fontSize: 9.5, letterSpacing: 1.6, fontWeight: 700 }}>WORKSPACE</Typography>
      <List disablePadding sx={{ flex: 1 }}>
        {NAV.map(({ label, icon: Icon }) => {
          const active = page === label;
          return (
            <ListItemButton key={label} selected={active} onClick={() => go(label)} sx={{ borderRadius: 2.5, mb: 0.5, mx: 0.5, py: 1.2, px: 1.5, color: active ? "#fff" : T.sidebar.text, position: "relative", overflow: "hidden", transition: "all 180ms ease", "&::before": active ? { content: '""', position: "absolute", left: 0, top: "20%", width: 3, height: "60%", background: "linear-gradient(135deg,#A29BFE,#00CEC9)", borderRadius: "0 3px 3px 0" } : {}, "&.Mui-selected": { bgcolor: T.sidebar.active, "&:hover": { bgcolor: "#362F85" } }, "&:hover:not(.Mui-selected)": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }, "& .MuiListItemIcon-root": { color: "inherit" } }}>
              <ListItemIcon sx={{ minWidth: 38 }}><Icon sx={{ fontSize: 19 }} /></ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 13.5 }} />
              {label === "Usage Alerts" && alerts.length > 0 && <Chip label={alerts.length} size="small" sx={{ bgcolor: T.rose, color: "#fff", fontWeight: 800, height: 20, fontSize: 10, minWidth: 20 }} />}
            </ListItemButton>
          );
        })}
      </List>
      <Divider sx={{ borderColor: T.sidebar.divider, mx: 1, my: 1.5 }} />
      <Box sx={{ px: 2, mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box className={loading ? "animate-blink" : ""} sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: loading ? T.amber : demoMode ? T.amber : apiHasRecords ? T.teal : T.amber, boxShadow: loading ? "none" : `0 0 8px ${apiHasRecords && !demoMode ? T.teal : T.amber}` }} />
          <Typography sx={{ fontSize: 10.5, color: T.sidebar.muted, fontWeight: 600 }}>{loading ? "Connecting..." : demoMode ? "Sample data" : apiHasRecords ? "API connected" : "No API records"}</Typography>
        </Stack>
      </Box>
      <Box onClick={() => go("Faculty Profile")} sx={{ mx: 0.5, p: 1.5, borderRadius: 2.5, cursor: "pointer", border: `1px solid ${T.sidebar.divider}`, transition: "all 150ms ease", "&:hover": { bgcolor: "rgba(255,255,255,0.05)", borderColor: "rgba(162,155,254,0.3)" } }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar sx={{ bgcolor: "rgba(108,92,231,0.3)", color: "#A29BFE", width: 34, height: 34, fontSize: 12, fontWeight: 800, border: "2px solid rgba(162,155,254,0.3)" }}>{ini}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} fontSize={13} noWrap sx={{ color: "#FFFFFF !important", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{facultyName}</Typography>
            <Typography fontSize={10.5} noWrap sx={{ color: "#C4C0F0 !important", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Faculty account</Typography>
          </Box>
          <PersonRounded sx={{ fontSize: 15, color: T.sidebar.muted, flexShrink: 0 }} />
        </Stack>
      </Box>
    </Box>
  );

  const drawerSx = { "& .MuiDrawer-paper": { width: DRAWER_W, boxSizing: "border-box", bgcolor: T.sidebar.bg, border: 0, px: 1.5, py: 2, background: `linear-gradient(180deg,${T.sidebar.bg} 0%,#1a1535 100%)` } };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: T.bg, display: "flex" }}>
      {mobile ? (
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} variant="temporary" ModalProps={{ keepMounted: true }} sx={{ ...drawerSx }}>{sidebarContent}</Drawer>
      ) : (
        <Drawer variant="permanent" sx={{ width: DRAWER_W, flexShrink: 0, ...drawerSx }}>{sidebarContent}</Drawer>
      )}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: darkTopbar ? "rgba(18,16,43,0.96)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${darkTopbar ? T.sidebar.divider : T.border}`, color: darkTopbar ? "#fff" : T.text }}>
          <Toolbar sx={{ minHeight: "68px !important", px: { xs: 1.5, sm: 3 }, gap: 1.5 }}>
            {mobile && <IconButton onClick={() => setMobileOpen(true)} aria-label="Open navigation" size="small" sx={{ mr: 0.5 }}><MenuRounded /></IconButton>}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: darkTopbar ? T.sidebar.muted : T.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, display: { xs: "none", sm: "block" }, mb: 0.2 }}>CLOUDLAB MONITOR</Typography>
              <Typography sx={{ fontSize: { xs: 17, sm: 20 }, fontWeight: 800, color: darkTopbar ? "#fff" : T.text, letterSpacing: -0.3 }} noWrap>{page}</Typography>
            </Box>
            <Chip icon={<CloudRounded sx={{ fontSize: "14px !important" }} />} label={loading ? "Connecting..." : demoMode ? "Sample data" : apiHasRecords ? "API + samples" : "No API records"} size="small" variant="outlined" color={loading ? "default" : demoMode || !apiHasRecords ? "warning" : "success"} sx={{ display: { xs: "none", sm: "inline-flex" }, fontSize: 11 }} />
            <Tooltip title={`${alerts.length} usage alert${alerts.length !== 1 ? "s" : ""}`}>
              <IconButton size="small" onClick={() => go("Usage Alerts")} aria-label="View usage alerts" sx={{ border: `1px solid ${T.border}`, borderRadius: 2, bgcolor: alerts.length > 0 ? "#FFF0E5" : "#fff", display: { xs: "none", sm: "flex" }, position: "relative" }}>
                <NotificationsNoneRounded sx={{ fontSize: 19, color: alerts.length > 0 ? T.coral : T.muted }} />
                {alerts.length > 0 && <Box sx={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", bgcolor: T.rose, border: "1.5px solid #fff" }} />}
              </IconButton>
            </Tooltip>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
              <Tooltip title="Faculty Profile">
                <Avatar onClick={() => go("Faculty Profile")} sx={{ width: 36, height: 36, background: "linear-gradient(135deg,#6C5CE7,#A855F7)", fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "transform 150ms ease,box-shadow 150ms ease", "&:hover": { transform: "scale(1.08)", boxShadow: "0 4px 16px rgba(108,92,231,0.4)" } }}>{ini}</Avatar>
              </Tooltip>
              <Box sx={{ display: { xs: "none", sm: "block" }, maxWidth: { sm: 130, lg: 180 }, minWidth: 0, cursor: "pointer" }} onClick={() => go("Faculty Profile")}>
                <Typography variant="body2" fontWeight={700} noWrap sx={{ color: darkTopbar ? "#fff" : T.text }}>{facultyName}</Typography>
                <Typography variant="caption" sx={{ color: darkTopbar ? T.sidebar.muted : T.muted, display: "block", fontSize: 11 }} noWrap>{email || "Authenticated faculty"}</Typography>
              </Box>
              <Tooltip title="Sign out">
                <Button id="logout-button" size="small" variant="outlined" startIcon={loggingOut ? <CircularProgress size={12} color="inherit" /> : <LogoutRounded sx={{ fontSize: 15 }} />} disabled={loggingOut} onClick={handleLogout} sx={{ borderRadius: 2.5, fontWeight: 600, fontSize: 12.5, color: T.muted, borderColor: T.border, "&:hover": { borderColor: T.rose, color: T.rose, bgcolor: "#FFF1F2" }, minWidth: "auto", px: { xs: 1, sm: 1.5 } }}>
                  <Box component="span" sx={{ display: { xs: "none", sm: "block" } }}>{loggingOut ? "Signing out..." : "Logout"}</Box>
                </Button>
              </Tooltip>
            </Stack>
            <Tooltip title="Refresh activity records">
              <span>
                <IconButton onClick={refresh} disabled={loading} aria-label="Refresh activity records" size="small" sx={{ border: `1px solid ${T.border}`, borderRadius: 2, bgcolor: "#fff" }}>
                  {loading ? <CircularProgress size={17} sx={{ color: T.primary }} /> : <RefreshRounded sx={{ fontSize: 19 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1800, mx: "auto", width: "100%", minWidth: 0 }}>
          {apiError && <Alert severity="warning" className="animate-fade-up" sx={{ mb: 2.5, borderRadius: 3, border: "1px solid #FDE68A" }} action={<IconButton size="small" onClick={() => setApiError("")}><CloseRounded fontSize="small" /></IconButton>}>{apiError}</Alert>}
          <Snackbar open={!!logoutError} autoHideDuration={8000} onClose={() => setLogoutError("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
            <Alert severity="error" onClose={() => setLogoutError("")} sx={{ width: "100%" }}>{logoutError}</Alert>
          </Snackbar>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: T.muted, lineHeight: 1.6 }}>{pageDescriptions[page]}</Typography>
            <Stack direction="row" alignItems="center" spacing={0.7}>
              <AccessTimeRounded sx={{ fontSize: 13, color: T.muted }} />
              <Typography variant="caption" color={T.muted} sx={{ fontSize: 11.5 }}>Last updated: {updated || "Waiting..."}</Typography>
            </Stack>
          </Stack>

          {page === "Dashboard" && <DashboardPage activities={activities} alerts={alerts} services={services} loading={loading} demoMode={demoMode} apiHasRecords={apiHasRecords} refresh={refresh} exportCSV={exportCSV} facultyName={displayGreetingName} go={go} compactMode={compactMode} />}
          {page === "Student Timeline" && <StudentTimelinePage visible={visible} loading={loading} demoMode={demoMode} apiHasRecords={apiHasRecords} exportCSV={exportCSV} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />}
          {page === "Usage Alerts" && <UsageAlertsPage visible={visible} loading={loading} demoMode={demoMode} apiHasRecords={apiHasRecords} refresh={refresh} exportCSV={exportCSV} search={search} setSearch={setSearch} compactMode={compactMode} />}
          {page === "Reports" && <ReportsPage activities={activities} alerts={alerts} services={services} exportCSV={exportCSV} />}
          {page === "Faculty Profile" && <FacultyProfilePage facultyName={facultyName} email={email} initials={ini} auth={auth} handleLogout={handleLogout} loggingOut={loggingOut} compactMode={compactMode} setCompactMode={updatePreference("clm-compact", setCompactMode)} darkTopbar={darkTopbar} setDarkTopbar={updatePreference("clm-darktopbar", setDarkTopbar)} onDisplayNameChange={handleDisplayNameChange} />}

          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" sx={{ mt: 6, py: 2.5, borderTop: `1px solid ${T.border}` }}>
            <Typography variant="caption" color={T.muted}>CloudLab Monitor - AWS student activity monitoring</Typography>
            <Typography variant="caption" color={T.muted}>{demoMode ? "Sample data mode - not verified AWS activity" : apiHasRecords ? "AWS API + clearly identified sample records" : "Illustrative sample records"}</Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
