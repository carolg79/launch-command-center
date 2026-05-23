import { useState, useEffect, useCallback, createContext, useContext } from "react";

// Inject Google Font
if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap";
  link.rel = "stylesheet";
  if (!document.head.querySelector(`link[href="${link.href}"]`)) document.head.appendChild(link);
}

// ─────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────

const DARK = {
  bg: "#080D1A", surface: "#0D1526", surfaceHover: "#111D33",
  border: "#1A2840", borderBright: "#243450",
  textPrimary: "#EFF4FF", textSecondary: "#94A3B8", textMuted: "#475569", textDim: "#2D4264",
  accent: "#2563EB", navBg: "#060B16", inputBg: "#080D1A", preBg: "#080D1A", preText: "#B8CFEA",
  cardShadow: "none",
};

const LIGHT = {
  bg: "#F0F4F9", surface: "#FFFFFF", surfaceHover: "#F8FAFC",
  border: "#E1E8F2", borderBright: "#C8D6E8",
  textPrimary: "#0F172A", textSecondary: "#334155", textMuted: "#64748B", textDim: "#94A3B8",
  accent: "#2563EB", navBg: "#FFFFFF", inputBg: "#F8FAFC", preBg: "#F0F4F9", preText: "#334155",
  cardShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const ThemeCtx = createContext(DARK);
const useC = () => useContext(ThemeCtx);

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const FUNCTIONS_CONFIG = [
  { id: "product",        label: "Product",           description: "Roadmap, build completion, QA, GA readiness" },
  { id: "pmm",            label: "Product Marketing", description: "Messaging, positioning, launch assets, naming" },
  { id: "enablement",     label: "Sales Enablement",  description: "Training, playbooks, battlecards, demo readiness" },
  { id: "demand_gen",     label: "Demand Generation", description: "Campaigns, pipeline generation, launch promotions" },
  { id: "cs",             label: "Customer Success",  description: "CS readiness, onboarding materials, handoff process" },
  { id: "legal",          label: "Legal / Compliance",description: "Contracts, compliance review, regulatory approvals" },
  { id: "pricing",        label: "Pricing",           description: "Pricing model finalized, systems updated, sales trained" },
  { id: "comms",          label: "Comms / PR",        description: "Press, analyst relations, internal comms, social" },
  { id: "revops",         label: "Revenue Operations",description: "CRM setup, reporting, quoting, forecasting readiness" },
  { id: "implementation", label: "Implementation",    description: "Capacity planning, SOW templates, delivery readiness" },
];

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "#64748B", bg: "#64748B15" },
  on_track:    { label: "On Track",    color: "#22C55E", bg: "#22C55E12" },
  at_risk:     { label: "At Risk",     color: "#F59E0B", bg: "#F59E0B12" },
  blocked:     { label: "Blocked",     color: "#EF4444", bg: "#EF444412" },
  complete:    { label: "Complete",    color: "#60A5FA", bg: "#60A5FA12" },
};

const BLOCKER_TYPES = [
  { id: "decision_needed", label: "Decision Needed", color: "#F59E0B" },
  { id: "dependency",      label: "Dependency",      color: "#EF4444" },
  { id: "overdue",         label: "Overdue Task",    color: "#EF4444" },
];

const TASK_SUGGESTIONS = {
  product: "e.g. GA readiness sign-off complete", pmm: "e.g. Messaging framework approved",
  enablement: "e.g. Sales training delivered", demand_gen: "e.g. Campaign assets finalized",
  cs: "e.g. CS onboarding guide published", legal: "e.g. Terms of service updated",
  pricing: "e.g. Pricing tiers locked and in CRM", comms: "e.g. Press release approved",
  revops: "e.g. CRM fields updated for new product", implementation: "e.g. Implementation SOW template ready",
};

const T = { font: "'IBM Plex Sans', system-ui, sans-serif" };

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substr(2, 9);

function parseLocalDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDaysUntilLaunch(launchDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const l = parseLocalDate(launchDate);
  return l ? Math.ceil((l - today) / 86400000) : null;
}

function formatDate(s, opts = {}) {
  const d = parseLocalDate(s);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...opts }) : "—";
}

