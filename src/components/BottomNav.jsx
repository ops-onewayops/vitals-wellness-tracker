// src/components/BottomNav.jsx — 3-tab nav + settings gear

import { G } from "../theme.js";

export default function BottomNav({current,onNav}){
  const tabs=[
    {id:"home",icon:"🏠",label:"Home"},
    {id:"log",icon:"➕",label:"Log"},
    {id:"coach",icon:"🧠",label:"Coach"},
  ];
  return <div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:1000,width:"auto",maxWidth:360}}>
    <div style={{background:"rgba(18,19,26,0.8)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:28,border:`1px solid ${G.glassBorder2}`,padding:"6px 8px",display:"flex",gap:4,alignItems:"center",boxShadow:"0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.05) inset"}}>
      {tabs.map(t=>{
        const isActive=current===t.id;
        return <button key={t.id} onClick={()=>onNav(t.id)}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 18px",border:"none",borderRadius:22,cursor:"pointer",fontFamily:"inherit",
            background:isActive?G.glass3:"transparent",transition:"all .2s"}}>
          <span style={{fontSize:20,color:isActive?G.moss:G.dim,transition:"color .2s",filter:isActive?`drop-shadow(0 0 8px ${G.moss}60)`:"none"}}>{t.icon}</span>
          <span style={{fontSize:9,fontWeight:isActive?700:500,color:isActive?G.moss:G.dim}}>{t.label}</span>
        </button>;
      })}
      {/* Settings gear — smaller utility button */}
      <button onClick={()=>onNav("settings")}
        style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 12px",border:"none",borderRadius:22,cursor:"pointer",fontFamily:"inherit",
          background:current==="settings"?G.glass3:"transparent",transition:"all .2s"}}>
        <span style={{fontSize:18,color:current==="settings"?G.moss:G.dim,transition:"color .2s",filter:current==="settings"?`drop-shadow(0 0 8px ${G.moss}60)`:"none"}}>⚙️</span>
        <span style={{fontSize:8,fontWeight:current==="settings"?700:500,color:current==="settings"?G.moss:G.dim}}>More</span>
      </button>
    </div>
  </div>;
}
