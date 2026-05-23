import { useState, useEffect, useRef } from "react";

if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&family=IBM+Plex+Mono:wght@400;500&display=swap";
  link.rel = "stylesheet";
  if (!document.head.querySelector(`link[href="${link.href}"]`)) document.head.appendChild(link);
}

const DARK  = { bg:"#080D1A", surface:"#0D1526", border:"#1A2840", borderBright:"#243450", textPrimary:"#EFF4FF", textSecondary:"#94A3B8", textMuted:"#475569", textDim:"#2D4264", accent:"#2563EB", navBg:"#060B16", inputBg:"#04080F", preBg:"#080D1A", preText:"#B8CFEA", shadow:"none" };
const LIGHT = { bg:"#F0F4F9", surface:"#FFFFFF", border:"#E1E8F2", borderBright:"#C8D6E8", textPrimary:"#0F172A", textSecondary:"#334155", textMuted:"#64748B", textDim:"#94A3B8", accent:"#2563EB", navBg:"#FFFFFF", inputBg:"#F8FAFC", preBg:"#F0F4F9", preText:"#334155", shadow:"0 1px 4px rgba(0,0,0,0.07)" };
const T = { font:"'IBM Plex Sans', system-ui, sans-serif" };

const STATUS_CONFIG = {
  not_started:{ label:"Not Started", color:"#64748B", bg:"#64748B15" },
  on_track:   { label:"On Track",    color:"#22C55E", bg:"#22C55E12" },
  at_risk:    { label:"At Risk",     color:"#F59E0B", bg:"#F59E0B12" },
  blocked:    { label:"Blocked",     color:"#EF4444", bg:"#EF444412" },
  complete:   { label:"Complete",    color:"#60A5FA", bg:"#60A5FA12" },
};
const BLOCKER_TYPES = [
  { id:"decision_needed", label:"Decision Needed" },
  { id:"dependency",      label:"Dependency" },
  { id:"overdue",         label:"Overdue Task" },
];
const ALL_FUNCTIONS = [
  "Product","Product Marketing","Sales Enablement","Demand Generation",
  "Customer Success","Legal / Compliance","Pricing","Comms / PR",
  "Revenue Operations","Implementation",
];

// ── DEMO SEQUENCE ──────────────────────────────────────────────
// Total ≈ 68 s
const FRAMES = [
  { id:"s1",  type:"setup",      step:1,              duration:6000,  label:"Entering launch details" },
  { id:"s2",  type:"setup",      step:2,              duration:5000,  label:"Setting revenue risk inputs" },
  { id:"s3",  type:"setup",      step:3,              duration:5000,  label:"Selecting functions" },
  { id:"st",  type:"transition",                      duration:1800,  label:"Opening Command Center..." },
  { id:"d1",  type:"app", tab:"dashboard",  wsId:null,         duration:9000,  label:"Launch Overview" },
  { id:"d2",  type:"app", tab:"workstreams",wsId:null,         duration:2500,  label:"All Workstreams" },
  { id:"d3",  type:"app", tab:"workstreams",wsId:"ws_product", duration:5000,  label:"Product — On Track ✓" },
  { id:"d4",  type:"app", tab:"workstreams",wsId:"ws_enable",  duration:6000,  label:"Sales Enablement — At Risk ⚠ · 💬 notes" },
  { id:"d5",  type:"app", tab:"workstreams",wsId:"ws_legal",   duration:5500,  label:"Legal — Blocked 🔴 · 💬 notes" },
  { id:"d6",  type:"app", tab:"blockers",   wsId:null,         duration:8000,  label:"Active Blockers" },
  { id:"d7",  type:"app", tab:"activity",   wsId:null,         duration:9000,  label:"Activity — Cross-team Notes 💬" },
  { id:"d8",  type:"app", tab:"exec",       wsId:null,         duration:9000,  label:"Exec Summary" },
];

