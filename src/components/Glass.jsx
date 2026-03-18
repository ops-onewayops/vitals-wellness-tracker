// src/components/Glass.jsx — Shared UI primitives

import { G } from "../theme.js";

export function Glass({children,style:sx={},onClick,glow}){
  return <div style={{position:"relative",overflow:"hidden",...sx}} onClick={onClick}>
    {glow&&<div style={{position:"absolute",top:"-40%",left:"-20%",width:"140%",height:"140%",background:glow,filter:"blur(60px)",opacity:.35,pointerEvents:"none",zIndex:0}}/>}
    <div style={{position:"relative",zIndex:1,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderRadius:sx.borderRadius||20,border:`1px solid ${G.glassBorder}`,padding:sx.padding||18,height:"100%",boxSizing:"border-box"}}>
      {children}
    </div>
  </div>;
}

export function GradCard({children,colors,style:sx={},onClick}){
  return <div style={{position:"relative",borderRadius:20,overflow:"hidden",cursor:onClick?"pointer":"default",...sx}} onClick={onClick}>
    <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,opacity:.85}}/>
    <div style={{position:"absolute",inset:0,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}/>
    <div style={{position:"relative",zIndex:1,padding:18,color:"#fff"}}>{children}</div>
  </div>;
}

export function Ring({pct,size=100,stroke=10,color,trackColor,children}){
  const r=(size-stroke)/2;const circ=2*Math.PI*r;const off=circ-(Math.min(pct||0,100)/100)*circ;
  return <div style={{position:"relative",width:size,height:size}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",filter:`drop-shadow(0 0 8px ${color}40)`}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor||G.muted} strokeWidth={stroke} opacity={.3}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color||G.moss} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset .8s ease"}}/>
    </svg>
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{children}</div>
  </div>;
}

export function Fld({label,type="text",value,set,opts,ph,min,max,step}){
  const s={width:"100%",background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:14,padding:"12px 14px",color:G.txt,fontSize:15,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  return <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:13,color:G.sub,marginBottom:6,fontWeight:600}}>{label}</label>}
    {opts?<select style={s} value={value} onChange={e=>set(e.target.value)}><option value="">Select...</option>{opts.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select>
      :type==="textarea"?<textarea style={{...s,minHeight:60,resize:"vertical"}} value={value} onChange={e=>set(e.target.value)} placeholder={ph}/>
        :<input style={s} type={type} value={value} onChange={e=>set(e.target.value)} placeholder={ph} min={min} max={max} step={step}/>}
  </div>;
}

export function Btn({children,onClick,v="primary",sx={},disabled}){
  const vs={primary:{background:`linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`,color:"#fff",border:"none",boxShadow:`0 4px 20px ${G.moss}30`},secondary:{background:G.glass2,color:G.txt,border:`1px solid ${G.glassBorder2}`,backdropFilter:G.blur},danger:{background:"rgba(255,77,106,0.12)",color:G.red,border:`1px solid rgba(255,77,106,0.15)`},ghost:{background:"transparent",color:G.moss,border:"none"}};
  return <button style={{padding:"12px 20px",borderRadius:14,fontSize:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",opacity:disabled?.5:1,...vs[v],...sx}} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Slider({label,value,set,min=1,max=10,color}){
  return <div style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <span style={{fontSize:13,color:G.sub,fontWeight:600}}>{label}</span>
      <span style={{fontSize:18,fontWeight:700,color:color||G.moss}}>{value}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={e=>set(e.target.value)} style={{width:"100%",accentColor:color||G.moss,height:6}}/>
  </div>;
}

export function Modal({open,onClose,title,children}){
  if(!open)return null;
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1100,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
    <div style={{width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",background:"#111218",borderRadius:"24px 24px 0 0",padding:"20px 22px 34px",border:`1px solid ${G.glassBorder2}`,borderBottom:"none",boxShadow:"0 -8px 40px rgba(0,0,0,.4)"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:40,height:4,borderRadius:2,background:G.muted,margin:"0 auto 18px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{margin:0,fontSize:20,fontWeight:700,color:G.txt}}>{title}</h3>
        <button onClick={onClose} style={{background:G.glass2,border:`1px solid ${G.glassBorder}`,width:32,height:32,borderRadius:16,color:G.sub,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>{children}
    </div>
  </div>;
}

export function EI({primary,secondary,tertiary,onDelete,color}){
  return <div style={{display:"flex",alignItems:"center",padding:"12px 14px",background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderRadius:14,marginBottom:6,border:`1px solid ${G.glassBorder}`,borderLeft:color?`3px solid ${color}`:undefined}}>
    <div style={{flex:1}}><div style={{fontSize:14,color:G.txt,fontWeight:500}}>{primary}</div>{secondary&&<div style={{fontSize:12,color:G.dim,marginTop:2}}>{secondary}</div>}</div>
    {tertiary&&<div style={{fontSize:17,fontWeight:700,color:color||G.moss,marginRight:onDelete?10:0}}>{tertiary}</div>}
    {onDelete&&<button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:G.glass2,border:"none",width:26,height:26,borderRadius:13,color:G.dim,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
  </div>;
}

export function Section({title,action,onAction,children}){
  return <div style={{marginBottom:28}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <h2 style={{fontSize:22,fontWeight:700,color:G.txt,margin:0}}>{title}</h2>
    {action&&<Btn onClick={onAction} v="ghost" sx={{fontSize:13,padding:"6px 14px"}}>{action}</Btn>}</div>{children}</div>;
}
