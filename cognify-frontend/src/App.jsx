// src/App.jsx — Cognify v2 — Full Sellable Version
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

import { GoogleLogin } from "@react-oauth/google";

import { authAPI, coursesAPI, videosAPI, searchAPI, chatAPI, billingAPI } from "./api";

/* ─── Auth Context ─────────────────────────────────────────────────────────── */
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => JSON.parse(localStorage.getItem("cognify_user") || "null"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("cognify_token");
    if (token) {
      authAPI.me().then(r => { setUser(r.data.user); setReady(true); })
        .catch(() => { localStorage.removeItem("cognify_token"); localStorage.removeItem("cognify_user"); setReady(true); });
    } else setReady(true);
  }, []);
  const login = (token, u) => { localStorage.setItem("cognify_token", token); localStorage.setItem("cognify_user", JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.removeItem("cognify_token"); localStorage.removeItem("cognify_user"); setUser(null); };
  const refreshUser = async () => { try { const r = await authAPI.me(); setUser(r.data.user); localStorage.setItem("cognify_user", JSON.stringify(r.data.user)); } catch {} };
  if (!ready) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#05050e"}}><G/><Spinner size={36} col="#a78bfa"/></div>;
  return <AuthCtx.Provider value={{ user, login, logout, refreshUser }}>{children}</AuthCtx.Provider>;
}