// ── DEMO DATA ──────────────────────────────────────────────────
function buildData() {
  const pad = n => String(n).padStart(2,"0");
  const toStr = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const toMo  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
  const add   = (d,n) => new Date(d.getTime()+n*86400000);
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = n => toStr(add(today,n));

  const launch = {
    name:"ProScope Analytics — Q3 Revenue Intelligence Launch",
    description:"New analytics suite for mid-market revenue teams. Replaces manual pipeline reviews with AI-powered deal intelligence.",
    launchDate:toStr(add(today,62)),
    targetRevenueMonth:toMo(add(today,88)),
    avgSalesCycleWeeks:9,
    targetPipelineAmount:1800000,
  };

  const workstreams = [
    { id:"ws_product",   functionLabel:"Product",             ownerName:"Marcus Reid",    enabled:true, tasks:[
      { id:"t1",  name:"Core analytics engine — QA sign-off",           owner:"Marcus Reid",    dueDate:due(-5),  status:"complete",    blockerType:null, blockerDescription:"" },
      { id:"t2",  name:"API documentation finalized",                    owner:"Dev Team",       dueDate:due(-2),  status:"complete",    blockerType:null, blockerDescription:"" },
      { id:"t3",  name:"Beta customer feedback incorporated",            owner:"Marcus Reid",    dueDate:due(14),  status:"on_track",    blockerType:null, blockerDescription:"" },
      { id:"t4",  name:"GA release candidate approved by engineering",   owner:"Dev Team",       dueDate:due(48),  status:"on_track",    blockerType:null, blockerDescription:"" },
    ]},
    { id:"ws_enable",    functionLabel:"Sales Enablement",    ownerName:"Jamie Torres",   enabled:true, tasks:[
      { id:"t5",  name:"Sales training curriculum complete",             owner:"Jamie Torres",   dueDate:due(10),  status:"on_track",    blockerType:null, blockerDescription:"" },
      { id:"t6",  name:"AE training sessions scheduled",                 owner:"Jamie Torres",   dueDate:due(5),   status:"at_risk",     blockerType:"decision_needed", blockerDescription:"No dates confirmed with Sales leadership. 3 weeks behind plan — need VP Sales to approve dates by EOW.",
        comments:[
          { id:"c1", author:"Jamie Torres", text:"VP Sales still hasn't confirmed dates. I've sent 3 follow-ups this week. We can't schedule meaningful training without the demo env either — tagging Product and RevOps.", tags:["Product","Revenue Operations"], createdAt:new Date(Date.now()-7200000).toISOString() },
        ]},
      { id:"t7",  name:"Demo environment loaded with sample data",       owner:"Dev Team",       dueDate:due(20),  status:"at_risk",     blockerType:"dependency",      blockerDescription:"Waiting on Product to provision the sandbox instance." },
      { id:"t8",  name:"Battlecard published in Highspot",               owner:"Jamie Torres",   dueDate:due(35),  status:"not_started", blockerType:null, blockerDescription:"" },
    ]},
    { id:"ws_legal",     functionLabel:"Legal / Compliance",  ownerName:"Sarah Chen",     enabled:true, tasks:[
      { id:"t9",  name:"Data processing addendum updated",               owner:"Sarah Chen",     dueDate:due(-3),  status:"complete",    blockerType:null, blockerDescription:"" },
      { id:"t10", name:"Pricing terms & MSA addendum — CFO sign-off",    owner:"Sarah Chen",     dueDate:due(7),   status:"blocked",     blockerType:"decision_needed", blockerDescription:"Legal needs CFO approval on the revenue-share clause in the enterprise pricing structure. Blocking contract template for sales.",
        comments:[
          { id:"c2", author:"Sarah Chen", text:"This is now a critical path blocker. Sales cannot send a single enterprise contract until this is resolved. Tagging PMM and RevOps — you need to know this impacts your pipeline timing.", tags:["Product Marketing","Revenue Operations"], createdAt:new Date(Date.now()-86400000).toISOString() },
          { id:"c3", author:"Alex Rivera", text:"Confirmed — our launch comms are tied to contracts being ready. If this slips past the 7th it pushes our GA announcement. Escalating to leadership this week.", tags:["Legal / Compliance"], createdAt:new Date(Date.now()-3600000).toISOString() },
        ]},
      { id:"t11", name:"EU data residency compliance review",             owner:"External Counsel",dueDate:due(30), status:"on_track",   blockerType:null, blockerDescription:"" },
    ]},
    { id:"ws_pmm",       functionLabel:"Product Marketing",   ownerName:"Alex Rivera",    enabled:true, tasks:[
      { id:"t12", name:"Positioning & messaging framework approved",      owner:"Alex Rivera",    dueDate:due(-7),  status:"complete",    blockerType:null, blockerDescription:"" },
      { id:"t13", name:"Website product page copy finalized",             owner:"Alex Rivera",    dueDate:due(18),  status:"on_track",    blockerType:null, blockerDescription:"" },
      { id:"t14", name:"Launch deck — all customer tiers",                owner:"Alex Rivera",    dueDate:due(25),  status:"on_track",    blockerType:null, blockerDescription:"" },
      { id:"t15", name:"Competitive battlecard updated",                  owner:"Alex Rivera",    dueDate:due(-1),  status:"complete",    blockerType:null, blockerDescription:"" },
    ]},
    { id:"ws_demandgen", functionLabel:"Demand Generation",   ownerName:"Priya Nair",     enabled:true, tasks:[
      { id:"t16", name:"Launch campaign brief approved",                  owner:"Priya Nair",     dueDate:due(-4),  status:"complete",    blockerType:null, blockerDescription:"" },
      { id:"t17", name:"Email nurture sequence — staging review",         owner:"Priya Nair",     dueDate:due(20),  status:"on_track",    blockerType:null, blockerDescription:"" },
      { id:"t18", name:"Launch webinar registration page live",           owner:"Priya Nair",     dueDate:due(35),  status:"not_started", blockerType:null, blockerDescription:"" },
    ]},
    { id:"ws_pricing",   functionLabel:"Pricing",             ownerName:"Dana Kim",       enabled:true, tasks:[
      { id:"t19", name:"Pricing model — internal alignment complete",     owner:"Dana Kim",       dueDate:due(5),   status:"on_track",    blockerType:null, blockerDescription:"" },
      { id:"t20", name:"Enterprise tier list price approved by VP Sales", owner:"Dana Kim",       dueDate:due(8),   status:"at_risk",     blockerType:"decision_needed", blockerDescription:"Awaiting VP Sales approval on enterprise discount thresholds before CRM can be updated.",
        comments:[
          { id:"c4", author:"Dana Kim", text:"This and the legal blocker are connected — both need VP Sales + CFO in the same room. Tagging Enablement since reps cannot be trained on pricing until this is locked.", tags:["Sales Enablement","Legal / Compliance"], createdAt:new Date(Date.now()-10800000).toISOString() },
        ]},
    ]},
    { id:"ws_comms",     functionLabel:"Comms / PR",          ownerName:"Taylor Brooks",  enabled:true, tasks:[
      { id:"t21", name:"Press release drafted and approved",              owner:"Taylor Brooks",  dueDate:due(-2),  status:"complete",    blockerType:null, blockerDescription:"" },
      { id:"t22", name:"Analyst briefings — Gartner, Forrester",          owner:"Taylor Brooks",  dueDate:due(28),  status:"on_track",    blockerType:null, blockerDescription:"" },
    ]},
    { id:"ws_cs",        functionLabel:"Customer Success",    ownerName:"",               enabled:true, tasks:[] },
  ];

  return { launch, workstreams };
}

// ── UTILITIES ──────────────────────────────────────────────────
const parseDate = s => { if(!s) return null; const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const getDays   = ld => { const t=new Date(); t.setHours(0,0,0,0); const l=parseDate(ld); return l?Math.ceil((l-t)/86400000):null; };
const fmtDate   = (s,o={}) => { const d=parseDate(s); return d?d.toLocaleDateString("en-US",{month:"short",day:"numeric",...o}):"—"; };

function calcRisk(launch) {
  if (!launch?.launchDate||!launch?.targetRevenueMonth) return null;
  const ld=parseDate(launch.launchDate); if(!ld) return null;
  const first=new Date(ld.getTime()+(launch.avgSalesCycleWeeks||0)*7*86400000);
  const [yr,mo]=launch.targetRevenueMonth.split("-").map(Number);
  const target=new Date(yr,mo-1,1);
  const gapDays=Math.ceil((first-target)/86400000);
  return { first, target, gapDays, gapWeeks:Math.ceil(gapDays/7),
    atRisk:gapDays>0, nearRisk:gapDays>-14&&gapDays<=0,
    firstStr:first.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}),
    targetStr:target.toLocaleDateString("en-US",{month:"long",year:"numeric"}) };
}
const rollupWS = tasks => {
  if(!tasks?.length) return "not_started";
  if(tasks.every(t=>t.status==="complete")) return "complete";
  if(tasks.some(t=>t.status==="blocked"))  return "blocked";
  if(tasks.some(t=>t.status==="at_risk"))  return "at_risk";
  if(tasks.some(t=>t.status==="on_track")) return "on_track";
  return "not_started";
};
function overallStatus(wss) {
  const en=wss.filter(w=>w.enabled); if(!en.length) return "not_started";
  const s=en.map(w=>rollupWS(w.tasks));
  if(s.every(x=>x==="complete")) return "complete";
  if(s.some(x=>x==="blocked"))  return "blocked";
  if(s.filter(x=>x==="at_risk"||x==="blocked").length>=2) return "at_risk";
  if(s.some(x=>x==="at_risk"))  return "at_risk";
  if(s.some(x=>x==="on_track")) return "on_track";
  return "not_started";
}
const allBlockers = wss => { const out=[]; wss.forEach(ws=>ws.tasks.forEach(t=>{ if(t.status==="blocked"||t.status==="at_risk") out.push({...t,wsLabel:ws.functionLabel}); })); return out; };