function calculateRevenueRisk(launch) {
  if (!launch?.launchDate || !launch?.targetRevenueMonth) return null;
  const ld = parseLocalDate(launch.launchDate);
  if (!ld) return null;
  const first = new Date(ld.getTime() + (launch.avgSalesCycleWeeks || 0) * 7 * 86400000);
  const [yr, mo] = launch.targetRevenueMonth.split("-").map(Number);
  const target = new Date(yr, mo - 1, 1);
  const gapDays = Math.ceil((first - target) / 86400000);
  return {
    first, target, gapDays, gapWeeks: Math.ceil(gapDays / 7),
    atRisk: gapDays > 0, nearRisk: gapDays > -14 && gapDays <= 0,
    firstStr: first.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    targetStr: target.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

function rollupWS(tasks) {
  if (!tasks?.length) return "not_started";
  if (tasks.every(t => t.status === "complete")) return "complete";
  if (tasks.some(t => t.status === "blocked"))   return "blocked";
  if (tasks.some(t => t.status === "at_risk"))   return "at_risk";
  if (tasks.some(t => t.status === "on_track"))  return "on_track";
  return "not_started";
}

function getOverallStatus(wss) {
  const en = wss.filter(w => w.enabled);
  if (!en.length) return "not_started";
  const s = en.map(w => rollupWS(w.tasks));
  if (s.every(x => x === "complete")) return "complete";
  if (s.some(x => x === "blocked"))   return "blocked";
  if (s.filter(x => x === "at_risk" || x === "blocked").length >= 2) return "at_risk";
  if (s.some(x => x === "at_risk"))   return "at_risk";
  if (s.some(x => x === "on_track"))  return "on_track";
  return "not_started";
}

function getAllBlockers(wss) {
  const out = [];
  wss.forEach(ws => ws.tasks.forEach(t => {
    if (t.status === "blocked" || t.status === "at_risk")
      out.push({ ...t, wsLabel: ws.functionLabel, wsId: ws.id });
  }));
  return out;
}

function getAllComments(wss) {
  const out = [];
  wss.forEach(ws => ws.tasks.forEach(t => {
    (t.comments || []).forEach(c => out.push({ ...c, taskName: t.name, wsLabel: ws.functionLabel, wsId: ws.id, taskId: t.id }));
  }));
  return out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────

const STORE_KEY = "launch-command-v1";
const store = {
  async get() { try { const v = localStorage.getItem(STORE_KEY); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch {} },
};

// ─────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────

function StatusBadge({ status, size = "sm" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding: size==="sm" ? "3px 8px" : "5px 10px",
      borderRadius:4, fontSize: size==="sm" ? 10 : 12, fontWeight:700, letterSpacing:"0.04em",
      color: cfg.color, backgroundColor: cfg.bg, border:`1px solid ${cfg.color}30`,
      fontFamily:T.font, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", backgroundColor:cfg.color, display:"inline-block", flexShrink:0 }} />
      {cfg.label}
    </span>
  );
}

function Btn({ children, onClick, variant="primary", size="md", disabled, style:sx={} }) {
  const C = useC();
  const v = { primary:{bg:C.accent,fg:"#fff",border:"none"}, secondary:{bg:"transparent",fg:C.textSecondary,border:`1px solid ${C.border}`}, ghost:{bg:"transparent",fg:C.textMuted,border:"none"}, danger:{bg:"transparent",fg:"#EF4444",border:"1px solid #EF444330"} }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{ background:v.bg, color:v.fg, border:v.border, borderRadius:6,
      padding:{sm:"5px 11px",md:"7px 14px",lg:"10px 20px"}[size], fontSize:size==="sm"?11:13,
      fontWeight:700, fontFamily:T.font, cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.45:1, transition:"all .15s", ...sx }}>
      {children}
    </button>
  );
}

function Field({ label, hint, children }) {
  const C = useC();
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>{label}</label>
      {children}
      {hint && <p style={{ margin:"4px 0 0", fontSize:11, color:C.textDim }}>{hint}</p>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type="text", style:sx={} }) {
  const C = useC();
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{ width:"100%", backgroundColor:C.inputBg, border:`1px solid ${C.border}`, borderRadius:6, padding:"8px 11px", color:C.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", ...sx }} />;
}

function Sel({ value, onChange, options }) {
  const C = useC();
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:"100%", backgroundColor:C.inputBg, border:`1px solid ${C.border}`, borderRadius:6, padding:"8px 11px", color:C.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", cursor:"pointer" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Txt({ value, onChange, placeholder, rows=3 }) {
  const C = useC();
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width:"100%", backgroundColor:C.inputBg, border:`1px solid ${C.border}`, borderRadius:6, padding:"8px 11px", color:C.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", boxSizing:"border-box", resize:"vertical" }} />;
}

function ModalBox({ open, onClose, title, children, width="540px" }) {
  const C = useC();
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, width:"100%", maxWidth:width, maxHeight:"88vh", overflowY:"auto", padding:24, boxShadow:C.cardShadow }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:C.textPrimary, fontFamily:T.font }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.textMuted, fontSize:22, cursor:"pointer", lineHeight:1, fontFamily:T.font }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectionHdr({ children, count, color }) {
  const C = useC();
  const col = color || C.textMuted;
  return (
    <div style={{ fontSize:11, fontWeight:700, color:col, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
      {children}
      {count !== undefined && <span style={{ backgroundColor:col+"25", color:col, fontSize:10, padding:"1px 6px", borderRadius:10, fontWeight:700 }}>{count}</span>}
    </div>
  );
}

function Card({ children, style:sx={}, highlight }) {
  const C = useC();
  return (
    <div style={{ backgroundColor:C.surface, border:`1px solid ${highlight ? highlight+"40" : C.border}`, borderRadius:10, padding:"18px 20px", boxShadow:C.cardShadow, ...sx }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// THEME TOGGLE BUTTON
// ─────────────────────────────────────────────

function ThemeToggle({ isDark, onToggle }) {
  const C = useC();
  return (
    <button onClick={onToggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ background: C.border, border:`1px solid ${C.borderBright}`, borderRadius:20, padding:"4px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.textSecondary, fontFamily:T.font, fontWeight:600, transition:"all .2s", flexShrink:0 }}>
      <span style={{ fontSize:14 }}>{isDark ? "☀" : "🌙"}</span>
      <span style={{ fontSize:11 }}>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// SETUP WIZARD
// ─────────────────────────────────────────────

function SetupWizard({ onDone, isDark, onToggleTheme }) {
  const C = useC();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ name:"", description:"", launchDate:"", targetRevenueMonth:"", avgSalesCycleWeeks:"8", targetPipelineAmount:"" });
  const [sel, setSel] = useState(FUNCTIONS_CONFIG.slice(0,9).map(x=>x.id));
  const up = (k,v) => setF(p=>({...p,[k]:v}));
  const toggle = id => setSel(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const finish = () => {
    const workstreams = FUNCTIONS_CONFIG.filter(fc=>sel.includes(fc.id)).map(fc=>({
      id:generateId(), functionId:fc.id, functionLabel:fc.label, functionDescription:fc.description,
      ownerName:"", enabled:true, tasks:[],
    }));
    onDone({ launch:{ id:generateId(), ...f, avgSalesCycleWeeks:+f.avgSalesCycleWeeks||8, targetPipelineAmount:+String(f.targetPipelineAmount).replace(/\D/g,"")||0, createdAt:new Date().toISOString() }, workstreams });
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.font, padding:24 }}>
      {/* Theme toggle top-right */}
      <div style={{ position:"fixed", top:16, right:20 }}>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>

      <div style={{ width:"100%", maxWidth:540 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:38, height:38, borderRadius:9, background:"linear-gradient(135deg,#2563EB,#1D4ED8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:"0 0 20px #2563EB40" }}>⚡</div>
            <span style={{ fontSize:20, fontWeight:800, color:C.textPrimary, letterSpacing:"-0.03em" }}>Launch Command</span>
          </div>
          <div style={{ fontSize:12, color:C.textMuted }}>Tier 1 Launch Readiness · B2B</div>
        </div>

        {/* Step bar */}
        <div style={{ display:"flex", gap:6, marginBottom:28 }}>
          {["Launch Details","Revenue Risk","Functions"].map((s,i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", gap:5, alignItems:"center" }}>
              <div style={{ height:3, width:"100%", borderRadius:2, background:i+1<=step ? C.accent : C.border, transition:"background .3s" }} />
              <span style={{ fontSize:10, color:i+1===step ? C.accent : C.textDim, fontWeight:600, letterSpacing:"0.05em" }}>{s}</span>
            </div>
          ))}
        </div>

        <Card>
          {step===1 && <>
            <div style={{ fontSize:17, fontWeight:800, color:C.textPrimary, marginBottom:4 }}>Set up your launch</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:22 }}>Name it, describe it, pick the date you're working toward.</div>
            <Field label="Launch Name"><Inp value={f.name} onChange={v=>up("name",v)} placeholder="e.g. Enterprise Analytics Module — Q4 Launch" /></Field>
            <Field label="Product / Feature Description" hint="Shows up in exec summaries for leadership context"><Txt value={f.description} onChange={v=>up("description",v)} placeholder="Brief description of what you're launching and why it matters" rows={2} /></Field>
            <Field label="Target Launch Date"><Inp type="date" value={f.launchDate} onChange={v=>up("launchDate",v)} /></Field>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
              <Btn onClick={()=>setStep(2)} disabled={!f.name||!f.launchDate}>Next: Revenue Setup →</Btn>
            </div>
          </>}

          {step===2 && <>
            <div style={{ fontSize:17, fontWeight:800, color:C.textPrimary, marginBottom:4 }}>Revenue risk inputs</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:22 }}>This powers the risk engine. If a launch slip could miss a revenue commitment, you'll see it immediately.</div>
            <Field label="Month Revenue Is Expected" hint="The month leadership is counting on seeing revenue from this launch"><Inp type="month" value={f.targetRevenueMonth} onChange={v=>up("targetRevenueMonth",v)} /></Field>
            <Field label="Average Sales Cycle (weeks)" hint="Weeks from first deal opened post-launch to closed won"><Inp type="number" value={f.avgSalesCycleWeeks} onChange={v=>up("avgSalesCycleWeeks",v)} placeholder="8" /></Field>
            <Field label="Pipeline Target at Launch ($)" hint="Pipeline expected in motion at launch — used to show $ at risk"><Inp value={f.targetPipelineAmount} onChange={v=>up("targetPipelineAmount",v)} placeholder="e.g. 500000" /></Field>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <Btn variant="secondary" onClick={()=>setStep(1)}>← Back</Btn>
              <Btn onClick={()=>setStep(3)} disabled={!f.targetRevenueMonth}>Next: Functions →</Btn>
            </div>
          </>}

          {step===3 && <>
            <div style={{ fontSize:17, fontWeight:800, color:C.textPrimary, marginBottom:4 }}>Which functions are involved?</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:20 }}>Select every team with a role in this launch. You can adjust later.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:22 }}>
              {FUNCTIONS_CONFIG.map(fc => {
                const checked = sel.includes(fc.id);
                return (
                  <div key={fc.id} onClick={()=>toggle(fc.id)} style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 12px", borderRadius:8, border:`1px solid ${checked ? C.accent+"50" : C.border}`, background:checked ? C.accent+"0D" : "transparent", cursor:"pointer", transition:"all .15s" }}>
                    <div style={{ width:17, height:17, borderRadius:4, border:`2px solid ${checked ? C.accent : C.border}`, background:checked ? C.accent : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>
                      {checked && <span style={{ color:"#fff", fontSize:11, fontWeight:700, lineHeight:1 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary }}>{fc.label}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{fc.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <Btn variant="secondary" onClick={()=>setStep(2)}>← Back</Btn>
              <Btn onClick={finish} disabled={!sel.length} size="lg">Open Command Center →</Btn>
            </div>
          </>}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────

function DashboardView({ launch, workstreams }) {
  const C = useC();
  const risk = calculateRevenueRisk(launch);
  const days = getDaysUntilLaunch(launch.launchDate);
  const overall = getOverallStatus(workstreams);
  const blockers = getAllBlockers(workstreams);
  const enabled = workstreams.filter(w=>w.enabled);
  const counts = ["not_started","on_track","at_risk","blocked","complete"].reduce((a,s)=>({...a,[s]:enabled.filter(w=>rollupWS(w.tasks)===s).length}),{});
  const launchLabel = parseLocalDate(launch.launchDate)?.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}) || "—";
  const daysColor = days!==null && days<14 ? "#EF4444" : days!==null && days<30 ? "#F59E0B" : C.textPrimary;

  return (
    <div>
      {risk && (risk.atRisk || risk.nearRisk) && (
        <div style={{ background:risk.atRisk ? "#EF444410" : "#F59E0B10", border:`1px solid ${risk.atRisk ? "#EF444440" : "#F59E0B40"}`, borderRadius:10, padding:"16px 20px", marginBottom:18, display:"flex", alignItems:"flex-start", gap:12 }}>
          <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{risk.atRisk ? "🔴" : "🟡"}</span>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:risk.atRisk ? "#EF4444" : "#F59E0B", letterSpacing:"0.07em", marginBottom:4 }}>{risk.atRisk ? "REVENUE RISK DETECTED" : "REVENUE RISK WARNING"}</div>
            <div style={{ fontSize:13, color:C.textSecondary, lineHeight:1.6 }}>
              {risk.atRisk ? `At the current launch date, with a ${launch.avgSalesCycleWeeks}-week sales cycle, earliest revenue lands ${risk.firstStr} — ${risk.gapWeeks} week${risk.gapWeeks!==1?"s":""} past the ${risk.targetStr} target.`
                : `You're within 2 weeks of the revenue risk threshold. A minor slip could jeopardize the ${risk.targetStr} revenue commitment.`}
              {launch.targetPipelineAmount > 0 && ` $${Number(launch.targetPipelineAmount).toLocaleString()} in pipeline at risk.`}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:18 }}>
        <Card sx={{ gridColumn:"span 2" }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Days to Launch</div>
          <div style={{ fontSize:32, fontWeight:800, color:daysColor, letterSpacing:"-0.04em", lineHeight:1 }}>
            {days===null ? "—" : days<0 ? "Launched" : days===0 ? "TODAY" : `${days}`}
            {days!==null && days>0 && <span style={{ fontSize:16, fontWeight:600, color:C.textMuted, marginLeft:4 }}>days</span>}
          </div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:5 }}>{launchLabel}</div>
        </Card>
        <Card>
          <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Launch Status</div>
          <StatusBadge status={overall} size="md" />
          <div style={{ fontSize:11, color:C.textMuted, marginTop:6 }}>{enabled.length} function{enabled.length!==1?"s":""} tracked</div>
        </Card>
        <Card highlight={risk?.atRisk ? "#EF4444" : undefined}>
          <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Revenue Risk</div>
          <div style={{ fontSize:13, fontWeight:800, color:risk?.atRisk ? "#EF4444" : risk?.nearRisk ? "#F59E0B" : "#22C55E" }}>
            {risk?.atRisk ? "⚠ At Risk" : risk?.nearRisk ? "⚠ Watch" : "✓ On Track"}
          </div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:5 }}>Target: {risk?.targetStr || "—"}</div>
        </Card>
      </div>

      <Card style={{ marginBottom:18 }}>
        <SectionHdr count={enabled.length}>Workstream Health</SectionHdr>
        {!enabled.length ? (
          <div style={{ fontSize:13, color:C.textMuted, textAlign:"center", padding:"24px 0" }}>No functions enabled.</div>
        ) : <>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {enabled.map(ws => {
              const s = rollupWS(ws.tasks); const cfg = STATUS_CONFIG[s];
              return (
                <div key={ws.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 12px", borderRadius:8, background:cfg.bg, border:`1px solid ${cfg.color}30` }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.color, display:"inline-block", flexShrink:0 }} />
                  <span style={{ fontSize:12, fontWeight:600, color:C.textPrimary }}>{ws.functionLabel}</span>
                  <span style={{ fontSize:11, color:cfg.color, fontWeight:600 }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:18, marginTop:16, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
            {Object.entries(counts).filter(([,n])=>n>0).map(([s,n]) => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontSize:20, fontWeight:800, color:STATUS_CONFIG[s].color, lineHeight:1 }}>{n}</span>
                <span style={{ fontSize:11, color:C.textMuted }}>{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
        </>}
      </Card>

      {blockers.length > 0 ? (
        <Card highlight="#EF4444">
          <SectionHdr color="#EF4444" count={blockers.length}>🔴 Active Blockers</SectionHdr>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {blockers.slice(0,6).map(b => (
              <div key={b.id} style={{ display:"flex", gap:12, padding:"12px 14px", borderRadius:8, background:"#EF444408", border:"1px solid #EF444420" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accent+"18", padding:"2px 7px", borderRadius:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{b.wsLabel}</span>
                    <StatusBadge status={b.status} />
                    {b.blockerType && <span style={{ fontSize:10, color:"#F59E0B", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{BLOCKER_TYPES.find(x=>x.id===b.blockerType)?.label}</span>}
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary }}>{b.name}</div>
                  {b.blockerDescription && <div style={{ fontSize:12, color:C.textSecondary, marginTop:3, lineHeight:1.5 }}>{b.blockerDescription}</div>}
                </div>
                {b.owner && <div style={{ fontSize:11, color:C.textMuted, whiteSpace:"nowrap" }}>{b.owner}</div>}
              </div>
            ))}
          </div>
        </Card>
      ) : enabled.some(w=>w.tasks.length>0) ? (
        <div style={{ background:"#22C55E08", border:"1px solid #22C55E25", borderRadius:10, padding:24, textAlign:"center", color:"#22C55E", fontSize:13, fontWeight:700 }}>
          ✓ No active blockers — all workstreams clear
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────
// WORKSTREAMS VIEW
// ─────────────────────────────────────────────

function WorkstreamsView({ workstreams, onUpdate }) {
  const C = useC();
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const [newComment, setNewComment] = useState({ author:"", text:"", tags:[] });
  const upCmt = (k,v) => setNewComment(p=>({...p,[k]:v}));
  const toggleCmtTag = tag => setNewComment(p=>({ ...p, tags:p.tags.includes(tag)?p.tags.filter(t=>t!==tag):[...p.tags,tag] }));
  const activeFunctions = workstreams.filter(w=>w.enabled).map(w=>w.functionLabel);

  const openAdd = wsId => { setForm({ name:"",owner:"",dueDate:"",status:"not_started",blockerType:"",blockerDescription:"",notes:"",comments:[] }); setModal({ wsId, taskId:null }); };
  const openEdit = (wsId,task) => { setForm({...task,blockerType:task.blockerType||"",comments:task.comments||[]}); setModal({ wsId, taskId:task.id }); };

  const save = () => {
    const {wsId,taskId} = modal;
    onUpdate(workstreams.map(ws => {
      if (ws.id!==wsId) return ws;
      const tasks = taskId
        ? ws.tasks.map(t => t.id===taskId ? {...t,...form,blockerType:form.blockerType||null,comments:form.comments||[]} : t)
        : [...ws.tasks, {id:generateId(),...form,blockerType:form.blockerType||null,comments:[],createdAt:new Date().toISOString()}];
      return {...ws, tasks};
    }));
    setModal(null);
  };

  const addComment = () => {
    if (!newComment.text.trim()||!newComment.author.trim()) return;
    const c = { id:generateId(), author:newComment.author.trim(), text:newComment.text.trim(), tags:newComment.tags, createdAt:new Date().toISOString() };
    setForm(p=>({...p, comments:[...(p.comments||[]),c]}));
    setNewComment(p=>({...p, text:"", tags:[]}));
  };

  const del = (wsId,taskId) => { onUpdate(workstreams.map(ws => ws.id!==wsId ? ws : {...ws,tasks:ws.tasks.filter(t=>t.id!==taskId)})); setModal(null); };
  const setOwner = (wsId,ownerName) => onUpdate(workstreams.map(ws => ws.id===wsId ? {...ws,ownerName} : ws));
  const showBlocker = form.status==="blocked"||form.status==="at_risk";

  const inpSm = { backgroundColor:C.inputBg, border:`1px solid ${C.border}`, borderRadius:5, padding:"5px 10px", color:C.textPrimary, fontSize:12, fontFamily:T.font, outline:"none" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {workstreams.filter(w=>w.enabled).map(ws => {
        const st = rollupWS(ws.tasks); const cfg = STATUS_CONFIG[st];
        const isOpen = expanded[ws.id];
        const blk = ws.tasks.filter(t=>t.status==="blocked").length;
        const done = ws.tasks.filter(t=>t.status==="complete").length;

        return (
          <div key={ws.id} style={{ background:C.surface, border:`1px solid ${st==="blocked" ? "#EF444435" : C.border}`, borderRadius:10, overflow:"hidden", boxShadow:C.cardShadow }}>
            <div onClick={()=>setExpanded(p=>({...p,[ws.id]:!p[ws.id]}))} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", cursor:"pointer" }}>
              <div style={{ width:5, height:32, borderRadius:3, background:cfg.color, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{ws.functionLabel}</span>
                  <StatusBadge status={st} />
                  {blk>0 && <span style={{ fontSize:10, color:"#EF4444", fontWeight:700 }}>⚠ {blk} blocked</span>}
                </div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                  {ws.tasks.length===0 ? "No tasks yet" : `${done}/${ws.tasks.length} complete`}
                  {ws.ownerName ? ` · ${ws.ownerName}` : ""}
                </div>
              </div>
              <span style={{ color:C.textMuted, fontSize:14, transform:isOpen?"rotate(180deg)":"none", transition:"transform .2s", flexShrink:0 }}>▾</span>
            </div>

            {isOpen && (
              <div style={{ borderTop:`1px solid ${C.border}`, padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>Function Owner</span>
                  <input value={ws.ownerName} onChange={e=>setOwner(ws.id,e.target.value)} placeholder="Name or team" onClick={e=>e.stopPropagation()} style={{ ...inpSm, flex:1 }} />
                </div>

                {ws.tasks.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 90px 110px 28px", gap:8, paddingBottom:6, borderBottom:`1px solid ${C.border}`, marginBottom:6 }}>
                      {["Task","Owner","Due","Status",""].map(h=>(
                        <div key={h} style={{ fontSize:9, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.1em" }}>{h}</div>
                      ))}
                    </div>
                    {ws.tasks.map(task => {
                      const overdue = task.dueDate && parseLocalDate(task.dueDate)<new Date() && task.status!=="complete";
                      return (
                        <div key={task.id} style={{ display:"grid", gridTemplateColumns:"1fr 110px 90px 110px 28px", gap:8, padding:"8px 0", borderBottom:`1px solid ${C.border}30`, alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:13, color:C.textPrimary, fontWeight:500 }}>
                              {task.name}
                              {overdue && <span style={{ marginLeft:6, fontSize:9, color:"#EF4444", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em" }}>overdue</span>}
                            </div>
                            {task.blockerDescription && <div style={{ fontSize:11, color:"#EF4444", marginTop:2 }}>⚠ {task.blockerDescription}</div>}
                            {(task.comments||[]).length>0 && <div style={{ fontSize:10, color:C.accent, marginTop:2, fontWeight:600 }}>💬 {task.comments.length} note{task.comments.length!==1?"s":""}</div>}
                          </div>
                          <div style={{ fontSize:12, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.owner||"—"}</div>
                          <div style={{ fontSize:12, color:overdue?"#EF4444":C.textMuted }}>{task.dueDate ? formatDate(task.dueDate) : "—"}</div>
                          <StatusBadge status={task.status||"not_started"} />
                          <button onClick={e=>{e.stopPropagation();openEdit(ws.id,task);}} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:13, padding:2, borderRadius:4, fontFamily:T.font }}>✏</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Btn variant="secondary" size="sm" onClick={e=>{e.stopPropagation();openAdd(ws.id);}}>+ Add Task</Btn>
              </div>
            )}
          </div>
        );
      })}

      <ModalBox open={!!modal} onClose={()=>setModal(null)} title={modal?.taskId ? "Edit Task" : "Add Task"}>
        {modal && <>
          <Field label="Task Name"><Inp value={form.name} onChange={v=>up("name",v)} placeholder={TASK_SUGGESTIONS[workstreams.find(w=>w.id===modal.wsId)?.functionId]||"Enter task name"} /></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Task Owner"><Inp value={form.owner} onChange={v=>up("owner",v)} placeholder="Name or role" /></Field>
            <Field label="Due Date"><Inp type="date" value={form.dueDate} onChange={v=>up("dueDate",v)} /></Field>
          </div>
          <Field label="Status"><Sel value={form.status||"not_started"} onChange={v=>up("status",v)} options={Object.entries(STATUS_CONFIG).map(([k,c])=>({value:k,label:c.label}))} /></Field>
          {showBlocker && <>
            <Field label="Blocker Type"><Sel value={form.blockerType||""} onChange={v=>up("blockerType",v)} options={[{value:"",label:"Select type..."},...BLOCKER_TYPES.map(bt=>({value:bt.id,label:bt.label}))]} /></Field>
            <Field label="Blocker Details" hint="What needs to happen to unblock this?"><Txt value={form.blockerDescription} onChange={v=>up("blockerDescription",v)} placeholder="Describe the blocker and what resolution is needed..." rows={2} /></Field>
          </>}
          <Field label="Notes (optional)"><Txt value={form.notes} onChange={v=>up("notes",v)} placeholder="Any additional context..." rows={2} /></Field>

          {/* ── COMMENTS THREAD ── */}
          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:16, paddingTop:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>
              💬 Comments & Notes {(form.comments||[]).length>0 && `(${form.comments.length})`}
            </div>

            {/* Existing comments */}
            {(form.comments||[]).length>0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {(form.comments||[]).map(c=>(
                  <div key={c.id} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>{c.author}</span>
                      <span style={{ fontSize:10, color:C.textMuted }}>{relativeTime(c.createdAt)}</span>
                    </div>
                    <div style={{ fontSize:13, color:C.textSecondary, lineHeight:1.5 }}>{c.text}</div>
                    {c.tags?.length>0 && (
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:7 }}>
                        {c.tags.map(tag=>(
                          <span key={tag} style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accent+"18", padding:"2px 7px", borderRadius:10, border:`1px solid ${C.accent}30` }}>@{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Your Name</div>
                  <input value={newComment.author} onChange={e=>upCmt("author",e.target.value)} placeholder="Enter your name"
                    style={{ width:"100%", backgroundColor:C.inputBg, border:`1px solid ${C.border}`, borderRadius:5, padding:"6px 10px", color:C.textPrimary, fontSize:12, fontFamily:T.font, outline:"none", boxSizing:"border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Tag a Function</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {activeFunctions.slice(0,6).map(fn=>(
                      <span key={fn} onClick={()=>toggleCmtTag(fn)}
                        style={{ fontSize:10, fontWeight:600, cursor:"pointer", padding:"2px 7px", borderRadius:10,
                          color: newComment.tags.includes(fn) ? C.accent : C.textMuted,
                          background: newComment.tags.includes(fn) ? C.accent+"18" : C.border,
                          border:`1px solid ${newComment.tags.includes(fn)?C.accent+"40":C.border}` }}>
                        @{fn}
                      </span>
                    ))}
                    {activeFunctions.slice(6).map(fn=>(
                      <span key={fn} onClick={()=>toggleCmtTag(fn)}
                        style={{ fontSize:10, fontWeight:600, cursor:"pointer", padding:"2px 7px", borderRadius:10,
                          color: newComment.tags.includes(fn) ? C.accent : C.textMuted,
                          background: newComment.tags.includes(fn) ? C.accent+"18" : C.border,
                          border:`1px solid ${newComment.tags.includes(fn)?C.accent+"40":C.border}` }}>
                        @{fn}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <textarea value={newComment.text} onChange={e=>upCmt("text",e.target.value)}
                placeholder="Add a note, question, or flag for another function..."
                rows={2}
                style={{ width:"100%", backgroundColor:C.inputBg, border:`1px solid ${C.border}`, borderRadius:5, padding:"6px 10px", color:C.textPrimary, fontSize:13, fontFamily:T.font, outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:8 }} />
              <Btn size="sm" onClick={addComment} disabled={!newComment.text.trim()||!newComment.author.trim()}>Post Note</Btn>
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:16 }}>
            {modal.taskId ? <Btn variant="danger" size="sm" onClick={()=>del(modal.wsId,modal.taskId)}>Delete Task</Btn> : <div/>}
            <div style={{ display:"flex", gap:8 }}>
              <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
              <Btn onClick={save} disabled={!form.name}>Save Task</Btn>
            </div>
          </div>
        </>}
      </ModalBox>
    </div>
  );
}

// ─────────────────────────────────────────────
// BLOCKERS VIEW
// ─────────────────────────────────────────────

function BlockersView({ workstreams }) {
  const C = useC();
  const all = getAllBlockers(workstreams);
  const g = { decision_needed:all.filter(b=>b.blockerType==="decision_needed"), dependency:all.filter(b=>b.blockerType==="dependency"), overdue:all.filter(b=>b.blockerType==="overdue"), other:all.filter(b=>!b.blockerType) };
  const sections = [
    { key:"decision_needed", label:"Decision Needed — Leadership Action Required", color:"#F59E0B", icon:"🟡" },
    { key:"dependency", label:"Dependency Blockers", color:"#EF4444", icon:"🔴" },
    { key:"overdue", label:"Overdue Tasks", color:"#EF4444", icon:"⏰" },
    { key:"other", label:"Other Blockers", color:"#94A3B8", icon:"⚠" },
  ];

  if (!all.length) return (
    <div style={{ background:C.surface, border:"1px solid #22C55E20", borderRadius:10, padding:48, textAlign:"center", boxShadow:C.cardShadow }}>
      <div style={{ fontSize:36, marginBottom:12 }}>✓</div>
      <div style={{ fontSize:16, fontWeight:800, color:"#22C55E", marginBottom:6 }}>No Active Blockers</div>
      <div style={{ fontSize:13, color:C.textMuted }}>All workstreams are clear. Tasks marked Blocked or At Risk will surface here.</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {sections.map(sec => {
        const items = g[sec.key]; if (!items.length) return null;
        return (
          <Card key={sec.key}>
            <SectionHdr color={sec.color} count={items.length}>{sec.icon} {sec.label}</SectionHdr>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {items.map(item => (
                <div key={item.id} style={{ padding:"14px 16px", borderRadius:8, background:C.bg, border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accent+"18", padding:"2px 7px", borderRadius:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{item.wsLabel}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <div style={{ fontSize:14, fontWeight:600, color:C.textPrimary, marginBottom:4 }}>{item.name}</div>
                      {item.blockerDescription && <div style={{ fontSize:12, color:C.textSecondary, lineHeight:1.6 }}>{item.blockerDescription}</div>}
                      {item.dueDate && <div style={{ fontSize:11, color:C.textMuted, marginTop:6 }}>Due: {formatDate(item.dueDate,{weekday:"short",month:"short",day:"numeric"})}</div>}
                    </div>
                    {item.owner && <div style={{ fontSize:11, color:C.textMuted, background:C.border, padding:"4px 8px", borderRadius:4, whiteSpace:"nowrap", flexShrink:0 }}>{item.owner}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// EXEC SUMMARY VIEW
// ─────────────────────────────────────────────

function ExecSummaryView({ launch, workstreams }) {
  const C = useC();
  const [copied, setCopied] = useState(false);
  const risk = calculateRevenueRisk(launch);
  const overall = getOverallStatus(workstreams);
  const blockers = getAllBlockers(workstreams);
  const days = getDaysUntilLaunch(launch.launchDate);
  const enabled = workstreams.filter(w=>w.enabled);
  const groups = { on_track:[],at_risk:[],blocked:[],complete:[],not_started:[] };
  enabled.forEach(w => groups[rollupWS(w.tasks)].push(w.functionLabel));

  const launchStr = parseLocalDate(launch.launchDate)?.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) || "—";
  const todayStr = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const si = {on_track:"🟢",at_risk:"🟡",blocked:"🔴",complete:"✅",not_started:"⚪"};
  const daysLine = days===null ? "" : days<0 ? "Launch has passed." : days===0 ? "Launch is TODAY." : `${days} days to launch.`;
  const topBlockers = blockers.slice(0,5);
  const decisions = blockers.filter(b=>b.blockerType==="decision_needed");

  const text = [
    "═══════════════════════════════════════",
    "LAUNCH READINESS UPDATE",
    launch.name,
    `Launch Date: ${launchStr}  |  ${daysLine}`,
    `Status as of: ${todayStr}`,
    "═══════════════════════════════════════",
    "",
    ...(launch.description ? ["ABOUT THIS LAUNCH",launch.description,""] : []),
    `OVERALL STATUS: ${(STATUS_CONFIG[overall]?.label||"—").toUpperCase()} ${si[overall]||""}`,
    "",
    `REVENUE RISK: ${risk?.atRisk ? `⚠ AT RISK — Earliest revenue ${risk.firstStr}, ${risk.gapWeeks} week(s) after ${risk.targetStr} target${launch.targetPipelineAmount ? `. $${Number(launch.targetPipelineAmount).toLocaleString()} pipeline at risk.` : "."}` : risk?.nearRisk ? `⚠ WATCH — Within 2 weeks of the revenue risk threshold.` : "✅ On Track — Revenue timeline intact."}`,
    "",
    "WORKSTREAM STATUS:",
    ...(groups.complete.length   ? [`  ✅ Complete:     ${groups.complete.join(", ")}`] : []),
    ...(groups.on_track.length   ? [`  🟢 On Track:     ${groups.on_track.join(", ")}`] : []),
    ...(groups.at_risk.length    ? [`  🟡 At Risk:      ${groups.at_risk.join(", ")}`] : []),
    ...(groups.blocked.length    ? [`  🔴 Blocked:      ${groups.blocked.join(", ")}`] : []),
    ...(groups.not_started.length? [`  ⚪ Not Started:  ${groups.not_started.join(", ")}`] : []),
    "",
    topBlockers.length > 0 ? `ACTIVE BLOCKERS (${topBlockers.length}):` : "BLOCKERS: None ✅",
    ...topBlockers.map((b,i) => [
      `  ${i+1}. [${b.wsLabel}] ${b.name}`,
      b.blockerType ? `     Type: ${BLOCKER_TYPES.find(x=>x.id===b.blockerType)?.label}` : null,
      b.owner ? `     Owner: ${b.owner}` : null,
      b.blockerDescription ? `     → ${b.blockerDescription}` : null,
    ].filter(Boolean).join("\n")),
    "",
    ...(decisions.length ? [`DECISIONS NEEDED FROM LEADERSHIP (${decisions.length}):`, ...decisions.map((d,i)=>`  ${i+1}. ${d.name}${d.blockerDescription ? ` — ${d.blockerDescription}` : ""}`), ""] : []),
    "═══════════════════════════════════════",
    daysLine,
  ].filter(l=>l!==null).join("\n");

  const copy = () => { navigator.clipboard.writeText(text).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2200); }); };

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary, marginBottom:3 }}>Weekly Leadership Update</div>
            <div style={{ fontSize:12, color:C.textMuted }}>Generated from live tracker data. Copy and paste into your email or Slack.</div>
          </div>
          <Btn onClick={copy} variant={copied?"secondary":"primary"} size="sm">{copied ? "✓ Copied!" : "Copy to Clipboard"}</Btn>
        </div>
        <pre style={{ background:C.preBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"20px 24px", color:C.preText, fontSize:12, lineHeight:1.75, fontFamily:"'IBM Plex Mono','Courier New',monospace", overflowX:"auto", margin:0, whiteSpace:"pre-wrap" }}>
          {text}
        </pre>
      </Card>
      <div style={{ fontSize:11, color:C.textMuted, textAlign:"center" }}>Summary reflects the current state of all tracked workstreams and tasks.</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SETTINGS VIEW
// ─────────────────────────────────────────────

function SettingsView({ launch, workstreams, onUpdateLaunch, onUpdateWorkstreams, onReset }) {
  const C = useC();
  const [lf, setLf] = useState({...launch});
  const [saved, setSaved] = useState(false);
  const up = (k,v) => setLf(p=>({...p,[k]:v}));

  const save = () => {
    onUpdateLaunch({...lf, avgSalesCycleWeeks:+lf.avgSalesCycleWeeks||8, targetPipelineAmount:+String(lf.targetPipelineAmount).replace(/\D/g,"")||0});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <Card>
        <SectionHdr>Launch Details</SectionHdr>
        <Field label="Launch Name"><Inp value={lf.name} onChange={v=>up("name",v)} /></Field>
        <Field label="Description"><Txt value={lf.description} onChange={v=>up("description",v)} rows={2} /></Field>
        <Field label="Launch Date"><Inp type="date" value={lf.launchDate} onChange={v=>up("launchDate",v)} /></Field>
        <Field label="Target Revenue Month"><Inp type="month" value={lf.targetRevenueMonth} onChange={v=>up("targetRevenueMonth",v)} /></Field>
        <Field label="Avg Sales Cycle (weeks)"><Inp type="number" value={lf.avgSalesCycleWeeks} onChange={v=>up("avgSalesCycleWeeks",v)} /></Field>
        <Field label="Pipeline Target ($)"><Inp value={lf.targetPipelineAmount} onChange={v=>up("targetPipelineAmount",v)} /></Field>
        <Btn onClick={save}>{saved ? "✓ Saved" : "Save Changes"}</Btn>
      </Card>
      <Card>
        <SectionHdr>Active Functions</SectionHdr>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {workstreams.map(ws => (
            <div key={ws.id} onClick={()=>onUpdateWorkstreams(workstreams.map(w=>w.id===ws.id?{...w,enabled:!w.enabled}:w))}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:`1px solid ${ws.enabled ? C.accent+"40" : C.border}`, background:ws.enabled ? C.accent+"0D" : "transparent", cursor:"pointer" }}>
              <div style={{ width:17, height:17, borderRadius:4, border:`2px solid ${ws.enabled ? C.accent : C.border}`, background:ws.enabled ? C.accent : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {ws.enabled && <span style={{ color:"#fff", fontSize:11, fontWeight:700, lineHeight:1 }}>✓</span>}
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:C.textPrimary }}>{ws.functionLabel}</span>
              <span style={{ fontSize:11, color:C.textMuted, marginLeft:"auto" }}>{ws.tasks.length} task{ws.tasks.length!==1?"s":""}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionHdr color="#EF4444">Danger Zone</SectionHdr>
        <div style={{ fontSize:12, color:C.textMuted, marginBottom:12 }}>This will clear all launch data and return to setup. This cannot be undone.</div>
        <Btn variant="danger" onClick={onReset}>Reset Launch Command</Btn>
      </Card>
    </div>
  );
}


// ─────────────────────────────────────────────
// ACTIVITY VIEW
// ─────────────────────────────────────────────

function ActivityView({ workstreams }) {
  const C = useC();
  const comments = getAllComments(workstreams);

  if (!comments.length) return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:48, textAlign:"center", boxShadow:C.cardShadow }}>
      <div style={{ fontSize:28, marginBottom:10 }}>💬</div>
      <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary, marginBottom:6 }}>No Notes Yet</div>
      <div style={{ fontSize:13, color:C.textMuted }}>Open any task in Workstreams and use the Comments section to add notes, questions, or tag another function.</div>
    </div>
  );

  const tagged = comments.filter(c=>c.tags?.length>0);
  const untagged = comments.filter(c=>!c.tags?.length);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {tagged.length>0 && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px", boxShadow:C.cardShadow }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            🔔 Flagged for a Function
            <span style={{ background:C.accent+"25", color:C.accent, fontSize:10, padding:"1px 6px", borderRadius:10, fontWeight:700 }}>{tagged.length}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {tagged.map(c=>(
              <div key={c.id} style={{ padding:"12px 14px", borderRadius:8, background:C.bg, border:`1px solid ${C.accent}25` }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:C.textSecondary, background:C.border, padding:"2px 7px", borderRadius:3, textTransform:"uppercase", letterSpacing:"0.05em" }}>{c.wsLabel}</span>
                    <span style={{ fontSize:12, color:C.textMuted }}>→</span>
                    <span style={{ fontSize:12, color:C.textSecondary, fontWeight:500 }}>{c.taskName}</span>
                  </div>
                  <span style={{ fontSize:10, color:C.textMuted, whiteSpace:"nowrap", flexShrink:0 }}>{relativeTime(c.createdAt)}</span>
                </div>
                <div style={{ fontSize:13, color:C.textPrimary, lineHeight:1.5, marginBottom:7 }}><strong style={{ color:C.textPrimary }}>{c.author}:</strong> {c.text}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {c.tags.map(tag=>(
                    <span key={tag} style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accent+"18", padding:"2px 8px", borderRadius:10, border:`1px solid ${C.accent}30` }}>@{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {untagged.length>0 && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px", boxShadow:C.cardShadow }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:14 }}>
            All Notes
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {untagged.map(c=>(
              <div key={c.id} style={{ padding:"10px 12px", borderRadius:8, background:C.bg, border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.textPrimary }}>{c.author}</span>
                    <span style={{ fontSize:10, color:C.textMuted }}>on</span>
                    <span style={{ fontSize:11, color:C.textSecondary }}>{c.taskName}</span>
                    <span style={{ fontSize:10, color:C.textDim }}>({c.wsLabel})</span>
                  </div>
                  <span style={{ fontSize:10, color:C.textMuted, whiteSpace:"nowrap", flexShrink:0 }}>{relativeTime(c.createdAt)}</span>
                </div>
                <div style={{ fontSize:13, color:C.textSecondary, lineHeight:1.5 }}>{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────

export default function App() {
  const [appState, setAppState] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    store.get().then(saved => {
      if (saved?.setup) { setAppState(saved); if (saved.isDark !== undefined) setIsDark(saved.isDark); }
      else setAppState({ setup:false });
      setLoading(false);
    });
  }, []);

  const save = useCallback((next) => { setAppState(next); store.set(next); }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      setAppState(s => { if (!s) return s; const ns = {...s, isDark:next}; store.set(ns); return ns; });
      return next;
    });
  }, []);

  const handleSetup = useCallback(({ launch, workstreams }) => { save({ setup:true, launch, workstreams, isDark }); setTab("dashboard"); }, [save, isDark]);
  const handleUpdateWS = useCallback(wss => setAppState(prev => { const n={...prev,workstreams:wss}; store.set(n); return n; }), []);
  const handleUpdateLaunch = useCallback(launch => setAppState(prev => { const n={...prev,launch}; store.set(n); return n; }), []);
  const handleReset = useCallback(() => { store.set(null); setAppState({setup:false}); setTab("dashboard"); }, []);

  const theme = isDark ? DARK : LIGHT;

  if (loading) return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ minHeight:"100vh", background:theme.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.font, color:theme.textMuted, fontSize:13 }}>Loading...</div>
    </ThemeCtx.Provider>
  );

  if (!appState?.setup) return (
    <ThemeCtx.Provider value={theme}>
      <SetupWizard onDone={handleSetup} isDark={isDark} onToggleTheme={toggleTheme} />
    </ThemeCtx.Provider>
  );

  const { launch, workstreams } = appState;
  const overall = getOverallStatus(workstreams);
  const days = getDaysUntilLaunch(launch.launchDate);
  const blkCount = getAllBlockers(workstreams).filter(b=>b.status==="blocked").length;
  const risk = calculateRevenueRisk(launch);
  const daysColor = days!==null && days<14 ? "#EF4444" : days!==null && days<30 ? "#F59E0B" : theme.textSecondary;

  const activityCount = getAllComments(workstreams).filter(c=>c.tags?.length>0).length;

  const tabs = [
    {id:"dashboard",label:"Dashboard"},
    {id:"workstreams",label:"Workstreams"},
    {id:"blockers",label:"Blockers",badge:blkCount||null},
    {id:"activity",label:"Activity",badge:activityCount||null,badgeColor:"#2563EB"},
    {id:"exec",label:"Exec Summary"},
    {id:"settings",label:"Settings"},
  ];

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:T.font, color:theme.textPrimary }}>
        {/* Top Bar */}
        <div style={{ background:theme.navBg, borderBottom:`1px solid ${theme.border}`, padding:"0 24px", position:"sticky", top:0, zIndex:200, boxShadow: isDark ? "none" : "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:14, height:52 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#2563EB,#1D4ED8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, boxShadow:"0 0 14px #2563EB50" }}>⚡</div>
              <span style={{ fontSize:13, fontWeight:800, letterSpacing:"-0.02em" }}>Launch Command</span>
            </div>
            <span style={{ color:theme.border, fontSize:16 }}>|</span>
            <span style={{ fontSize:12, color:theme.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:280 }}>{launch.name}</span>
            <StatusBadge status={overall} />
            {risk?.atRisk && <span style={{ fontSize:10, fontWeight:800, color:"#EF4444", letterSpacing:"0.06em", background:"#EF444415", padding:"3px 8px", borderRadius:4, border:"1px solid #EF444430", whiteSpace:"nowrap" }}>⚠ REVENUE RISK</span>}
            <div style={{ flex:1 }} />
            {/* Theme Toggle */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <div style={{ fontSize:12, fontWeight:700, color:daysColor, background:daysColor+"18", padding:"4px 12px", borderRadius:6, border:`1px solid ${daysColor}30`, whiteSpace:"nowrap" }}>
              {days===null ? "—" : days<0 ? "Launched" : days===0 ? "Launch Day" : `${days}d to launch`}
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ background:theme.navBg, borderBottom:`1px solid ${theme.border}`, padding:"0 24px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"flex" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ background:"none", border:"none", borderBottom:`2px solid ${tab===t.id ? theme.accent : "transparent"}`, padding:"9px 14px", fontSize:12, fontWeight:tab===t.id?700:500, color:tab===t.id ? theme.textPrimary : theme.textMuted, cursor:"pointer", fontFamily:T.font, display:"flex", alignItems:"center", gap:6, transition:"all .15s" }}>
                {t.label}
                {t.badge && <span style={{ background:t.badgeColor||"#EF4444", color:"#fff", fontSize:9, fontWeight:800, padding:"1px 5px", borderRadius:10 }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"22px 24px" }}>
          {tab==="dashboard"   && <DashboardView launch={launch} workstreams={workstreams} />}
          {tab==="workstreams" && <WorkstreamsView workstreams={workstreams} onUpdate={handleUpdateWS} />}
          {tab==="blockers"    && <BlockersView workstreams={workstreams} />}
          {tab==="exec"        && <ExecSummaryView launch={launch} workstreams={workstreams} />}
          {tab==="activity"    && <ActivityView workstreams={workstreams} />}
          {tab==="settings"    && <SettingsView launch={launch} workstreams={workstreams} onUpdateLaunch={handleUpdateLaunch} onUpdateWorkstreams={handleUpdateWS} onReset={handleReset} />}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