/* ─── Toast Context ────────────────────────────────────────────────────────── */
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ success: m => add(m,"success"), error: m => add(m,"error"), info: m => add(m,"info") }}>
      {children}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:1000,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
        {toasts.map(t => (
          <div key={t.id} className="toast-in" style={{padding:"11px 18px",borderRadius:11,fontSize:13.5,fontWeight:500,
            background: t.type==="success"?"rgba(16,185,129,.95)":t.type==="error"?"rgba(239,68,68,.95)":"rgba(124,58,237,.95)",
            color:"#fff",boxShadow:"0 8px 24px rgba(0,0,0,.4)",backdropFilter:"blur(12px)",maxWidth:320,lineHeight:1.4}}>
            {t.type==="success"?"✓ ":t.type==="error"?"⚠ ":"ℹ "}{t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ─── GLOBAL STYLES ────────────────────────────────────────────────────────── */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Plus Jakarta Sans',sans-serif;background:#05050e;color:#e2e8f0;overflow-x:hidden}
    .sora{font-family:'Sora',sans-serif}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes shimmer{0%{background-position:-700px 0}100%{background-position:700px 0}}
    @keyframes blob{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}50%{border-radius:30% 60% 70% 40%}}
    @keyframes glow{0%,100%{opacity:.3}50%{opacity:.7}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes toastIn{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    .fu{animation:fadeUp .45s ease both}
    .fu1{animation:fadeUp .45s .08s ease both;opacity:0}
    .fu2{animation:fadeUp .45s .16s ease both;opacity:0}
    .fu3{animation:fadeUp .45s .24s ease both;opacity:0}
    .fu4{animation:fadeUp .45s .32s ease both;opacity:0}
    .fi{animation:fadeIn .3s ease both}
    .si{animation:slideIn .3s ease both}
    .su{animation:fadeUp .25s ease both}
    .toast-in{animation:toastIn .3s ease both}
    .blobbing{animation:blob 7s ease-in-out infinite}
    .glowing{animation:glow 3s ease-in-out infinite}
    .floating{animation:float 4s ease-in-out infinite}
    .grad{background:linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .grad2{background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .glass{background:rgba(255,255,255,.05);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.08)}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-thumb{background:#4c1d95;border-radius:6px}
    .inp{width:100%;padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.08);color:#e2e8f0;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;outline:none}
    .inp:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.12);background:rgba(124,58,237,.04)}
    .inp::placeholder{color:rgba(148,163,184,.35)}
    .btn{cursor:pointer;border:none;font-family:'Sora',sans-serif;font-weight:600;transition:all .18s;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;text-decoration:none}
    .btn-p{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:11px 24px;border-radius:10px;font-size:13.5px}
    .btn-p:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(124,58,237,.4)}
    .btn-p:disabled{opacity:.6;cursor:not-allowed}
    .btn-gold{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:11px 24px;border-radius:10px;font-size:13.5px}
    .btn-gold:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(245,158,11,.35)}
    .btn-s{background:rgba(124,58,237,.1);color:#a78bfa;border:1.5px solid rgba(124,58,237,.2);padding:9px 18px;border-radius:10px;font-size:13px}
    .btn-s:hover{background:rgba(124,58,237,.18)}
    .btn-g{background:transparent;color:#94a3b8;padding:7px 14px;border-radius:8px;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif}
    .btn-g:hover{background:rgba(255,255,255,.06);color:#e2e8f0}
    .btn-sm{padding:6px 13px;font-size:12px;border-radius:8px}
    .btn-xs{padding:5px 10px;font-size:11px;border-radius:7px}
    .btn-block{width:100%}
    .btn-google{background:#fff;color:#1f2937;border:1.5px solid rgba(0,0,0,.12);padding:10px 18px;border-radius:10px;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600}
    .btn-google:hover{background:#f9fafb;box-shadow:0 4px 12px rgba(0,0,0,.1)}
    .tab-bar{display:flex;gap:3px;background:rgba(255,255,255,.04);border-radius:10px;padding:3px}
    .tab{padding:7px 16px;border-radius:7px;font-family:'Sora',sans-serif;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s;color:#64748b;border:none;background:transparent;white-space:nowrap}
    .tab.on{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff}
    .stab{padding:5px 12px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;color:#64748b;border:none;background:transparent;transition:all .18s;font-family:'Plus Jakarta Sans',sans-serif}
    .stab.on{background:rgba(124,58,237,.13);color:#a78bfa}
    .card{background:#0b0b1e;border:1px solid rgba(255,255,255,.07);border-radius:14px;transition:all .22s}
    .card:hover{border-color:rgba(124,58,237,.2);transform:translateY(-2px)}
    .card-glow:hover{box-shadow:0 12px 32px rgba(124,58,237,.12)}
    .card-static{background:#0b0b1e;border:1px solid rgba(255,255,255,.07);border-radius:14px}
    .prog{height:4px;background:rgba(255,255,255,.07);border-radius:100px;overflow:hidden}
    .prog-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#06b6d4);border-radius:100px;transition:width .6s ease}
    .qopt{width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);cursor:pointer;transition:all .16s;text-align:left;color:#cbd5e1;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif}
    .qopt:hover:not(:disabled){border-color:#7c3aed;background:rgba(124,58,237,.07)}
    .msg-u{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:10px 13px;border-radius:13px 13px 3px 13px;font-size:13px;max-width:82%;margin-left:auto;line-height:1.5}
    .msg-a{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:#cbd5e1;padding:10px 13px;border-radius:13px 13px 13px 3px;font-size:13px;max-width:88%;line-height:1.5}
    .shim{background:linear-gradient(90deg,#111128 25%,#1c1c3a 50%,#111128 75%);background-size:700px 100%;animation:shimmer 1.4s infinite;border-radius:9px}
    .mod-item{padding:9px 12px;border-radius:9px;cursor:pointer;transition:all .16s;border:1px solid transparent;display:flex;align-items:center;gap:9px}
    .mod-item:hover{background:rgba(255,255,255,.04)}
    .mod-item.on{background:rgba(124,58,237,.09);border-color:rgba(124,58,237,.2)}
    .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;font-family:'Sora',sans-serif}
    .bv{background:rgba(124,58,237,.16);color:#c084fc;border:1px solid rgba(124,58,237,.25)}
    .bg{background:rgba(16,185,129,.12);color:#34d399;border:1px solid rgba(16,185,129,.22)}
    .bc{background:rgba(6,182,212,.12);color:#22d3ee;border:1px solid rgba(6,182,212,.22)}
    .ba{background:rgba(245,158,11,.12);color:#fbbf24;border:1px solid rgba(245,158,11,.22)}
    .br{background:rgba(239,68,68,.12);color:#fca5a5;border:1px solid rgba(239,68,68,.22)}
    .bg-gold{background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(239,68,68,.1));color:#fbbf24;border:1px solid rgba(245,158,11,.3)}
    .lock-overlay{position:absolute;inset:0;background:rgba(5,5,14,.88);border-radius:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8;backdrop-filter:blur(4px);z-index:10}
    @media(max-width:768px){.desk{display:none!important}}
    @media(min-width:769px){.mob-only{display:none!important}}
    .page-enter{animation:fadeUp .35s ease both}
  `}</style>
);

/* ─── Reusable UI ──────────────────────────────────────────────────────────── */
const Spinner = ({ size=16, col="#a78bfa" }) => (
  <div style={{width:size,height:size,border:`2px solid rgba(255,255,255,.09)`,borderTopColor:col,borderRadius:"50%",animation:"spin .85s linear infinite",flexShrink:0}}/>
);
const Skel = ({ rows=4 }) => (
  <div style={{display:"flex",flexDirection:"column",gap:11,padding:"4px 0"}}>
    {Array.from({length:rows}).map((_,i)=><div key={i} className="shim" style={{height:i===0?60:16,width:i%3===2?"65%":"100%"}}/>)}
  </div>
);
const gradeInfo = (p) => {
  if(p>=90) return {grade:"A+",label:"Outstanding",color:"#34d399",bg:"rgba(16,185,129,.12)"};
  if(p>=80) return {grade:"A", label:"Excellent",  color:"#34d399",bg:"rgba(16,185,129,.1)"};
  if(p>=70) return {grade:"B", label:"Good",       color:"#60a5fa",bg:"rgba(37,99,235,.1)"};
  if(p>=60) return {grade:"C", label:"Average",    color:"#fbbf24",bg:"rgba(245,158,11,.1)"};
  if(p>=50) return {grade:"D", label:"Needs Work", color:"#f97316",bg:"rgba(249,115,22,.1)"};
  return          {grade:"F", label:"Try Again",  color:"#fca5a5",bg:"rgba(239,68,68,.1)"};
};
const getVideoId = (s) => {
  if(!s) return null;
  if(/^[a-zA-Z0-9_-]{11}$/.test(s.trim())) return s.trim();
  const m = s.match(/(?:[?&]v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1]||null;
};

/* ─── Upgrade Banner ───────────────────────────────────────────────────────── */
const UpgradeBanner = ({ message, onUpgrade }) => (
  <div style={{padding:"14px 18px",borderRadius:12,background:"linear-gradient(135deg,rgba(245,158,11,.1),rgba(239,68,68,.08))",border:"1px solid rgba(245,158,11,.25)",display:"flex",alignItems:"center",gap:13,flexWrap:"wrap"}}>
    <div style={{fontSize:22}}>⚡</div>
    <div style={{flex:1,minWidth:0}}>
      <div className="sora" style={{fontSize:13,fontWeight:700,color:"#fbbf24",marginBottom:2}}>Upgrade to Pro</div>
      <div style={{fontSize:12,color:"#94a3b8"}}>{message}</div>
    </div>
    <button className="btn btn-gold btn-sm" onClick={onUpgrade}>Upgrade ↗</button>
  </div>
);

/* ─── Lock Overlay ─────────────────────────────────────────────────────────── */
const LockOverlay = ({ onUpgrade }) => (
  <div className="lock-overlay">
    <div style={{fontSize:32}}>🔒</div>
    <div className="sora" style={{fontSize:14,color:"#e2e8f0",fontWeight:600}}>Pro Feature</div>
    <button className="btn btn-gold btn-sm" onClick={onUpgrade}>Unlock with Pro →</button>
  </div>
);

/* ─── Notes Panel ──────────────────────────────────────────────────────────── */
const NotesPanel = ({ notes }) => {
  if(!notes) return <Skel rows={6}/>;
  const SH = ({icon,label,col}) => <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:9}}><span>{icon}</span><span className="sora" style={{fontSize:11,color:col,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>{label}</span></div>;
  return (
    <div className="fi" style={{display:"flex",flexDirection:"column",gap:20}}>
      <section><SH icon="📖" label="Summary" col="#7c3aed"/><p style={{color:"#94a3b8",fontSize:13.5,lineHeight:1.8}}>{notes.summary}</p></section>
      {notes.keyConcepts?.length>0&&<section><SH icon="🔑" label="Key Concepts" col="#06b6d4"/>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {notes.keyConcepts.map((c,i)=><div key={i} style={{padding:"9px 13px",background:"rgba(6,182,212,.05)",borderRadius:9,border:"1px solid rgba(6,182,212,.12)"}}>
            <span className="sora" style={{fontSize:12.5,color:"#38bdf8",fontWeight:600}}>{c.term}: </span>
            <span style={{fontSize:13,color:"#94a3b8"}}>{c.definition}</span>
          </div>)}
        </div>
      </section>}
      {notes.keyPoints?.length>0&&<section><SH icon="💡" label="Key Points" col="#a78bfa"/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {notes.keyPoints.map((p,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#7c3aed",flexShrink:0,marginTop:7}}/>
            <span style={{fontSize:13.5,color:"#94a3b8",lineHeight:1.65}}>{p}</span>
          </div>)}
        </div>
      </section>}
      {notes.formulas?.length>0&&<section><SH icon="📐" label="Formulas" col="#f59e0b"/>
        {notes.formulas.map((f,i)=><div key={i} style={{padding:"9px 13px",background:"rgba(245,158,11,.05)",borderRadius:8,border:"1px solid rgba(245,158,11,.12)",fontFamily:"monospace",fontSize:12.5,color:"#fcd34d",marginBottom:5}}>{f}</div>)}
      </section>}
      {notes.realWorldExamples?.length>0&&<section><SH icon="🌍" label="Real-World Examples" col="#34d399"/>
        {notes.realWorldExamples.map((e,i)=><div key={i} style={{padding:"8px 12px",background:"rgba(52,211,153,.05)",borderRadius:8,border:"1px solid rgba(52,211,153,.11)",fontSize:13,color:"#94a3b8",marginBottom:5}}>{e}</div>)}
      </section>}
      {notes.commonMistakes?.length>0&&<section><SH icon="⚠️" label="Common Mistakes" col="#ef4444"/>
        {notes.commonMistakes.map((e,i)=><div key={i} style={{padding:"8px 12px",background:"rgba(239,68,68,.05)",borderRadius:8,border:"1px solid rgba(239,68,68,.1)",fontSize:13,color:"#fca5a5",marginBottom:5}}>{e}</div>)}
      </section>}
      {notes.furtherReading?.length>0&&<section><SH icon="🔗" label="Explore Further" col="#60a5fa"/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {notes.furtherReading.map((t,i)=><a key={i} href={`https://www.google.com/search?q=${encodeURIComponent(t)}`} target="_blank" rel="noreferrer" style={{padding:"4px 11px",background:"rgba(96,165,250,.07)",border:"1px solid rgba(96,165,250,.16)",borderRadius:20,fontSize:12,color:"#60a5fa",textDecoration:"none"}}>{t} ↗</a>)}
        </div>
      </section>}
    </div>
  );
};

/* ─── Q&A Panel ────────────────────────────────────────────────────────────── */
const QAPanel = ({ qa }) => {
  const [open,setOpen] = useState(null);
  if(!qa?.length) return <div style={{color:"#64748b",fontSize:14,textAlign:"center",padding:20}}>No Q&A available.</div>;
  const dc = {Easy:"bg",Medium:"ba",Hard:"br"};
  return (
    <div className="fi" style={{display:"flex",flexDirection:"column",gap:7}}>
      {qa.map((item,i)=>(
        <div key={i} className="card-static" style={{overflow:"hidden"}}>
          <div onClick={()=>setOpen(open===i?null:i)} style={{padding:"12px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,marginBottom:5,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{width:19,height:19,borderRadius:"50%",background:"rgba(124,58,237,.18)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#a78bfa",fontWeight:700}}>Q{i+1}</span>
                <span className={`badge ${dc[item.difficulty]||"bv"}`}>{item.difficulty}</span>
                {item.concept&&<span style={{fontSize:10,color:"#4c1d95"}}>• {item.concept}</span>}
              </div>
              <span style={{fontSize:13.5,color:"#e2e8f0",lineHeight:1.5}}>{item.question}</span>
            </div>
            <span style={{color:"#4c1d95",fontSize:14,flexShrink:0}}>{open===i?"▲":"▼"}</span>
          </div>
          {open===i&&<div className="su" style={{padding:"0 14px 13px",borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:11}}>
            <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.7}}>💬 {item.answer}</p>
          </div>}
        </div>
      ))}
    </div>
  );
};

/* ─── Quiz Panel ───────────────────────────────────────────────────────────── */
const QuizPanel = ({ quiz, onComplete }) => {
  const [idx,setIdx]       = useState(0);
  const [answers,setAns]   = useState({});
  const [submitted,setSub] = useState(false);
  const [score,setScore]   = useState(0);
  if(!quiz?.length) return <div style={{color:"#64748b",textAlign:"center",padding:20}}>No quiz available.</div>;
  const q=quiz[idx], total=quiz.length, answered=Object.keys(answers).length;
  const submit = () => { let s=0; quiz.forEach((q,i)=>{if(answers[i]===q.correct)s++;}); setScore(s); setSub(true); onComplete?.(Math.round((s/total)*100)); };
  if(submitted) {
    const pct=Math.round((score/total)*100), gi=gradeInfo(pct);
    return (
      <div className="fi" style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{padding:"24px",borderRadius:14,background:gi.bg,border:`1px solid ${gi.color}28`,textAlign:"center"}}>
          <div style={{fontSize:52,fontWeight:800,color:gi.color,fontFamily:"'Sora',sans-serif"}}>{gi.grade}</div>
          <div style={{fontSize:20,fontWeight:700,color:gi.color}}>{score}/{total} · {pct}%</div>
          <div style={{color:"#94a3b8",fontSize:13,marginTop:3}}>{gi.label}</div>
        </div>
        {quiz.map((q,i)=>(
          <div key={i} className="card-static" style={{padding:13}}>
            <div style={{fontSize:13,color:"#e2e8f0",marginBottom:8,fontWeight:500,lineHeight:1.4}}>{i+1}. {q.question}</div>
            {q.options.map((opt,j)=><div key={j} style={{padding:"6px 10px",borderRadius:7,marginBottom:3,fontSize:12.5,
              background:j===q.correct?"rgba(16,185,129,.09)":(answers[i]===j&&j!==q.correct?"rgba(239,68,68,.07)":"transparent"),
              color:j===q.correct?"#6ee7b7":(answers[i]===j&&j!==q.correct?"#fca5a5":"#64748b")}}>
              {j===q.correct?"✓ ":answers[i]===j?"✗ ":""}{opt}
            </div>)}
            <div style={{marginTop:7,padding:"6px 10px",background:"rgba(124,58,237,.06)",borderRadius:7,fontSize:12,color:"#a78bfa"}}>{q.explanation}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="fi" style={{display:"flex",flexDirection:"column",gap:13}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:"#64748b"}}>Question {idx+1} of {total}</span>
        <div style={{display:"flex",gap:3}}>{quiz.map((_,i)=><div key={i} onClick={()=>setIdx(i)} style={{width:26,height:4,borderRadius:100,cursor:"pointer",background:answers[i]!==undefined?"#7c3aed":i===idx?"#4c1d95":"rgba(255,255,255,.1)"}}/>)}</div>
      </div>
      <div style={{padding:"18px",background:"rgba(124,58,237,.06)",borderRadius:12,border:"1px solid rgba(124,58,237,.12)"}}>
        <div className="sora" style={{fontSize:14,color:"#e2e8f0",lineHeight:1.6}}>{q.question}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {q.options.map((opt,j)=><button key={j} className="qopt" disabled={answers[idx]!==undefined}
          style={answers[idx]===j?{borderColor:"#7c3aed",background:"rgba(124,58,237,.08)"}:{}}
          onClick={()=>{setAns(p=>({...p,[idx]:j})); if(idx<total-1) setTimeout(()=>setIdx(idx+1),380);}}>
          <span style={{display:"inline-flex",width:20,height:20,borderRadius:"50%",background:"rgba(255,255,255,.07)",alignItems:"center",justifyContent:"center",fontSize:9,marginRight:8,fontWeight:700}}>{["A","B","C","D"][j]}</span>{opt}
        </button>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        {idx>0&&<button className="btn btn-s btn-sm" onClick={()=>setIdx(idx-1)}>← Prev</button>}
        <div style={{flex:1}}/>
        {answered===total&&<button className="btn btn-p" onClick={submit}>Submit ✓</button>}
        {idx<total-1&&<button className="btn btn-g btn-sm" onClick={()=>setIdx(idx+1)}>Next →</button>}
      </div>
    </div>
  );
};

/* ─── Chat Panel ───────────────────────────────────────────────────────────── */
const ChatPanel = ({ moduleTitle, topicTitle, transcript, isPro, onUpgrade }) => {
  const [msgs,setMsgs] = useState([{role:"assistant",content:`Hi! I'm your AI tutor${moduleTitle?` for "${moduleTitle}"`:""}. Ask me anything! 🎓`}]);
  const [input,setInput] = useState("");
  const [loading,setL]   = useState(false);
  const endRef = useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[msgs]);
  if(!isPro) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",gap:14,textAlign:"center"}}>
      <div style={{fontSize:40}}>🤖</div>
      <div className="sora" style={{fontSize:15,color:"#e2e8f0",fontWeight:600}}>AI Tutor Chat</div>
      <p style={{fontSize:13,color:"#64748b",maxWidth:280,lineHeight:1.6}}>Get instant answers from a Claude-powered AI that knows your video content.</p>
      <button className="btn btn-gold" onClick={onUpgrade}>⚡ Upgrade to Pro to Chat</button>
    </div>
  );
  const send = async () => {
    if(!input.trim()||loading) return;
    const um = {role:"user",content:input.trim()};
    setMsgs(p=>[...p,um]); setInput(""); setL(true);
    try {
      const history = [...msgs,um].map(m=>({role:m.role,content:m.content}));
      const {data} = await chatAPI.send(history, { moduleTitle, topicTitle, transcriptSnippet: transcript?.slice(0,1200) });
      setMsgs(p=>[...p,{role:"assistant",content:data.reply}]);
    } catch { setMsgs(p=>[...p,{role:"assistant",content:"Having a moment — please try again! 🙂"}]); }
    setL(false);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",height:"420px"}}>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:9,padding:"2px",marginBottom:9}}>
        {msgs.map((m,i)=><div key={i} style={{display:"flex",flexDirection:m.role==="user"?"row-reverse":"row",gap:6,alignItems:"flex-end"}}>
          {m.role==="assistant"&&<div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>🤖</div>}
          <div className={m.role==="user"?"msg-u":"msg-a"}>{m.content}</div>
        </div>)}
        {loading&&<div style={{display:"flex",gap:6,alignItems:"flex-end"}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🤖</div>
          <div className="msg-a" style={{display:"flex",gap:4,padding:"12px 14px"}}>{[0,.12,.24].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#7c3aed",animation:`blink 1.1s ${d}s ease-in-out infinite`}}/>)}</div>
        </div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex",gap:7}}>
        <input className="inp" style={{fontSize:13}} placeholder="Ask anything about this module…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
        <button className="btn btn-p btn-sm" style={{paddingLeft:16,paddingRight:16}} onClick={send} disabled={loading}>{loading?<Spinner size={13}/>:"↑"}</button>
      </div>
    </div>
  );
};

/* ─── Video Panel ──────────────────────────────────────────────────────────── */
const VideoPanel = ({ module: mod, courseId, onVideoChange }) => {
  const [showPicker,setPicker] = useState(false);
  const [urlInput,setUrl]      = useState("");
  const [query,setQuery]       = useState(mod?.searchQuery||"");
  const [searching,setSrch]    = useState(false);
  const [results,setResults]   = useState(mod?.searchResults||[]);
  const [info,setInfo]         = useState(null);
  useEffect(()=>{ if(mod?.videoId) searchAPI.info(mod.videoId).then(r=>setInfo(r.data.info)).catch(()=>{}); },[mod?.videoId]);
  const doSearch = async (q) => { setSrch(true); const {data}=await searchAPI.videos(q||query,5); setResults(data.results||[]); setSrch(false); };
  const setVideo = async (vid) => { onVideoChange(vid); setPicker(false); setUrl(""); setInfo(null); searchAPI.info(vid).then(r=>setInfo(r.data.info)).catch(()=>{}); };
  if(!mod?.videoId) return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {results.length>0?(
        <div><div style={{fontSize:12,color:"#64748b",marginBottom:9}}>Select a video:</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:9}}>
            {results.map(v=><VideoCard key={v.videoId} video={v} onSelect={v=>setVideo(v.videoId)} compact/>)}
          </div>
        </div>
      ):(
        <div style={{padding:"24px",textAlign:"center",borderRadius:12,border:"2px dashed rgba(124,58,237,.22)",background:"rgba(124,58,237,.03)"}}>
          <div style={{fontSize:36,marginBottom:9}}>🎬</div>
          <div className="sora" style={{fontSize:14,color:"#e2e8f0",marginBottom:4}}>Add a YouTube Video</div>
          <p style={{fontSize:12,color:"#64748b",marginBottom:12}}>Search or paste a URL to find the best video for this module</p>
        </div>
      )}
      <div style={{display:"flex",gap:7}}>
        <input className="inp" style={{fontSize:13}} placeholder="Search or paste YouTube URL…" value={urlInput} onChange={e=>setUrl(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"){const id=getVideoId(urlInput);id?setVideo(id):doSearch(urlInput);}}}/>
        <button className="btn btn-p btn-sm" style={{flexShrink:0}} onClick={()=>{const id=getVideoId(urlInput);id?setVideo(id):doSearch(urlInput);}}>
          {searching?<Spinner size={13}/>:"Go"}
        </button>
      </div>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {mod.transcriptStatus==="pending"&&<div style={{padding:"7px 12px",borderRadius:8,background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.14)",display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#fbbf24"}}><Spinner size={11} col="#fbbf24"/>Fetching transcript to enhance your notes…</div>}
      <div style={{position:"relative",paddingBottom:"56.25%",borderRadius:12,overflow:"hidden",background:"#000"}}>
        <iframe src={`https://www.youtube.com/embed/${mod.videoId}?rel=0&modestbranding=1`}
          style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
          allowFullScreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"/>
      </div>
      {info&&<div style={{padding:"8px 12px",borderRadius:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",display:"flex",gap:9,alignItems:"center"}}>
        <span style={{fontSize:14}}>📺</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,color:"#e2e8f0",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{info.title}</div>
          <div style={{fontSize:11,color:"#4c1d95"}}>{info.uploader}</div>
        </div>
        {mod.transcriptStatus==="success"&&<span className="badge bc">✓ Transcript</span>}
      </div>}
      <div style={{display:"flex",justifyContent:"flex-end"}}><button className="btn btn-g btn-xs" onClick={()=>setPicker(!showPicker)}>🔄 Change Video</button></div>
      {showPicker&&<div className="su card-static" style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",gap:7}}>
          <input className="inp" style={{fontSize:13}} placeholder="Paste URL or search…" value={urlInput} onChange={e=>setUrl(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"){const id=getVideoId(urlInput);id?setVideo(id):doSearch(urlInput);}}}/>
          <button className="btn btn-p btn-sm" style={{flexShrink:0}} onClick={()=>{const id=getVideoId(urlInput);id?setVideo(id):doSearch(urlInput);}}>
            {searching?<Spinner size={13}/>:"Go"}
          </button>
        </div>
        {results.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:7}}>
          {results.map(v=><VideoCard key={v.videoId} video={v} compact selected={v.videoId===mod?.videoId} onSelect={v=>{setVideo(v.videoId);setPicker(false);}}/>)}
        </div>}
      </div>}
    </div>
  );
};

const VideoCard = ({ video, onSelect, selected=false, compact=false }) => (
  <div onClick={()=>onSelect(video)} style={{cursor:"pointer",borderRadius:11,overflow:"hidden",border:`1.5px solid ${selected?"#7c3aed":"rgba(255,255,255,.07)"}`,background:selected?"rgba(124,58,237,.07)":"#0b0b1e",transition:"all .18s"}}>
    <div style={{position:"relative"}}>
      <img src={video.thumbnail} alt={video.title} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}} onError={e=>{e.target.src=`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;}}/>
      {selected&&<div style={{position:"absolute",inset:0,background:"rgba(124,58,237,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:36,height:36,borderRadius:"50%",background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✓</div></div>}
    </div>
    <div style={{padding:compact?"7px 9px":"10px 11px"}}>
      <div style={{fontSize:compact?11.5:13,color:"#e2e8f0",fontWeight:500,lineHeight:1.35,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{video.title}</div>
      <div style={{fontSize:10,color:"#4c1d95",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{video.uploader}</div>
    </div>
  </div>
);

/* ─── Learner View ─────────────────────────────────────────────────────────── */
const LearnerView = ({ module: mod, courseId, topicTitle, onVideoChange, onQuizComplete, isPro, onUpgrade }) => {
  const defaultTab = !mod?.videoId&&mod?.notes?"notes":"video";
  const [tab,setTab] = useState(defaultTab);
  useEffect(()=>{ setTab(!mod?.videoId&&mod?.notes?"notes":"video"); },[mod?.id]);
  const tabs = [{id:"video",label:"📹 Video"},{id:"notes",label:"📓 Notes"},{id:"qa",label:"💬 Q&A"},{id:"quiz",label:"🧠 Quiz"},{id:"chat",label:"🤖 Tutor"}];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:13}}>
      <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:2,alignItems:"center"}}>
        {tabs.map(t=><button key={t.id} className={`stab${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)} style={{position:"relative"}}>
          {t.label}
          {t.id==="chat"&&!isPro&&<span style={{position:"absolute",top:-2,right:-2,width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>}
        </button>)}
        <div style={{flex:1}}/>
        {mod?.quizCompleted&&<span className="badge bg">Quiz: {mod.quizScore}%</span>}
        {mod?.transcriptStatus==="success"&&<span className="badge bc">✓ Transcript</span>}
      </div>
      {tab==="video"&&<VideoPanel module={mod} courseId={courseId} onVideoChange={onVideoChange}/>}
      {tab==="notes"&&(mod?.notes?<NotesPanel notes={mod.notes}/>:<Skel rows={6}/>)}
      {tab==="qa"&&(mod?.qa?<QAPanel qa={mod.qa}/>:<Skel rows={4}/>)}
      {tab==="quiz"&&(mod?.quizQuestions?<QuizPanel quiz={mod.quizQuestions} onComplete={onQuizComplete}/>:<Skel rows={3}/>)}
      {tab==="chat"&&<ChatPanel moduleTitle={mod?.title} topicTitle={topicTitle} transcript={mod?.transcript} isPro={isPro} onUpgrade={onUpgrade}/>}
    </div>
  );
};

/* ─── Final Quiz ───────────────────────────────────────────────────────────── */
const FinalQuiz = ({ courseId, modules, topicTitle, onComplete, isPro }) => {
  const [qs,setQs] = useState(null);
  const [loading,setL] = useState(true);
  const [err,setErr] = useState(false);
  const load = useCallback(()=>{
    setL(true); setErr(false);
    coursesAPI.finalQuiz(courseId).then(r=>{setQs(r.data.questions);setL(false);}).catch(()=>{setErr(true);setL(false);});
  },[courseId]);
  useEffect(()=>load(),[load]);
  if(loading) return <div style={{padding:"50px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}><Spinner size={34} col="#a78bfa"/><span className="sora" style={{color:"#a78bfa"}}>Generating final exam…</span></div>;
  if(err||!qs?.length) return <div style={{padding:20,textAlign:"center",color:"#64748b"}}>Couldn't generate exam. <button className="btn btn-s btn-sm" onClick={load}>Retry →</button></div>;
  return <QuizPanel quiz={qs} onComplete={async(score)=>{
    await coursesAPI.update(courseId,{status:"completed",finalScore:score,finalGrade:gradeInfo(score).grade});
    onComplete(score, gradeInfo(score).grade);
  }}/>;
};

/* ─── Course Tab ───────────────────────────────────────────────────────────── */
const CourseTab = ({ state, setState, onDashboard, onUpgrade, isPro }) => {
  const { phase, topic, course, modules, activeIdx } = state;
  const setPhase   = (p)   => setState(s=>({...s, phase:p}));
  const setTopic   = (t)   => setState(s=>({...s, topic:t}));
  const setCourse  = (c)   => setState(s=>({...s, course:c}));
  const setModules = (m)   => setState(s=>({...s, modules: typeof m==="function"?m(s.modules):m}));
  const setActive  = (i)   => setState(s=>({...s, activeIdx:i}));

  const historyRef = useRef([]);
  const esRef      = useRef(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const goBack = () => {
    const p = historyRef.current.pop();
    if(p) setPhase(p);
    else if(phase!=="input") setPhase("input");
  };
  const pushPhase = (p) => { historyRef.current.push(phase); setPhase(p); };

  const startCourse = async () => {
    if(!topic.trim()) return;
    setCreating(true);
    try {
      const {data} = await coursesAPI.create(topic.trim());

      if(data.existing) {
        toast.info("Found your existing course! Loading it now…");
        const full = await coursesAPI.get(data.courseId);
        setCourse(full.data.course);
        setModules(full.data.course.modules);
        pushPhase("modules");
        setCreating(false);
        return;
      }

      if(data.error === "FREE_LIMIT_REACHED") {
        toast.error("You've reached the free plan limit. Upgrade to Pro for unlimited courses.");
        onUpgrade();
        setCreating(false);
        return;
      }

      const {courseId} = data;
      const full = await coursesAPI.get(courseId);
      setCourse(full.data.course);
      setModules(full.data.course.modules||[]);
      pushPhase("generating");
      setCreating(false);

      const es = coursesAPI.stream(courseId);
      esRef.current = es;
      es.onmessage = async (e) => {
        const msg = JSON.parse(e.data);
        if(msg.type==="modules_listed") setModules(msg.modules);
        if(msg.type==="module_building"||msg.type==="module_done"||msg.type==="module_error"||msg.type==="transcript_ready") {
          const r = await coursesAPI.get(courseId);
          setModules(r.data.course.modules);
          if(msg.type==="module_done") setPhase("modules");
        }
        if(msg.type==="generation_complete") {
          const r = await coursesAPI.get(courseId);
          setModules(r.data.course.modules);
          es.close();
          toast.success("Course ready! All modules generated.");
        }
        if(msg.type==="error") { es.close(); setPhase("input"); toast.error("Generation failed. Please try again."); }
      };
      es.onerror = () => es.close();
    } catch (err) {
      const msg = err.response?.data?.error;
      if(msg==="FREE_LIMIT_REACHED") { onUpgrade(); toast.error("Upgrade to Pro for unlimited courses."); }
      else toast.error("Something went wrong. Please try again.");
      setCreating(false);
    }
  };

  const retryModule = async (modId) => {
    await coursesAPI.retryModule(course.id, modId);
    setModules(p=>p.map(m=>m.id===modId?{...m,genStatus:"building"}:m));
    const poll = setInterval(async()=>{
      const r = await coursesAPI.get(course.id);
      const mod = r.data.course.modules.find(m=>m.id===modId);
      if(mod?.genStatus!=="building"){ setModules(r.data.course.modules); clearInterval(poll); }
    },3000);
    setTimeout(()=>clearInterval(poll),120000);
  };

  const updateVideo = async (modId, videoId) => {
    await coursesAPI.updateModule(course.id, modId, { videoId });
    setModules(p=>p.map(m=>m.id===modId?{...m,videoId,transcriptStatus:"pending"}:m));
    const poll = setInterval(async()=>{
      const r = await coursesAPI.get(course.id);
      const mod = r.data.course.modules.find(m=>m.id===modId);
      if(mod?.transcriptStatus!=="pending"){ setModules(r.data.course.modules); clearInterval(poll); toast.success("Content updated with new video transcript!"); }
    },3000);
    setTimeout(()=>clearInterval(poll),60000);
  };

  const completeQuiz = async (modId, score) => {
    await coursesAPI.updateModule(course.id, modId, { quizCompleted:true, quizScore:score });
    setModules(p=>p.map(m=>m.id===modId?{...m,quizCompleted:true,quizScore:score}:m));
    toast.success(`Quiz complete! You scored ${score}%`);
  };

  useEffect(()=>()=>esRef.current?.close(),[]);

  const completedCount = modules.filter(m=>m.quizCompleted).length;
  const allDone        = modules.length>0 && completedCount===modules.length && modules.every(m=>m.genStatus==="done"||m.genStatus==="error");
  const stillBuilding  = modules.some(m=>m.genStatus==="building"||m.genStatus==="pending");
  const mod            = modules[activeIdx];

  if(phase==="input") return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"48px 20px"}} className="page-enter">
      <div className="fu" style={{textAlign:"center",marginBottom:38}}>
        <div style={{fontSize:54,marginBottom:13}} className="floating">🎓</div>
        <h2 className="sora" style={{fontSize:"clamp(22px,4vw,34px)",fontWeight:800,color:"#f1f5f9",marginBottom:9}}>What do you want to <span className="grad">master?</span></h2>
        <p style={{color:"#64748b",fontSize:13.5,lineHeight:1.7}}>
          {isPro ? "Pro: 9 modules · Claude AI · Full transcripts · Unlimited courses" : "Free: 5 modules · 2 courses max · "}
          {!isPro&&<button className="btn btn-g btn-xs" style={{color:"#fbbf24",fontSize:12}} onClick={onUpgrade}>Upgrade for more ↗</button>}
        </p>
      </div>
      <div className="fu2" style={{display:"flex",gap:8}}>
        <input className="inp" style={{fontSize:15}} placeholder="e.g. Machine Learning, Guitar, React, History…"
          value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startCourse()}/>
        <button className="btn btn-p" style={{flexShrink:0,paddingLeft:22,paddingRight:22}} onClick={startCourse} disabled={creating}>
          {creating?<Spinner size={16}/>:"Build →"}
        </button>
      </div>
      <div className="fu3" style={{marginTop:22,display:"flex",gap:7,flexWrap:"wrap"}}>
        {["Machine Learning","Organic Chemistry","Guitar","React Development","Stoic Philosophy","Astrophysics","Financial Markets","Human Psychology"].map(s=>(
          <button key={s} className="btn btn-s btn-sm" onClick={()=>setTopic(s)}>{s}</button>
        ))}
      </div>
      {!isPro&&<div className="fu4" style={{marginTop:28}}>
        <UpgradeBanner message="Pro users get 9 modules, Claude AI, full transcripts, and unlimited courses." onUpgrade={onUpgrade}/>
      </div>}
    </div>
  );

  if(phase==="generating"&&modules.length===0) return (
    <div style={{padding:"70px 20px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:18}} className="page-enter">
      <div style={{position:"relative",width:80,height:80}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(124,58,237,.17)"}} className="blobbing"/>
        <div style={{position:"absolute",inset:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🧠</div>
      </div>
      <div>
        <div className="sora" style={{fontSize:20,color:"#e2e8f0",marginBottom:6}}>Building "{topic}"</div>
        <p style={{color:"#64748b",fontSize:13}}>AI is designing your course structure…</p>
      </div>
      <Spinner size={28} col="#a78bfa"/>
    </div>
  );

  if(phase==="finalQuiz") return (
    <div style={{padding:"20px",maxWidth:780,margin:"0 auto"}} className="page-enter">
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <button className="btn btn-g btn-sm" onClick={goBack}>← Back</button>
        <div><div className="sora" style={{fontSize:16,color:"#e2e8f0"}}>🏆 Final Exam — {course?.topic}</div>
          {isPro&&<div style={{fontSize:11,color:"#a78bfa"}}>15 questions · Claude AI</div>}</div>
      </div>
      <FinalQuiz courseId={course.id} modules={modules} topicTitle={course?.topic} isPro={isPro}
        onComplete={(s,g)=>{ setState(s=>({...s,phase:"input",topic:"",course:null,modules:[],activeIdx:0})); onDashboard(); toast.success(`Course complete! You got ${g} (${s}%)`); }}/>
    </div>
  );

  return (
    <div style={{display:"flex",height:"calc(100vh - 124px)"}} className="page-enter">
      {/* Sidebar */}
      <div className="desk" style={{width:256,flexShrink:0,borderRight:"1px solid rgba(255,255,255,.06)",padding:"12px 9px",overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
        <div style={{padding:"9px 11px",marginBottom:7}}>
          <div className="sora" style={{fontSize:12.5,fontWeight:600,color:"#e2e8f0",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{course?.topic}</div>
          <div style={{fontSize:10,color:"#4c1d95",marginBottom:6}}>{completedCount}/{modules.length} quizzes · {isPro?"Claude AI 🔥":"Groq AI"}</div>
          <div className="prog"><div className="prog-fill" style={{width:`${modules.length?completedCount/modules.length*100:0}%`}}/></div>
        </div>
        {modules.map((m,i)=>{
          const ready = m.genStatus==="done";
          const error = m.genStatus==="error";
          return <div key={m.id} className={`mod-item${activeIdx===i?" on":""}`}
            onClick={()=>(ready||error)&&setActive(i)}
            style={{opacity:(ready||error)?1:.55,cursor:(ready||error)?"pointer":"default"}}>
            <span style={{fontSize:17,flexShrink:0}}>{m.emoji||"📚"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,color:activeIdx===i?"#e2e8f0":"#94a3b8",fontWeight:activeIdx===i?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title||"…"}</div>
              <div style={{display:"flex",gap:4,marginTop:2,alignItems:"center",flexWrap:"wrap"}}>
                {m.genStatus==="building"&&<><Spinner size={9} col="#fbbf24"/><span style={{fontSize:9,color:"#fbbf24"}}>Building…</span></>}
                {m.genStatus==="pending"&&<span style={{fontSize:9,color:"#374151"}}>Queued</span>}
                {error&&<span style={{fontSize:9,color:"#fca5a5"}}>⚠ Failed</span>}
                {ready&&m.videoId&&<span style={{fontSize:9,color:"#34d399"}}>▶</span>}
                {ready&&m.transcriptStatus==="success"&&<span style={{fontSize:9,color:"#06b6d4"}}>✓T</span>}
                {ready&&m.quizCompleted&&<span style={{fontSize:9,color:"#fbbf24"}}>🏆{m.quizScore}%</span>}
              </div>
            </div>
            {ready?<div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,background:m.quizCompleted?"#34d399":m.notes?"#7c3aed":"rgba(255,255,255,.12)"}}/>
              :error?<button className="btn btn-xs" style={{fontSize:9,color:"#fca5a5",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",padding:"2px 6px"}} onClick={e=>{e.stopPropagation();retryModule(m.id);}}>Retry</button>
              :<Spinner size={9} col={m.genStatus==="building"?"#fbbf24":"#374151"}/>}
          </div>;
        })}
        <div style={{marginTop:"auto",paddingTop:9}}>
          {allDone&&isPro?<button className="btn btn-p btn-block btn-sm" onClick={()=>pushPhase("finalQuiz")}>🏆 Final Exam →</button>
            :allDone&&!isPro?<div style={{textAlign:"center"}}>
              <div style={{fontSize:10,color:"#374151",marginBottom:7}}>Final exam is a Pro feature</div>
              <button className="btn btn-gold btn-block btn-sm" onClick={onUpgrade}>⚡ Upgrade for Final Exam</button>
            </div>
            :<div style={{fontSize:10,color:"#374151",textAlign:"center",padding:5,lineHeight:1.5}}>Complete all quizzes to unlock final exam</div>}
        </div>
      </div>
      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",padding:"18px"}}>
        <div className="mob-only" style={{display:"flex",overflowX:"auto",gap:4,marginBottom:12,paddingBottom:3}}>
          {modules.map((m,i)=><button key={m.id} className={`stab${activeIdx===i?" on":""}`} style={{flexShrink:0,fontSize:10,opacity:m.genStatus==="done"?1:.5}} onClick={()=>m.genStatus==="done"&&setActive(i)}>
            {m.emoji||"📚"} {m.title?.split(" ").slice(0,2).join(" ")||"…"}
          </button>)}
        </div>
        {mod&&<>
          <div style={{marginBottom:16,paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:9,flexWrap:"wrap",marginBottom:5}}>
              <button className="btn btn-g btn-xs desk" onClick={goBack}>← Back</button>
              <span style={{fontSize:24}}>{mod.emoji||"📚"}</span>
              <h3 className="sora" style={{fontSize:17,fontWeight:700,color:"#e2e8f0"}}>{mod.title}</h3>
              {mod.quizCompleted&&<span className="badge bg">✓ {mod.quizScore}%</span>}
              {mod.transcriptStatus==="success"&&<span className="badge bc">✓ Transcript</span>}
              {mod.aiModel==="claude"&&<span className="badge bv">Claude AI</span>}
              {mod.genStatus==="error"&&<button className="btn btn-sm" style={{color:"#fca5a5",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)"}} onClick={()=>retryModule(mod.id)}>⟳ Retry Module</button>}
            </div>
            <p style={{fontSize:12.5,color:"#64748b",lineHeight:1.55}}>{mod.description}</p>
            <div style={{fontSize:11,color:"#374151",marginTop:5}}>Module {activeIdx+1} of {modules.length}</div>
          </div>
          <LearnerView module={mod} courseId={course?.id} topicTitle={course?.topic}
            onVideoChange={(vid)=>updateVideo(mod.id,vid)}
            onQuizComplete={(score)=>completeQuiz(mod.id,score)}
            isPro={isPro} onUpgrade={onUpgrade}/>
          {stillBuilding&&<div style={{marginTop:18,padding:"10px 14px",borderRadius:9,background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.14)",display:"flex",alignItems:"center",gap:9,fontSize:12,color:"#fbbf24"}}>
            <Spinner size={12} col="#fbbf24"/>
            {modules.filter(m=>m.genStatus==="done").length}/{modules.length} modules ready — building in background
          </div>}
          {allDone&&isPro&&<div style={{marginTop:20,padding:"18px",borderRadius:14,background:"rgba(124,58,237,.07)",border:"1px solid rgba(124,58,237,.18)",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:8}}>🏆</div>
            <div className="sora" style={{fontSize:15,color:"#e2e8f0",marginBottom:6}}>All modules complete!</div>
            <button className="btn btn-p" onClick={()=>pushPhase("finalQuiz")}>Take Final Exam →</button>
          </div>}
        </>}
      </div>
    </div>
  );
};

/* ─── Video Tab ────────────────────────────────────────────────────────────── */
const VideoTab = ({ onDashboard, onUpgrade, isPro }) => {
  const [phase,setPhase]   = useState("input");
  const [query,setQuery]   = useState("");
  const [results,setRes]   = useState([]);
  const [searching,setSrch]= useState(false);
  const [urlInput,setUrl]  = useState("");
  const [videoData,setVData]= useState(null);
  const [polling,setPoll]  = useState(false);
  const toast = useToast();
  const historyRef = useRef([]);
  const goBack = () => { const p=historyRef.current.pop(); if(p) setPhase(p); else setPhase("input"); };

  const doSearch = async (q) => { setSrch(true); const {data}=await searchAPI.videos(q||query,6); setRes(data.results||[]); setSrch(false); };
  const loadVideo = async (videoId, title) => {
    try {
      const {data} = await videosAPI.save(videoId, title);
      if(data.existing) { toast.info("Loading your saved video…"); setVData(data.video); historyRef.current.push(phase); setPhase("learning"); return; }
      setVData(data.video); historyRef.current.push(phase); setPhase("learning");
      setPoll(true);
      const interval = setInterval(async()=>{
        const r = await videosAPI.get(data.video.id);
        setVData(r.data.video);
        if(r.data.video.notes){ clearInterval(interval); setPoll(false); toast.success("Notes and quiz ready!"); }
      },2500);
      setTimeout(()=>{ clearInterval(interval); setPoll(false); },90000);
    } catch { toast.error("Could not load video. Please try again."); }
  };

  if(phase==="learning") return (
    <div style={{padding:"18px",maxWidth:900,margin:"0 auto"}} className="page-enter">
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:18,flexWrap:"wrap"}}>
        <button className="btn btn-g btn-sm" onClick={goBack}>← Back</button>
        <div style={{flex:1,minWidth:0}}>
          <h3 className="sora" style={{fontSize:15,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{videoData?.title||"Video Learning"}</h3>
          {polling&&<div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#fbbf24",marginTop:2}}><Spinner size={9} col="#fbbf24"/>Generating content…</div>}
        </div>
        <button className="btn btn-s btn-sm" onClick={async()=>{ await videosAPI.update(videoData.id,{quizCompleted:true}); onDashboard(); }}>💾 Save to Library</button>
      </div>
      <LearnerView
        module={{...videoData, quizQuestions:videoData?.quizQuestions, searchResults:[]}}
        topicTitle={videoData?.title||"General Learning"}
        onVideoChange={async(vid)=>{ await videosAPI.update(videoData.id,{videoId:vid}); setVData(p=>({...p,videoId:vid})); }}
        onQuizComplete={async(score)=>{ await videosAPI.update(videoData.id,{quizCompleted:true,quizScore:score}); setVData(p=>({...p,quizCompleted:true,quizScore:score})); toast.success(`Quiz done! Score: ${score}%`); }}
        isPro={isPro} onUpgrade={onUpgrade}/>
    </div>
  );

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"36px 18px"}} className="page-enter">
      <div className="fu" style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:48,marginBottom:12}} className="floating">🎬</div>
        <h2 className="sora" style={{fontSize:"clamp(20px,4vw,30px)",fontWeight:800,color:"#f1f5f9",marginBottom:9}}>Learn from <span className="grad">any YouTube video</span></h2>
        <p style={{color:"#64748b",fontSize:13.5,lineHeight:1.7,maxWidth:460,margin:"0 auto"}}>Paste a URL or search. AI fetches the full transcript and generates notes, Q&A and quizzes from it.</p>
      </div>
      <div className="fu2" style={{display:"flex",gap:8,marginBottom:12}}>
        <input className="inp" style={{fontSize:14}} placeholder="Search YouTube topics…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch(query)}/>
        <button className="btn btn-p" style={{flexShrink:0,paddingLeft:18,paddingRight:18}} onClick={()=>doSearch(query)}>{searching?<Spinner size={15}/>:"Search"}</button>
      </div>
      <div className="fu3" style={{display:"flex",gap:8,marginBottom:28}}>
        <input className="inp" style={{fontSize:13}} placeholder="https://youtube.com/watch?v=… (paste any URL)" value={urlInput} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadVideo(getVideoId(urlInput))}/>
        <button className="btn btn-s" style={{flexShrink:0}} onClick={()=>loadVideo(getVideoId(urlInput))}>Load →</button>
      </div>
      {searching&&<div style={{textAlign:"center",padding:"30px"}}><Spinner size={30} col="#a78bfa"/></div>}
      {!searching&&results.length>0&&(
        <div className="fi" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:13}}>
          {results.map(v=><div key={v.videoId} onClick={()=>loadVideo(v.videoId,v.title)} className="card card-glow" style={{overflow:"hidden",cursor:"pointer",padding:0}}>
            <img src={v.thumbnail} alt={v.title} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}}/>
            <div style={{padding:"11px 12px"}}>
              <div style={{fontSize:13,color:"#e2e8f0",fontWeight:500,lineHeight:1.35,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",marginBottom:5}}>{v.title}</div>
              <div style={{fontSize:11,color:"#4c1d95",marginBottom:8}}>{v.uploader}</div>
              <div style={{padding:"5px 9px",background:"rgba(124,58,237,.07)",borderRadius:6,fontSize:11.5,color:"#a78bfa",textAlign:"center",fontFamily:"'Sora',sans-serif",fontWeight:600}}>▶ Learn from this</div>
            </div>
          </div>)}
        </div>
      )}
    </div>
  );
};

/* ─── Dashboard ────────────────────────────────────────────────────────────── */
const Dashboard = ({ onOpenCourse, onUpgrade }) => {
  const [courses,setCourses] = useState([]);
  const [videos,setVideos]   = useState([]);
  const [loading,setL]       = useState(true);
  useEffect(()=>{
    Promise.all([coursesAPI.list(), videosAPI.list()])
      .then(([c,v])=>{ setCourses(c.data.courses); setVideos(v.data.videos); setL(false); })
      .catch(()=>setL(false));
  },[]);
  const delCourse = async (id) => { await coursesAPI.delete(id); setCourses(p=>p.filter(c=>c.id!==id)); };
  const delVideo  = async (id) => { await videosAPI.delete(id);  setVideos(p=>p.filter(v=>v.id!==id)); };
  if(loading) return <div style={{padding:40,display:"flex",flexDirection:"column",gap:12}}>{[1,2,3].map(i=><div key={i} className="shim" style={{height:90,borderRadius:14}}/>)}</div>;
  if(!courses.length&&!videos.length) return (
    <div style={{padding:"80px 20px",textAlign:"center"}} className="page-enter">
      <div style={{fontSize:60,marginBottom:16}} className="floating">📚</div>
      <h3 className="sora" style={{fontSize:22,color:"#e2e8f0",marginBottom:9}}>Your Library is Empty</h3>
      <p style={{color:"#64748b",fontSize:14,lineHeight:1.7,maxWidth:360,margin:"0 auto"}}>Build your first course or learn from a YouTube video to get started.</p>
    </div>
  );
  return (
    <div style={{padding:"20px"}} className="page-enter">
      <h2 className="sora" style={{fontSize:20,color:"#e2e8f0",marginBottom:5}}>My Library</h2>
      <p style={{fontSize:12.5,color:"#64748b",marginBottom:22}}>{courses.length} courses · {videos.length} videos</p>
      {courses.length>0&&<>
        <div className="sora" style={{fontSize:11,color:"#7c3aed",textTransform:"uppercase",letterSpacing:.8,marginBottom:13}}>📖 Courses</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14,marginBottom:32}}>
          {courses.map(c=>{
            const done=c.modules?.filter(m=>m.quizCompleted).length||0, total=c.modules?.length||0;
            const gi=gradeInfo(c.finalScore||0);
            return <div key={c.id} className="card card-glow" style={{padding:20,cursor:"pointer"}} onClick={()=>onOpenCourse(c)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:13}}>
                <div style={{fontSize:30}}>🎓</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {c.finalGrade?<div style={{padding:"3px 11px",borderRadius:20,background:gi.bg,fontFamily:"'Sora',sans-serif",fontSize:19,fontWeight:800,color:gi.color}}>{c.finalGrade}</div>
                               :<span className="badge ba">{c.status==="generating"?"Building…":"In Progress"}</span>}
                  <button className="btn btn-g btn-xs" style={{color:"#fca5a5"}} onClick={e=>{e.stopPropagation();delCourse(c.id);}}>🗑</button>
                </div>
              </div>
              <div className="sora" style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:5}}>{c.topic}</div>
              <div style={{fontSize:11.5,color:"#64748b",marginBottom:11}}>{total} modules · {done}/{total} done{c.finalScore!=null?` · ${c.finalScore}%`:""}</div>
              <div className="prog"><div className="prog-fill" style={{width:`${total?done/total*100:0}%`}}/></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                <span style={{fontSize:10,color:"#374151"}}>{new Date(c.createdAt).toLocaleDateString()}</span>
                <span style={{fontSize:10,color:"#4c1d95"}}>Tap to continue →</span>
              </div>
            </div>;
          })}
        </div>
      </>}
      {videos.length>0&&<>
        <div className="sora" style={{fontSize:11,color:"#06b6d4",textTransform:"uppercase",letterSpacing:.8,marginBottom:13}}>🎬 Videos</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:13}}>
          {videos.map(v=>{
            const gi=gradeInfo(v.quizScore||0);
            return <div key={v.id} className="card card-glow" style={{overflow:"hidden"}}>
              {v.videoId&&<img src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`} alt={v.title} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}}/>}
              <div style={{padding:13}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                  <div className="sora" style={{fontSize:13,fontWeight:600,color:"#e2e8f0",flex:1,marginRight:7,lineHeight:1.3}}>{v.title||"Video"}</div>
                  {v.quizCompleted&&<div style={{padding:"2px 9px",borderRadius:20,background:gi.bg,fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:700,color:gi.color,flexShrink:0}}>{gi.grade}</div>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:10,color:"#374151"}}>{new Date(v.createdAt).toLocaleDateString()}</span>
                  <button className="btn btn-g btn-xs" style={{color:"#fca5a5",fontSize:11}} onClick={()=>delVideo(v.id)}>🗑</button>
                </div>
              </div>
            </div>;
          })}
        </div>
      </>}
    </div>
  );
};

/* ─── Pricing Page ─────────────────────────────────────────────────────────── */
const PricingPage = ({ onClose }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(null);
  const toast = useToast();

  const upgrade = async (plan) => {
    if(!user) { toast.error("Please sign in first"); return; }
    setLoading(plan);
    try {
      const { data } = await billingAPI.createSubscription(plan);

      // Load Razorpay script dynamically
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      script.onload = () => {
        const options = {
          key:             data.keyId,
          subscription_id: data.subscriptionId,
          name:            "Cognify",
          description:     plan === "monthly" ? "Pro Monthly — ₹299/mo" : "Pro Yearly — ₹1,999/yr",
          image:           "https://cognify-ai-rho.vercel.app/favicon.ico",
          handler: async (response) => {
            try {
              await billingAPI.verify({
                razorpay_payment_id:      response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature:       response.razorpay_signature,
              });
              await refreshUser();
              toast.success("🎉 Welcome to Pro! All features unlocked.");
              if(onClose) onClose();
            } catch { toast.error("Payment verification failed. Contact support."); }
          },
          prefill: { name: user?.name, email: user?.email },
          theme:   { color: "#7c3aed" },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => toast.error("Payment failed. Please try again."));
        rzp.open();
      };
    } catch {
      toast.error("Could not start checkout. Please try again.");
    }
    setLoading(null);
  };

  const features = {
    free: ["5 modules per course","2 courses total","Basic AI (Groq)","Notes & Quiz","YouTube videos"],
    pro:  ["9 modules per course","Unlimited courses","Claude AI (best quality)","Full transcript analysis","AI Tutor Chat","Final exam + grade","Priority generation","All future features"],
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",background:"#05050e",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"20%",left:"30%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.12),transparent 65%)",filter:"blur(80px)",pointerEvents:"none"}} className="glowing"/>
      {onClose&&<button className="btn btn-g btn-sm" style={{position:"absolute",top:24,left:24}} onClick={onClose}>← Back</button>}
      <div style={{textAlign:"center",marginBottom:40,zIndex:1}}>
        <div className="fu badge bv" style={{display:"inline-flex",marginBottom:14,fontSize:12}}>⚡ Simple Pricing</div>
        <h1 className="fu1 sora" style={{fontSize:"clamp(26px,4vw,46px)",fontWeight:800,color:"#f1f5f9",marginBottom:10}}>Learn without <span className="grad">limits</span></h1>
        <p className="fu2" style={{color:"#64748b",fontSize:15,maxWidth:420,margin:"0 auto"}}>Start free. Upgrade when you want the full experience.</p>
      </div>
      <div className="fu2" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,maxWidth:680,width:"100%",zIndex:1}}>
        {/* Free */}
        <div className="glass" style={{borderRadius:20,padding:28,display:"flex",flexDirection:"column",gap:0}}>
          <div style={{fontSize:13,color:"#64748b",fontFamily:"'Sora',sans-serif",fontWeight:600,marginBottom:6}}>FREE</div>
          <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:6}}>
            <span className="sora" style={{fontSize:40,fontWeight:800,color:"#e2e8f0"}}>₹0</span>
            <span style={{color:"#64748b",fontSize:13}}>/forever</span>
          </div>
          <div style={{fontSize:12,color:"#374151",marginBottom:22}}>$0 globally</div>
          <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:28,flex:1}}>
            {features.free.map((f,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"center"}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"rgba(16,185,129,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:9,color:"#34d399"}}>✓</span>
              </div>
              <span style={{fontSize:13,color:"#94a3b8"}}>{f}</span>
            </div>)}
          </div>
          <div style={{padding:"10px",borderRadius:9,background:"rgba(255,255,255,.04)",textAlign:"center",fontSize:13,color:"#64748b",fontWeight:500}}>
            {user?.plan==="free"?"✓ Your current plan":"Get started free"}
          </div>
        </div>
        {/* Pro */}
        <div style={{borderRadius:20,padding:28,display:"flex",flexDirection:"column",gap:0,background:"linear-gradient(135deg,rgba(124,58,237,.15),rgba(37,99,235,.1))",border:"1.5px solid rgba(124,58,237,.3)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:16,right:16}}><span className="badge bg-gold">Most Popular</span></div>
          <div style={{fontSize:13,color:"#a78bfa",fontFamily:"'Sora',sans-serif",fontWeight:600,marginBottom:6}}>PRO</div>
          <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
            <span className="sora" style={{fontSize:40,fontWeight:800,color:"#e2e8f0"}}>₹299</span>
            <span style={{color:"#94a3b8",fontSize:13}}>/month</span>
          </div>
          <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>or ₹1,999/year (save 44%) · $4.99/mo globally</div>
          <div style={{fontSize:11,color:"#a78bfa",marginBottom:20}}>Early bird pricing — lock it in now 🔒</div>
          <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:28,flex:1}}>
            {features.pro.map((f,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"center"}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"rgba(124,58,237,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:9,color:"#a78bfa"}}>✓</span>
              </div>
              <span style={{fontSize:13,color:"#e2e8f0",fontWeight:i<3?500:400}}>{f}</span>
            </div>)}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {user?.plan==="pro"?
              <div style={{padding:"11px",borderRadius:9,background:"rgba(16,185,129,.1)",textAlign:"center",fontSize:13,color:"#34d399",fontWeight:600}}>✓ You're on Pro!</div>:
              <>
                <button className="btn btn-gold btn-block" onClick={()=>upgrade("monthly")} disabled={loading==="monthly"}>
                  {loading==="monthly"?<Spinner size={15}/>:"⚡ Monthly — ₹299/mo"}
                </button>
                <button className="btn btn-block" style={{background:"rgba(245,158,11,.08)",color:"#fbbf24",border:"1.5px solid rgba(245,158,11,.25)",borderRadius:10,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer"}}
                  onClick={()=>upgrade("yearly")} disabled={loading==="yearly"}>
                  {loading==="yearly"?<Spinner size={15}/>:"🏆 Yearly — ₹1,999/yr (best value)"}
                </button>
              </>
            }
          </div>
        </div>
      </div>
      <p className="fu3" style={{marginTop:28,fontSize:12,color:"#374151",textAlign:"center",zIndex:1,lineHeight:1.7}}>Cancel anytime · Secure payment via Stripe · Instant upgrade · 7-day money-back guarantee</p>
    </div>
  );
};

/* ─── Auth Page ────────────────────────────────────────────────────────────── */
const AuthPage = ({ onBack }) => {
  const { login } = useAuth();
  const [mode,setMode]     = useState("signin");
  const [name,setName]     = useState(""), [email,setEmail] = useState(""), [pass,setPass] = useState("");
  const [err,setErr]       = useState(""), [loading,setL]   = useState(false);
  const toast = useToast();

  const handle = async () => {
    setErr(""); setL(true);
    try {
      if(!email||!pass){ setErr("Please fill in all fields"); setL(false); return; }
      const fn = mode==="signup" ? authAPI.register(name,email,pass) : authAPI.login(email,pass);
      const {data} = await fn;
      login(data.token, data.user);
      toast.success(mode==="signup"?"Welcome to Cognify!":"Welcome back!");
    } catch(e) { setErr(e.response?.data?.error||"Something went wrong"); }
    setL(false);
  };

  const handleGoogle = async (credentialResponse) => {
    setL(true);
    try {
      const {data} = await authAPI.google(credentialResponse.credential);
      login(data.token, data.user);
      toast.success("Signed in with Google!");
    } catch { setErr("Google sign-in failed. Please try again."); }
    setL(false);
  };

  const GoogleBtn = () => (
  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      setL(true);
      try {
        const {data} = await authAPI.google(credentialResponse.credential);
        login(data.token, data.user);
        toast.success("Signed in with Google!");
      } catch { setErr("Google sign-in failed. Please try again."); }
      setL(false);
    }}
    onError={() => setErr("Google sign-in failed.")}
    width="360"
    theme="filled_black"
    shape="rectangular"
    text="continue_with"
    useOneTap={false}
  />
);

  useEffect(() => {
  window.handleGoogleCredential = async (response) => {
    setL(true);
    try {
      const {data} = await authAPI.google(response.credential);
      login(data.token, data.user);
      toast.success("Signed in with Google!");
    } catch { setErr("Google sign-in failed."); }
    setL(false);
  };
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
  return () => { delete window.handleGoogleCredential; };
}, []);

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:18,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.18),transparent 65%)",top:"30%",left:"50%",transform:"translate(-50%,-50%)",filter:"blur(80px)",pointerEvents:"none"}} className="glowing"/>
      <div className="fu" style={{width:"100%",maxWidth:400,zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:26}}>
          <div style={{width:50,height:50,borderRadius:14,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 14px"}}>✦</div>
          <h1 className="sora" style={{fontSize:23,fontWeight:700,color:"#f1f5f9",marginBottom:4}}>{mode==="signin"?"Welcome back":"Join Cognify"}</h1>
          <p style={{color:"#64748b",fontSize:13}}>{mode==="signin"?"Sign in to continue learning":"Start your AI learning journey"}</p>
        </div>
        <div className="glass" style={{borderRadius:18,padding:28}}>
          <GoogleBtn/>
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"16px 0"}}>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,.06)"}}/>
            <span style={{fontSize:11,color:"#374151"}}>or</span>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,.06)"}}/>
          </div>
          <div className="tab-bar" style={{marginBottom:18}}>
            <button className={`tab${mode==="signin"?" on":""}`} style={{flex:1}} onClick={()=>{setMode("signin");setErr("")}}>Sign In</button>
            <button className={`tab${mode==="signup"?" on":""}`} style={{flex:1}} onClick={()=>{setMode("signup");setErr("")}}>Sign Up</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {mode==="signup"&&<input className="inp" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/>}
            <input className="inp" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/>
            <input className="inp" type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
            {err&&<div style={{padding:"8px 11px",borderRadius:8,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.18)",color:"#fca5a5",fontSize:12.5}}>⚠️ {err}</div>}
            <button className="btn btn-p btn-block" style={{padding:"12px",marginTop:3}} onClick={handle} disabled={loading}>
              {loading?<Spinner size={15}/>:(mode==="signin"?"Sign In →":"Create Account →")}
            </button>
          </div>
        </div>
        {onBack&&<div style={{textAlign:"center",marginTop:16}}>
          <button className="btn btn-g btn-sm" onClick={onBack}>← Back to home</button>
        </div>}
      </div>
    </div>
  );
};

/* ─── Landing Page ─────────────────────────────────────────────────────────── */
const Landing = ({ onStart, onPricing }) => (
  <div style={{background:"#05050e",minHeight:"100vh"}}>
    <nav style={{padding:"0 5%",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,background:"rgba(5,5,14,.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>✦</div>
        <span className="sora" style={{fontSize:19,fontWeight:700,color:"#f1f5f9"}}>Cognify</span>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button className="btn btn-g btn-sm" onClick={onPricing}>Pricing</button>
        <button className="btn btn-g btn-sm" onClick={onStart}>Sign In</button>
        <button className="btn btn-p btn-sm" onClick={onStart}>Get Started Free</button>
      </div>
    </nav>
    <div style={{position:"relative",padding:"100px 5% 80px",textAlign:"center",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"5%",left:"15%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.14),transparent 65%)",filter:"blur(80px)",pointerEvents:"none"}} className="glowing"/>
      <div style={{position:"relative",zIndex:1,maxWidth:820,margin:"0 auto"}}>
        <div className="fu badge bv" style={{display:"inline-flex",marginBottom:18,fontSize:12}}>✦ Powered by Claude AI + YouTube + Groq</div>
        <h1 className="fu1 sora" style={{fontSize:"clamp(30px,5.5vw,64px)",fontWeight:800,lineHeight:1.1,color:"#f1f5f9",marginBottom:20}}>The Hotstar of<br/><span className="grad">AI-Powered Learning</span></h1>
        <p className="fu2" style={{fontSize:"clamp(14px,2vw,17px)",color:"#64748b",lineHeight:1.8,marginBottom:36,maxWidth:560,margin:"0 auto 36px"}}>Type any topic. Get a full 9-module course with real YouTube videos, transcript-based notes, quizzes, Q&A and a Claude AI tutor — in under 2 minutes.</p>
        <div className="fu3" style={{display:"flex",gap:13,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn btn-p" style={{fontSize:15,padding:"15px 36px"}} onClick={onStart}>🚀 Start Free Now</button>
          <button className="btn btn-s" style={{fontSize:14,padding:"14px 26px"}} onClick={onPricing}>See Plans →</button>
        </div>
      </div>
    </div>
    <div style={{padding:"32px 5%",borderTop:"1px solid rgba(255,255,255,.04)",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
      <div style={{maxWidth:700,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:20,textAlign:"center"}}>
        {[["9","Modules / course"],["Claude","AI for Pro"],["Real","Transcripts"],["Free","To start"]].map(([v,l],i)=>(
          <div key={i}><div className="sora" style={{fontSize:26,fontWeight:800,color:"#e2e8f0"}}>{v}</div><div style={{fontSize:11,color:"#4c1d95",marginTop:3}}>{l}</div></div>
        ))}
      </div>
    </div>
    <div style={{padding:"70px 5%"}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <h2 className="sora" style={{fontSize:"clamp(22px,3vw,36px)",fontWeight:700,color:"#e2e8f0"}}>Everything in <span className="grad">one platform</span></h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16,maxWidth:980,margin:"0 auto"}}>
        {[
          {e:"🧠",t:"AI Course Generator",d:"Type any topic — AI designs your full curriculum, finds the best YouTube videos, and generates all content simultaneously."},
          {e:"📄",t:"Transcript-First AI",d:"Server-side transcript fetching. Every note, question and quiz is based on what the video actually says — not hallucinated."},
          {e:"🤖",t:"Claude AI Tutor (Pro)",d:"Ask anything. Get instant, context-aware answers from Claude — the world's most capable AI — that has read your video content."},
          {e:"🧩",t:"Adaptive Quizzes",d:"Per-module quizzes + comprehensive final exam with letter grade. Track your progress across every course."},
          {e:"📁",t:"Persistent Library",d:"Everything saved. Switch topics, come back anytime. Your courses and videos stay exactly where you left them."},
          {e:"⚡",t:"Never Get Stuck",d:"Every failure has a fallback. Transcript unavailable? Uses general knowledge. AI fails? Retries automatically. Always keeps going."},
        ].map((f,i)=><div key={i} className="card card-glow" style={{padding:"22px"}}>
          <div style={{fontSize:34,marginBottom:12}}>{f.e}</div>
          <div className="sora" style={{fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:7}}>{f.t}</div>
          <p style={{fontSize:12.5,color:"#64748b",lineHeight:1.65}}>{f.d}</p>
        </div>)}
      </div>
    </div>
    <div style={{padding:"60px 5%",textAlign:"center",borderTop:"1px solid rgba(255,255,255,.04)"}}>
      <h2 className="sora" style={{fontSize:"clamp(22px,4vw,42px)",fontWeight:800,color:"#f1f5f9",marginBottom:14}}>Ready to learn smarter?</h2>
      <p style={{color:"#64748b",fontSize:14,marginBottom:28}}>Free forever. Upgrade for the full Claude AI experience.</p>
      <button className="btn btn-p" style={{fontSize:15,padding:"16px 42px"}} onClick={onStart}>🚀 Get Started Free</button>
    </div>
    <footer style={{padding:"22px 5%",borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:9}}>
      <span className="sora" style={{color:"#4c1d95",fontSize:12}}>Cognify © 2025</span>
      <span style={{fontSize:11,color:"#374151"}}>Claude AI · Groq · YouTube · PostgreSQL · Stripe</span>
    </footer>
  </div>
);

/* ─── Main App ─────────────────────────────────────────────────────────────── */
const MainApp = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const isPro = user?.plan === "pro";

  const [tab, setTab] = useState("course");
  const [showPricing, setShowPricing] = useState(false);

  // Lifted course state — survives tab switches
  const [courseState, setCourseState] = useState({
    phase: "input", topic: "", course: null, modules: [], activeIdx: 0,
  });

  // Check for upgrade success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if(params.get("upgrade")==="success") { toast.success("🎉 Welcome to Pro! All features unlocked."); window.history.replaceState({},""," "); }
  },[]);

  const openCourse = (c) => {
    coursesAPI.get(c.id).then(r=>{
      setCourseState({ phase:"modules", topic:c.topic, course:r.data.course, modules:r.data.course.modules, activeIdx:0 });
      setTab("course");
    });
  };

  const tabs = [{id:"course",label:"📚 Course"},{id:"video",label:"🎬 Video"},{id:"dashboard",label:"📁 Library"}];

  if(showPricing) return <PricingPage onClose={()=>setShowPricing(false)}/>;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <header style={{padding:"0 18px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(5,5,14,.93)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:50,gap:11}}>
        <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={()=>{setTab("course");setCourseState(s=>({...s,phase:"input"}));}}>
          <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✦</div>
          <span className="sora" style={{fontWeight:700,fontSize:16,color:"#e2e8f0"}}>Cognify</span>
        </div>
        <div className="tab-bar desk">{tabs.map(t=><button key={t.id} className={`tab${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!isPro&&<button className="btn btn-gold btn-sm" onClick={()=>setShowPricing(true)}>⚡ Pro</button>}
          {isPro&&<span className="badge bg-gold" style={{fontSize:11}}>⚡ Pro</span>}
          <div className="desk" style={{display:"flex",alignItems:"center",gap:7}}>
            {user?.avatarUrl?<img src={user.avatarUrl} style={{width:30,height:30,borderRadius:"50%",objectFit:"cover"}} alt=""/>
              :<div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{user?.name?.[0]?.toUpperCase()}</div>}
            <span style={{fontSize:12.5,color:"#94a3b8"}}>{user?.name}</span>
          </div>
          <button className="btn btn-g btn-sm" onClick={logout}>Sign Out</button>
        </div>
      </header>
      <div className="mob-only" style={{padding:"5px 13px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",gap:3,overflowX:"auto"}}>
        {tabs.map(t=><button key={t.id} className={`tab${tab===t.id?" on":""}`} style={{flexShrink:0,fontSize:11.5,padding:"5px 11px"}} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {tab==="course"&&<CourseTab state={courseState} setState={setCourseState} onDashboard={()=>setTab("dashboard")} onUpgrade={()=>setShowPricing(true)} isPro={isPro}/>}
        {tab==="video"&&<VideoTab onDashboard={()=>setTab("dashboard")} onUpgrade={()=>setShowPricing(true)} isPro={isPro}/>}
        {tab==="dashboard"&&<Dashboard onOpenCourse={openCourse} onUpgrade={()=>setShowPricing(true)}/>}
      </div>
    </div>
  );
};

/* ─── App Root ─────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <G/>
        <AppRouter/>
      </ToastProvider>
    </AuthProvider>
  );
}

function AppRouter() {
  const { user } = useAuth();
  const [view, setView] = useState("landing"); // landing | auth | pricing
  useEffect(()=>{ if(user) setView("app"); },[user]);
  if(user)              return <MainApp/>;
  if(view==="auth")     return <AuthPage onBack={()=>setView("landing")}/>;
  if(view==="pricing")  return <PricingPage onClose={()=>setView("landing")}/>;
  return <Landing onStart={()=>setView("auth")} onPricing={()=>setView("pricing")}/>;
}