const getAllComments = wss => {
  const out=[];
  wss.forEach(ws=>ws.tasks.forEach(t=>{
    (t.comments||[]).forEach(c=>out.push({...c,taskName:t.name,wsLabel:ws.functionLabel}));
  }));
  return out.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
};

const relativeTime = iso => {
  const diff=(Date.now()-new Date(iso))/1000;
  if(diff<60) return "just now";
  if(diff<3600) return `${Math.floor(diff/60)}m ago`;
  if(diff<86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

// ── SHARED ATOMS ───────────────────────────────────────────────
function Badge({ status }) {
  const cfg=STATUS_CONFIG[status]||STATUS_CONFIG.not_started;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700,letterSpacing:"0.04em",color:cfg.color,backgroundColor:cfg.bg,border:`1px solid ${cfg.color}30`,fontFamily:T.font,whiteSpace:"nowrap" }}>
    <span style={{ width:6,height:6,borderRadius:"50%",backgroundColor:cfg.color,display:"inline-block",flexShrink:0 }}/>
    {cfg.label}
  </span>;
}
const Card = ({ children, style:sx={}, highlight, C }) =>
  <div style={{ backgroundColor:C.surface,border:`1px solid ${highlight?highlight+"40":C.border}`,borderRadius:10,padding:"18px 20px",boxShadow:C.shadow,...sx }}>{children}</div>;

const SectionHdr = ({ children, count, color, C }) => {
  const col=color||C.textMuted;
  return <div style={{ fontSize:11,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
    {children}{count!==undefined&&<span style={{ backgroundColor:col+"25",color:col,fontSize:10,padding:"1px 6px",borderRadius:10,fontWeight:700 }}>{count}</span>}
  </div>;
};

// ── SETUP FRAME COMPONENTS ─────────────────────────────────────

// Animated fake input field
function FakeField({ label, value, active, filled, hint, C }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>{label}</div>
      <div style={{ width:"100%",backgroundColor:C.inputBg,border:`1.5px solid ${active?"#2563EB":filled?C.borderBright:C.border}`,borderRadius:6,padding:"9px 12px",color:filled?C.textPrimary:C.textMuted,fontSize:13,fontFamily:T.font,minHeight:38,boxSizing:"border-box",transition:"border-color .3s",display:"flex",alignItems:"center",position:"relative",boxShadow:active?"0 0 0 3px #2563EB18":"none" }}>
        {filled ? <span>{value}</span> : <span style={{ color:C.textDim,fontStyle:"italic",fontSize:12 }}>—</span>}
        {active && <span style={{ width:2,height:15,background:"#2563EB",display:"inline-block",marginLeft:1,animation:"blink .65s infinite",verticalAlign:"middle" }}/>}
      </div>
      {hint&&<div style={{ fontSize:11,color:C.textDim,marginTop:4 }}>{hint}</div>}
    </div>
  );
}

// Animated checkbox row
function FakeCheckRow({ label, checked, C }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:`1px solid ${checked?C.accent+"50":C.border}`,background:checked?C.accent+"0D":"transparent",transition:"all .3s",marginBottom:6 }}>
      <div style={{ width:17,height:17,borderRadius:4,border:`2px solid ${checked?C.accent:C.border}`,background:checked?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .25s",transform:checked?"scale(1.05)":"scale(1)" }}>
        {checked&&<span style={{ color:"#fff",fontSize:11,fontWeight:700,lineHeight:1 }}>✓</span>}
      </div>
      <span style={{ fontSize:13,fontWeight:600,color:C.textPrimary }}>{label}</span>
    </div>
  );
}

// Step pill row
function StepPills({ current, C }) {
  const steps=["Launch Details","Revenue Risk","Functions"];
  return (
    <div style={{ display:"flex",gap:6,marginBottom:28 }}>
      {steps.map((s,i)=>(
        <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",gap:5,alignItems:"center" }}>
          <div style={{ height:3,width:"100%",borderRadius:2,background:i+1<=current?C.accent:C.border,transition:"background .3s" }}/>
          <span style={{ fontSize:10,color:i+1===current?C.accent:i+1<current?C.accent+"80":C.textDim,fontWeight:600,letterSpacing:"0.05em" }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

// SETUP STEP 1
function SetupStep1({ progress, C }) {
  const NAME = "ProScope Analytics — Q3 Revenue Intelligence Launch";
  const DESC = "New analytics suite for mid-market revenue teams.";
  const DATE_DISPLAY = (() => { const d=new Date(); d.setDate(d.getDate()+62); return d.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}); })();

  // Timeline: 0-0.45 type name | 0.45-0.65 show desc | 0.65-0.85 show date | 0.85+ highlight button
  const nameChars = progress<0.45 ? Math.floor((progress/0.45)*NAME.length) : NAME.length;
  const nameTyping = progress<0.45;
  const showDesc   = progress>0.45;
  const descChars  = showDesc ? Math.min(DESC.length, Math.floor(((progress-0.45)/0.20)*DESC.length)) : 0;
  const descTyping = progress>0.45 && progress<0.65;
  const showDate   = progress>0.65;
  const btnGlow    = progress>0.85;

  return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.font,padding:24 }}>
      <div style={{ width:"100%",maxWidth:540 }}>
        {/* Brand */}
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:10,marginBottom:6 }}>
            <div style={{ width:38,height:38,borderRadius:9,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 20px #2563EB40" }}>⚡</div>
            <span style={{ fontSize:20,fontWeight:800,color:C.textPrimary,letterSpacing:"-0.03em" }}>Launch Command</span>
          </div>
          <div style={{ fontSize:12,color:C.textMuted }}>Tier 1 Launch Readiness · B2B</div>
        </div>
        <StepPills current={1} C={C}/>
        <Card C={C}>
          <div style={{ fontSize:17,fontWeight:800,color:C.textPrimary,marginBottom:4 }}>Set up your launch</div>
          <div style={{ fontSize:12,color:C.textMuted,marginBottom:22 }}>Name it, describe it, pick the date you're working toward.</div>

          <FakeField label="Launch Name" value={NAME.slice(0,nameChars)} active={nameTyping} filled={nameChars>0} C={C}/>
          <FakeField label="Product / Feature Description" value={DESC.slice(0,descChars)} active={descTyping} filled={descChars>0} hint="Shows up in exec summaries for leadership context" C={C}/>
          <FakeField label="Target Launch Date" value={DATE_DISPLAY} active={false} filled={showDate} C={C}/>

          <div style={{ display:"flex",justifyContent:"flex-end",marginTop:10 }}>
            <div style={{ background:btnGlow?C.accent:"transparent",color:btnGlow?"#fff":C.textDim,border:`1px solid ${btnGlow?C.accent:C.border}`,borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:700,fontFamily:T.font,boxShadow:btnGlow?"0 0 16px #2563EB60":"none",transition:"all .4s" }}>
              Next: Revenue Setup →
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// SETUP STEP 2
function SetupStep2({ progress, C }) {
  const pad = n => String(n).padStart(2,"0");
  const revDate = (() => { const d=new Date(); d.setDate(d.getDate()+88); return d.toLocaleDateString("en-US",{month:"long",year:"numeric"}); })();
  const showRev  = progress>0.05;
  const showWks  = progress>0.38;
  const showPipe = progress>0.65;
  const btnGlow  = progress>0.86;

  return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.font,padding:24 }}>
      <div style={{ width:"100%",maxWidth:540 }}>
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:10,marginBottom:6 }}>
            <div style={{ width:38,height:38,borderRadius:9,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 20px #2563EB40" }}>⚡</div>
            <span style={{ fontSize:20,fontWeight:800,color:C.textPrimary,letterSpacing:"-0.03em" }}>Launch Command</span>
          </div>
        </div>
        <StepPills current={2} C={C}/>
        <Card C={C}>
          <div style={{ fontSize:17,fontWeight:800,color:C.textPrimary,marginBottom:4 }}>Revenue risk inputs</div>
          <div style={{ fontSize:12,color:C.textMuted,marginBottom:22 }}>This powers the risk engine. If a launch slip could miss a revenue commitment, you'll see it immediately.</div>

          <FakeField label="Month Revenue Is Expected" value={revDate} active={false} filled={showRev} hint="The month leadership is counting on seeing revenue from this launch" C={C}/>
          <FakeField label="Average Sales Cycle (weeks)" value="9 weeks" active={false} filled={showWks} hint="Weeks from first deal opened post-launch to closed won" C={C}/>
          <FakeField label="Pipeline Target at Launch ($)" value="$1,800,000" active={false} filled={showPipe} hint="Pipeline expected in motion at launch — used to show $ at risk" C={C}/>

          <div style={{ display:"flex",justifyContent:"space-between",marginTop:10 }}>
            <div style={{ background:"transparent",color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:700,fontFamily:T.font }}>← Back</div>
            <div style={{ background:btnGlow?C.accent:"transparent",color:btnGlow?"#fff":C.textDim,border:`1px solid ${btnGlow?C.accent:C.border}`,borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:700,fontFamily:T.font,boxShadow:btnGlow?"0 0 16px #2563EB60":"none",transition:"all .4s" }}>
              Next: Functions →
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// SETUP STEP 3
function SetupStep3({ progress, C }) {
  // Functions check on one by one over 0-0.78, then button glows
  const checkedCount = Math.floor(progress * 9 / 0.78);
  const btnGlow = progress > 0.84;

  return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.font,padding:24 }}>
      <div style={{ width:"100%",maxWidth:540 }}>
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:10,marginBottom:6 }}>
            <div style={{ width:38,height:38,borderRadius:9,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 20px #2563EB40" }}>⚡</div>
            <span style={{ fontSize:20,fontWeight:800,color:C.textPrimary,letterSpacing:"-0.03em" }}>Launch Command</span>
          </div>
        </div>
        <StepPills current={3} C={C}/>
        <Card C={C}>
          <div style={{ fontSize:17,fontWeight:800,color:C.textPrimary,marginBottom:4 }}>Which functions are involved?</div>
          <div style={{ fontSize:12,color:C.textMuted,marginBottom:18 }}>Select every team with a role in this launch. You can adjust later.</div>

          {ALL_FUNCTIONS.map((fn,i) => (
            <FakeCheckRow key={fn} label={fn} checked={i<checkedCount} C={C}/>
          ))}

          <div style={{ display:"flex",justifyContent:"space-between",marginTop:16 }}>
            <div style={{ background:"transparent",color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:700,fontFamily:T.font }}>← Back</div>
            <div style={{ background:btnGlow?C.accent:"transparent",color:btnGlow?"#fff":C.textDim,border:`1px solid ${btnGlow?C.accent:C.border}`,borderRadius:6,padding:"10px 20px",fontSize:14,fontWeight:700,fontFamily:T.font,boxShadow:btnGlow?"0 0 20px #2563EB70":"none",transition:"all .4s" }}>
              Open Command Center →
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// TRANSITION FRAME
function TransitionFrame({ progress, C }) {
  const dots = Math.floor(progress * 4) % 4;
  return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.font }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:64,height:64,borderRadius:14,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:20,boxShadow:"0 0 40px #2563EB50",animation:"pulse2 1.2s ease-in-out infinite" }}>⚡</div>
        <div style={{ fontSize:20,fontWeight:800,color:C.textPrimary,letterSpacing:"-0.02em",marginBottom:8 }}>Launch Command</div>
        <div style={{ fontSize:14,color:C.textMuted }}>
          Opening your Command Center{".".repeat(dots+1)}
        </div>
        <div style={{ marginTop:24,display:"flex",justifyContent:"center",gap:8 }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:C.accent,opacity:Math.sin((progress*6+i*1.2))>0?1:0.2,transition:"opacity .2s" }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── APP VIEWS ──────────────────────────────────────────────────

function Dashboard({ launch, workstreams, C }) {
  const risk=calcRisk(launch); const days=getDays(launch.launchDate);
  const ost=overallStatus(workstreams); const blockers=allBlockers(workstreams);
  const enabled=workstreams.filter(w=>w.enabled);
  const counts=["not_started","on_track","at_risk","blocked","complete"].reduce((a,s)=>({...a,[s]:enabled.filter(w=>rollupWS(w.tasks)===s).length}),{});
  const launchLabel=parseDate(launch.launchDate)?.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})||"—";
  const daysColor=days!==null&&days<14?"#EF4444":days!==null&&days<30?"#F59E0B":C.textPrimary;
  return <div>
    {risk&&(risk.atRisk||risk.nearRisk)&&(
      <div style={{ background:risk.atRisk?"#EF444410":"#F59E0B10",border:`1px solid ${risk.atRisk?"#EF444440":"#F59E0B40"}`,borderRadius:10,padding:"16px 20px",marginBottom:18,display:"flex",alignItems:"flex-start",gap:12 }}>
        <span style={{ fontSize:20,flexShrink:0,marginTop:1 }}>{risk.atRisk?"🔴":"🟡"}</span>
        <div>
          <div style={{ fontSize:12,fontWeight:800,color:risk.atRisk?"#EF4444":"#F59E0B",letterSpacing:"0.07em",marginBottom:4 }}>{risk.atRisk?"REVENUE RISK DETECTED":"REVENUE RISK WARNING"}</div>
          <div style={{ fontSize:13,color:C.textSecondary,lineHeight:1.6 }}>
            {risk.atRisk?`At the current launch date, with a ${launch.avgSalesCycleWeeks}-week sales cycle, earliest revenue lands ${risk.firstStr} — ${risk.gapWeeks} week${risk.gapWeeks!==1?"s":""} past the ${risk.targetStr} commitment.`:`Within 2 weeks of the revenue risk threshold. A slip jeopardizes the ${risk.targetStr} target.`}
            {launch.targetPipelineAmount>0&&` $${Number(launch.targetPipelineAmount).toLocaleString()} in pipeline at risk.`}
          </div>
        </div>
      </div>
    )}
    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:18 }}>
      <Card C={C} style={{ gridColumn:"span 2" }}>
        <div style={{ fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Days to Launch</div>
        <div style={{ fontSize:32,fontWeight:800,color:daysColor,letterSpacing:"-0.04em",lineHeight:1 }}>
          {days===null?"—":days<0?"Launched":days===0?"TODAY":`${days}`}{days!==null&&days>0&&<span style={{ fontSize:16,fontWeight:600,color:C.textMuted,marginLeft:4 }}>days</span>}
        </div>
        <div style={{ fontSize:11,color:C.textMuted,marginTop:5 }}>{launchLabel}</div>
      </Card>
      <Card C={C}><div style={{ fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Launch Status</div><Badge status={ost}/><div style={{ fontSize:11,color:C.textMuted,marginTop:6 }}>{enabled.length} functions tracked</div></Card>
      <Card C={C} highlight={risk?.atRisk?"#EF4444":undefined}><div style={{ fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Revenue Risk</div><div style={{ fontSize:13,fontWeight:800,color:risk?.atRisk?"#EF4444":risk?.nearRisk?"#F59E0B":"#22C55E" }}>{risk?.atRisk?"⚠ At Risk":risk?.nearRisk?"⚠ Watch":"✓ On Track"}</div><div style={{ fontSize:11,color:C.textMuted,marginTop:5 }}>Target: {risk?.targetStr||"—"}</div></Card>
    </div>
    <Card C={C} style={{ marginBottom:18 }}>
      <SectionHdr C={C} count={enabled.length}>Workstream Health</SectionHdr>
      <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
        {enabled.map(ws=>{ const s=rollupWS(ws.tasks); const cfg=STATUS_CONFIG[s];
          return <div key={ws.id} style={{ display:"flex",alignItems:"center",gap:7,padding:"7px 12px",borderRadius:8,background:cfg.bg,border:`1px solid ${cfg.color}30` }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:cfg.color,display:"inline-block",flexShrink:0 }}/><span style={{ fontSize:12,fontWeight:600,color:C.textPrimary }}>{ws.functionLabel}</span><span style={{ fontSize:11,color:cfg.color,fontWeight:600 }}>{cfg.label}</span>
          </div>;})}
      </div>
      <div style={{ display:"flex",gap:18,marginTop:16,paddingTop:14,borderTop:`1px solid ${C.border}` }}>
        {Object.entries(counts).filter(([,n])=>n>0).map(([s,n])=>(
          <div key={s} style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ fontSize:20,fontWeight:800,color:STATUS_CONFIG[s].color,lineHeight:1 }}>{n}</span><span style={{ fontSize:11,color:C.textMuted }}>{STATUS_CONFIG[s].label}</span></div>
        ))}
      </div>
    </Card>
    {blockers.length>0&&<Card C={C} highlight="#EF4444">
      <SectionHdr C={C} color="#EF4444" count={blockers.length}>🔴 Active Blockers</SectionHdr>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {blockers.slice(0,4).map(b=>(
          <div key={b.id} style={{ display:"flex",gap:12,padding:"12px 14px",borderRadius:8,background:"#EF444408",border:"1px solid #EF444420" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap" }}>
                <span style={{ fontSize:10,fontWeight:700,color:C.accent,background:C.accent+"18",padding:"2px 7px",borderRadius:3,textTransform:"uppercase",letterSpacing:"0.06em" }}>{b.wsLabel}</span><Badge status={b.status}/>{b.blockerType&&<span style={{ fontSize:10,color:"#F59E0B",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em" }}>{BLOCKER_TYPES.find(x=>x.id===b.blockerType)?.label}</span>}
              </div>
              <div style={{ fontSize:13,fontWeight:600,color:C.textPrimary }}>{b.name}</div>
              {b.blockerDescription&&<div style={{ fontSize:12,color:C.textSecondary,marginTop:3,lineHeight:1.5 }}>{b.blockerDescription}</div>}
            </div>
            {b.owner&&<div style={{ fontSize:11,color:C.textMuted,whiteSpace:"nowrap" }}>{b.owner}</div>}
          </div>
        ))}
      </div>
    </Card>}
  </div>;
}

function Workstreams({ workstreams, expandedId, C }) {
  const wsRef=useRef({});
  useEffect(()=>{ if(expandedId&&wsRef.current[expandedId]) wsRef.current[expandedId].scrollIntoView({behavior:"smooth",block:"nearest"}); },[expandedId]);
  return <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
    {workstreams.filter(w=>w.enabled).map(ws=>{
      const st=rollupWS(ws.tasks); const cfg=STATUS_CONFIG[st]; const isOpen=expandedId===ws.id;
      const blk=ws.tasks.filter(t=>t.status==="blocked").length; const done=ws.tasks.filter(t=>t.status==="complete").length;
      return <div key={ws.id} ref={el=>wsRef.current[ws.id]=el} style={{ background:C.surface,border:`1px solid ${st==="blocked"?"#EF444435":C.border}`,borderRadius:10,overflow:"hidden",boxShadow:C.shadow }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 18px" }}>
          <div style={{ width:5,height:32,borderRadius:3,background:cfg.color,flexShrink:0 }}/>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}><span style={{ fontSize:13,fontWeight:700,color:C.textPrimary }}>{ws.functionLabel}</span><Badge status={st}/>{blk>0&&<span style={{ fontSize:10,color:"#EF4444",fontWeight:700 }}>⚠ {blk} blocked</span>}</div>
            <div style={{ fontSize:11,color:C.textMuted,marginTop:2 }}>{ws.tasks.length===0?"No tasks yet":`${done}/${ws.tasks.length} complete`}{ws.ownerName?` · ${ws.ownerName}`:""}</div>
          </div>
          <span style={{ color:isOpen?C.accent:C.textMuted,fontSize:14,transform:isOpen?"rotate(180deg)":"none",transition:"transform .3s",flexShrink:0 }}>▾</span>
        </div>
        <div style={{ maxHeight:isOpen?"600px":"0",overflow:"hidden",transition:"max-height .4s ease" }}>
          <div style={{ borderTop:`1px solid ${C.border}`,padding:"14px 18px" }}>
            {ws.tasks.length===0
              ? <div style={{ fontSize:12,color:C.textMuted,padding:"8px 0",fontStyle:"italic" }}>No tasks added yet for this function.</div>
              : <>{[["Task","Owner","Due","Status"],[1,110,90,110]].length&&(
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 110px 90px 110px",gap:8,paddingBottom:6,borderBottom:`1px solid ${C.border}`,marginBottom:6 }}>
                    {["Task","Owner","Due","Status"].map(h=><div key={h} style={{ fontSize:9,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.1em" }}>{h}</div>)}
                  </div>
                )}
                {ws.tasks.map(task=>{ const overdue=task.dueDate&&parseDate(task.dueDate)<new Date()&&task.status!=="complete";
                  return <div key={task.id} style={{ display:"grid",gridTemplateColumns:"1fr 110px 90px 110px",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}30`,alignItems:"center" }}>
                    <div><div style={{ fontSize:13,color:C.textPrimary,fontWeight:500 }}>{task.name}{overdue&&<span style={{ marginLeft:6,fontSize:9,color:"#EF4444",fontWeight:800,textTransform:"uppercase" }}>overdue</span>}</div>{task.blockerDescription&&<div style={{ fontSize:11,color:"#EF4444",marginTop:2 }}>⚠ {task.blockerDescription}</div>}
                    {(task.comments||[]).length>0&&<div style={{ fontSize:10,color:"#2563EB",marginTop:2,fontWeight:600 }}>💬 {task.comments.length} note{task.comments.length!==1?"s":""}</div>}</div>
                    <div style={{ fontSize:12,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{task.owner||"—"}</div>
                    <div style={{ fontSize:12,color:overdue?"#EF4444":C.textMuted }}>{task.dueDate?fmtDate(task.dueDate):"—"}</div>
                    <Badge status={task.status||"not_started"}/>
                  </div>;
                })}
              </>
            }
          </div>
        </div>
      </div>;
    })}
  </div>;
}

function Blockers({ workstreams, C }) {
  const all=allBlockers(workstreams);
  const g={ decision_needed:all.filter(b=>b.blockerType==="decision_needed"), dependency:all.filter(b=>b.blockerType==="dependency"), other:all.filter(b=>!b.blockerType||b.blockerType==="overdue") };
  const sections=[
    { key:"decision_needed", label:"Decision Needed — Leadership Action Required", color:"#F59E0B", icon:"🟡" },
    { key:"dependency",      label:"Dependency Blockers",                          color:"#EF4444", icon:"🔴" },
    { key:"other",           label:"Other At-Risk Items",                          color:"#94A3B8", icon:"⚠" },
  ];
  if(!all.length) return <div style={{ background:C.surface,border:"1px solid #22C55E20",borderRadius:10,padding:48,textAlign:"center" }}><div style={{ fontSize:16,fontWeight:800,color:"#22C55E" }}>✓ No Active Blockers</div></div>;
  return <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
    {sections.map(sec=>{ const items=g[sec.key]; if(!items.length) return null;
      return <Card key={sec.key} C={C}><SectionHdr C={C} color={sec.color} count={items.length}>{sec.icon} {sec.label}</SectionHdr>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {items.map(item=>(
            <div key={item.id} style={{ padding:"14px 16px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:6,flexWrap:"wrap" }}><span style={{ fontSize:10,fontWeight:700,color:C.accent,background:C.accent+"18",padding:"2px 7px",borderRadius:3,textTransform:"uppercase",letterSpacing:"0.06em" }}>{item.wsLabel}</span><Badge status={item.status}/></div>
                  <div style={{ fontSize:14,fontWeight:600,color:C.textPrimary,marginBottom:4 }}>{item.name}</div>
                  {item.blockerDescription&&<div style={{ fontSize:12,color:C.textSecondary,lineHeight:1.6 }}>{item.blockerDescription}</div>}
                </div>
                {item.owner&&<div style={{ fontSize:11,color:C.textMuted,background:C.border,padding:"4px 8px",borderRadius:4,whiteSpace:"nowrap",flexShrink:0 }}>{item.owner}</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>;
    })}
  </div>;
}

function ExecSummary({ launch, workstreams, C }) {
  const [copied,setCopied]=useState(false);
  const risk=calcRisk(launch); const ost=overallStatus(workstreams);
  const blockers=allBlockers(workstreams); const days=getDays(launch.launchDate);
  const enabled=workstreams.filter(w=>w.enabled);
  const groups={on_track:[],at_risk:[],blocked:[],complete:[],not_started:[]};
  enabled.forEach(w=>groups[rollupWS(w.tasks)].push(w.functionLabel));
  const launchStr=parseDate(launch.launchDate)?.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})||"—";
  const todayStr=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const si={on_track:"🟢",at_risk:"🟡",blocked:"🔴",complete:"✅",not_started:"⚪"};
  const daysLine=days===null?"":days<0?"Launch has passed.":days===0?"Launch is TODAY.":`${days} days to launch.`;
  const decisions=blockers.filter(b=>b.blockerType==="decision_needed"); const top=blockers.slice(0,5);
  const text=[
    "═══════════════════════════════════════","LAUNCH READINESS UPDATE",launch.name,
    `Launch Date: ${launchStr}  |  ${daysLine}`,`Status as of: ${todayStr}`,
    "═══════════════════════════════════════","",
    ...(launch.description?["ABOUT THIS LAUNCH",launch.description,""]:[] ),
    `OVERALL STATUS: ${(STATUS_CONFIG[ost]?.label||"—").toUpperCase()} ${si[ost]||""}`, "",
    `REVENUE RISK: ${risk?.atRisk?`⚠ AT RISK — Earliest revenue ${risk.firstStr}, ${risk.gapWeeks} week(s) after ${risk.targetStr} target. $${Number(launch.targetPipelineAmount).toLocaleString()} in pipeline at risk.`:"✅ On Track."}`, "",
    "WORKSTREAM STATUS:",
    ...(groups.complete.length?[`  ✅ Complete:    ${groups.complete.join(", ")}`]:[]),
    ...(groups.on_track.length?[`  🟢 On Track:    ${groups.on_track.join(", ")}`]:[]),
    ...(groups.at_risk.length?[`  🟡 At Risk:     ${groups.at_risk.join(", ")}`]:[]),
    ...(groups.blocked.length?[`  🔴 Blocked:     ${groups.blocked.join(", ")}`]:[]),
    ...(groups.not_started.length?[`  ⚪ Not Started: ${groups.not_started.join(", ")}`]:[]),
    "",
    top.length>0?`ACTIVE BLOCKERS (${top.length}):`:BLOCKERS_NONE="BLOCKERS: None ✅",
    ...top.map((b,i)=>[`  ${i+1}. [${b.wsLabel}] ${b.name}`,b.blockerType?`     Type: ${BLOCKER_TYPES.find(x=>x.id===b.blockerType)?.label}`:null,b.owner?`     Owner: ${b.owner}`:null,b.blockerDescription?`     → ${b.blockerDescription}`:null].filter(Boolean).join("\n")),
    "",
    ...(decisions.length?[`DECISIONS NEEDED (${decisions.length}):`, ...decisions.map((d,i)=>`  ${i+1}. ${d.name}`), ""]: []),
    "═══════════════════════════════════════",daysLine,
  ].filter(l=>l!==null).join("\n");
  let BLOCKERS_NONE;
  const copy=()=>{ navigator.clipboard.writeText(text).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2200); }); };
  return <div><Card C={C} style={{ marginBottom:16 }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
      <div><div style={{ fontSize:14,fontWeight:700,color:C.textPrimary,marginBottom:3 }}>Weekly Leadership Update</div><div style={{ fontSize:12,color:C.textMuted }}>Generated from live tracker data. Copy and paste into your email or Slack.</div></div>
      <button onClick={copy} style={{ background:copied?"transparent":C.accent,color:copied?C.textMuted:"#fff",border:copied?`1px solid ${C.border}`:"none",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,fontFamily:T.font,cursor:"pointer" }}>{copied?"✓ Copied!":"Copy to Clipboard"}</button>
    </div>
    <pre style={{ background:C.preBg,border:`1px solid ${C.border}`,borderRadius:8,padding:"20px 24px",color:C.preText,fontSize:12,lineHeight:1.75,fontFamily:"'IBM Plex Mono','Courier New',monospace",overflowX:"auto",margin:0,whiteSpace:"pre-wrap" }}>{text}</pre>
  </Card></div>;
}


// ── ACTIVITY VIEW ──────────────────────────────────────────────
function ActivityView({ workstreams, C }) {
  const comments = getAllComments(workstreams);
  const tagged   = comments.filter(c=>c.tags?.length>0);
  const untagged = comments.filter(c=>!c.tags?.length);

  if (!comments.length) return (
    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:48,textAlign:"center" }}>
      <div style={{ fontSize:28,marginBottom:10 }}>💬</div>
      <div style={{ fontSize:15,fontWeight:700,color:C.textPrimary,marginBottom:6 }}>No Notes Yet</div>
      <div style={{ fontSize:13,color:C.textMuted }}>Open any task and use the Comments section to add notes or tag another function.</div>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
      {tagged.length>0 && (
        <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"18px 20px",boxShadow:C.shadow }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#2563EB",textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
            🔔 Flagged for a Function
            <span style={{ background:"#2563EB25",color:"#2563EB",fontSize:10,padding:"1px 6px",borderRadius:10,fontWeight:700 }}>{tagged.length}</span>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {tagged.map(c=>(
              <div key={c.id} style={{ padding:"14px 16px",borderRadius:8,background:C.bg,border:`1px solid ${"#2563EB"}25` }}>
                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:6 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:7,flexWrap:"wrap" }}>
                    <span style={{ fontSize:10,fontWeight:700,color:C.textSecondary,background:C.border,padding:"2px 7px",borderRadius:3,textTransform:"uppercase",letterSpacing:"0.05em" }}>{c.wsLabel}</span>
                    <span style={{ fontSize:12,color:C.textMuted }}>→</span>
                    <span style={{ fontSize:12,color:C.textSecondary,fontWeight:500 }}>{c.taskName}</span>
                  </div>
                  <span style={{ fontSize:10,color:C.textMuted,whiteSpace:"nowrap",flexShrink:0 }}>{relativeTime(c.createdAt)}</span>
                </div>
                <div style={{ fontSize:13,color:C.textPrimary,lineHeight:1.6,marginBottom:8 }}>
                  <strong style={{ color:C.textPrimary }}>{c.author}:</strong> {c.text}
                </div>
                <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                  {c.tags.map(tag=>(
                    <span key={tag} style={{ fontSize:10,fontWeight:700,color:"#2563EB",background:"#2563EB18",padding:"2px 8px",borderRadius:10,border:"1px solid #2563EB30" }}>@{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {untagged.length>0 && (
        <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"18px 20px",boxShadow:C.shadow }}>
          <div style={{ fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:14 }}>All Notes</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {untagged.map(c=>(
              <div key={c.id} style={{ padding:"10px 12px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:C.textPrimary }}>{c.author} <span style={{ fontWeight:400,color:C.textMuted }}>on {c.taskName}</span></span>
                  <span style={{ fontSize:10,color:C.textMuted,flexShrink:0 }}>{relativeTime(c.createdAt)}</span>
                </div>
                <div style={{ fontSize:13,color:C.textSecondary,lineHeight:1.5 }}>{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────
const { launch:LAUNCH, workstreams:WORKSTREAMS } = buildData();

export default function Demo() {
  const [frameIdx,  setFrameIdx]  = useState(0);
  const [paused,    setPaused]    = useState(false);
  const [elapsed,   setElapsed]   = useState(0);
  const [isDark,    setIsDark]    = useState(true);
  const timerRef    = useRef(null);
  const tickRef     = useRef(null);
  const startRef    = useRef(Date.now());

  const C     = isDark ? DARK : LIGHT;
  const frame = FRAMES[frameIdx];

  useEffect(() => {
    if (paused) return;
    startRef.current = Date.now();
    setElapsed(0);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFrameIdx(i=>(i+1)%FRAMES.length), frame.duration);
    return () => clearTimeout(timerRef.current);
  }, [frameIdx, paused]);

  useEffect(() => {
    if (paused) { clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => setElapsed(Date.now()-startRef.current), 50);
    return () => clearInterval(tickRef.current);
  }, [frameIdx, paused]);

  const restart = () => { clearTimeout(timerRef.current); clearInterval(tickRef.current); setFrameIdx(0); setPaused(false); setElapsed(0); startRef.current=Date.now(); };
  const togglePause = () => { setPaused(p=>{ if(p){ startRef.current=Date.now()-elapsed; } return !p; }); };
  const jumpTo = i => { clearTimeout(timerRef.current); clearInterval(tickRef.current); setFrameIdx(i); setPaused(false); setElapsed(0); startRef.current=Date.now(); };

  const progress   = Math.min(1, elapsed / frame.duration);
  const framePct   = progress * 100;
  const isSetup    = frame.type==="setup"||frame.type==="transition";
  const days       = getDays(LAUNCH.launchDate);
  const ost        = overallStatus(WORKSTREAMS);
  const daysColor  = days!==null&&days<14?"#EF4444":days!==null&&days<30?"#F59E0B":C.textSecondary;
  const risk       = calcRisk(LAUNCH);

  return (
    <div style={{ minHeight:"100vh",background:C.bg,fontFamily:T.font,color:C.textPrimary }}>

      {/* ── NAV (hidden during setup/transition) ── */}
      {!isSetup && <>
        <div style={{ background:C.navBg,borderBottom:`1px solid ${C.border}`,padding:"0 24px",position:"sticky",top:0,zIndex:200,boxShadow:isDark?"none":"0 1px 6px rgba(0,0,0,0.06)" }}>
          <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:14,height:52 }}>
            <div style={{ display:"flex",alignItems:"center",gap:9,flexShrink:0 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:"0 0 14px #2563EB50" }}>⚡</div>
              <span style={{ fontSize:13,fontWeight:800,letterSpacing:"-0.02em" }}>Launch Command</span>
            </div>
            <span style={{ color:C.border,fontSize:16 }}>|</span>
            <span style={{ fontSize:12,color:C.textSecondary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:320 }}>{LAUNCH.name}</span>
            <Badge status={ost}/>
            {risk?.atRisk&&<span style={{ fontSize:10,fontWeight:800,color:"#EF4444",letterSpacing:"0.06em",background:"#EF444415",padding:"3px 8px",borderRadius:4,border:"1px solid #EF444430",whiteSpace:"nowrap" }}>⚠ REVENUE RISK</span>}
            <div style={{ flex:1 }}/>
            <button onClick={()=>setIsDark(d=>!d)} style={{ background:C.border,border:`1px solid ${C.borderBright}`,borderRadius:20,padding:"4px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.textSecondary,fontFamily:T.font,fontWeight:600 }}>
              <span style={{ fontSize:13 }}>{isDark?"☀":"🌙"}</span>{isDark?"Light":"Dark"}
            </button>
            <div style={{ fontSize:12,fontWeight:700,color:daysColor,background:daysColor+"18",padding:"4px 12px",borderRadius:6,border:`1px solid ${daysColor}30`,whiteSpace:"nowrap" }}>
              {days===null?"—":days<0?"Launched":days===0?"Launch Day":`${days}d to launch`}
            </div>
          </div>
        </div>
        <div style={{ background:C.navBg,borderBottom:`1px solid ${C.border}`,padding:"0 24px" }}>
          <div style={{ maxWidth:1100,margin:"0 auto",display:"flex" }}>
            {["dashboard","workstreams","blockers","activity","exec"].map(t=>{
              const active=frame.tab===t;
              const label={dashboard:"Dashboard",workstreams:"Workstreams",blockers:"Blockers",activity:"Activity",exec:"Exec Summary"}[t];
              const taggedCount = t==="activity" ? getAllComments(WORKSTREAMS).filter(c=>c.tags?.length>0).length : 0;
              return <div key={t} style={{ borderBottom:`2px solid ${active?C.accent:"transparent"}`,padding:"9px 14px",fontSize:12,fontWeight:active?700:500,color:active?C.textPrimary:C.textMuted,fontFamily:T.font,display:"flex",alignItems:"center",gap:6 }}>
                {label}
                {t==="blockers"&&<span style={{ background:"#EF4444",color:"#fff",fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:10 }}>{allBlockers(WORKSTREAMS).filter(b=>b.status==="blocked").length}</span>}
                {t==="activity"&&taggedCount>0&&<span style={{ background:"#2563EB",color:"#fff",fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:10 }}>{taggedCount}</span>}
              </div>;
            })}
          </div>
        </div>
      </>}

      {/* ── DEMO CONTROL BAR ── */}
      <div style={{ background:isDark?"#0A1020":C.border,borderBottom:`1px solid ${C.border}`,padding:"0 24px",position:isSetup?"fixed":"sticky",top:isSetup?0:"auto",zIndex:isSetup?300:100,width:"100%",boxSizing:"border-box" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div style={{ height:3,background:C.border,borderRadius:2,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${framePct}%`,background:C.accent,transition:"width .08s linear",borderRadius:2 }}/>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:14,padding:"7px 0" }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,background:"#F59E0B18",border:"1px solid #F59E0B40",borderRadius:20,padding:"3px 10px",flexShrink:0 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:"#F59E0B",display:"inline-block",animation:"blink .65s infinite" }}/>
              <span style={{ fontSize:10,fontWeight:800,color:"#F59E0B",letterSpacing:"0.08em" }}>DEMO MODE</span>
            </div>
            <div style={{ display:"flex",gap:5,alignItems:"center" }}>
              {FRAMES.map((f,i)=>(
                <div key={i} onClick={()=>jumpTo(i)} title={f.label}
                  style={{ width:i===frameIdx?20:6,height:6,borderRadius:3,background:i===frameIdx?C.accent:i<frameIdx?C.accent+"55":C.border,transition:"all .3s",cursor:"pointer" }}/>
              ))}
            </div>
            <span style={{ fontSize:12,fontWeight:600,color:C.textSecondary,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{frame.label}</span>
            {isSetup&&<button onClick={()=>setIsDark(d=>!d)} style={{ background:C.border,border:"none",borderRadius:20,padding:"3px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:10,color:C.textSecondary,fontFamily:T.font,fontWeight:600 }}>
              <span>{isDark?"☀":"🌙"}</span>{isDark?"Light":"Dark"}
            </button>}
            <div style={{ display:"flex",gap:8,flexShrink:0 }}>
              <button onClick={togglePause} style={{ background:C.border,border:"none",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,color:C.textSecondary,fontFamily:T.font,cursor:"pointer" }}>{paused?"▶ Play":"⏸ Pause"}</button>
              <button onClick={restart}     style={{ background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,color:C.textMuted,fontFamily:T.font,cursor:"pointer" }}>↺ Restart</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {isSetup ? (
        <div style={{ paddingTop:44 }}>
          {frame.type==="setup"&&frame.step===1 && <SetupStep1 progress={progress} C={C}/>}
          {frame.type==="setup"&&frame.step===2 && <SetupStep2 progress={progress} C={C}/>}
          {frame.type==="setup"&&frame.step===3 && <SetupStep3 progress={progress} C={C}/>}
          {frame.type==="transition"             && <TransitionFrame progress={progress} C={C}/>}
        </div>
      ) : (
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"22px 24px" }}>
          {frame.tab==="dashboard"   && <Dashboard   launch={LAUNCH} workstreams={WORKSTREAMS} C={C}/>}
          {frame.tab==="workstreams" && <Workstreams workstreams={WORKSTREAMS} expandedId={frame.wsId} C={C}/>}
          {frame.tab==="blockers"    && <Blockers    workstreams={WORKSTREAMS} C={C}/>}
          {frame.tab==="activity"    && <ActivityView  workstreams={WORKSTREAMS} C={C}/>}
          {frame.tab==="exec"        && <ExecSummary launch={LAUNCH} workstreams={WORKSTREAMS} C={C}/>}
        </div>
      )}

      <style>{`
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse2 { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>
    </div>
  );
}
