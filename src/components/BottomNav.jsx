// src/components/BottomNav.jsx — 3-tab nav + settings gear with sliding indicator

import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext.jsx";

export default function BottomNav({current,onNav}){
  const {theme:G}=useTheme();
  const tabs=[
    {id:"home",icon:"🏠",label:"Home"},
    {id:"log",icon:"➕",label:"Log"},
    {id:"coach",icon:"🧠",label:"Coach",big:true},
  ];
  return <div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:1000,width:"auto",maxWidth:360}}>
    <div style={{background:G.bg==="f6f5f1"?"rgba(240,239,233,0.85)":"rgba(18,19,26,0.8)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:28,border:`1px solid ${G.glassBorder2}`,padding:"6px 8px",display:"flex",gap:4,alignItems:"center",boxShadow:"0 8px 32px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.05) inset"}}>
      {tabs.map(t=>{
        const isActive=current===t.id;
        return <button key={t.id} onClick={()=>onNav(t.id)}
          style={{flex:1,position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:t.big?"10px 18px":"10px 18px",border:"none",borderRadius:22,cursor:"pointer",fontFamily:"inherit",background:"transparent",transition:"all .2s"}}>
          {isActive&&<motion.div layoutId="navIndicator" style={{position:"absolute",inset:0,borderRadius:22,background:G.glass3}} transition={{type:"spring",stiffness:400,damping:35}}/>}
          <span style={{position:"relative",zIndex:1,fontSize:t.big?22:20,color:isActive?G.moss:G.dim,transition:"color .2s",filter:isActive?`drop-shadow(0 0 8px ${G.moss}60)`:"none"}}>{t.icon}</span>
          <span style={{position:"relative",zIndex:1,fontSize:9,fontWeight:isActive?700:500,color:isActive?G.moss:G.dim}}>{t.label}</span>
        </button>;
      })}
      <button onClick={()=>onNav("settings")}
        style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 12px",border:"none",borderRadius:22,cursor:"pointer",fontFamily:"inherit",background:"transparent",transition:"all .2s"}}>
        {current==="settings"&&<motion.div layoutId="navIndicator" style={{position:"absolute",inset:0,borderRadius:22,background:G.glass3}} transition={{type:"spring",stiffness:400,damping:35}}/>}
        <span style={{position:"relative",zIndex:1,fontSize:18,color:current==="settings"?G.moss:G.dim,transition:"color .2s",filter:current==="settings"?`drop-shadow(0 0 8px ${G.moss}60)`:"none"}}>⚙️</span>
        <span style={{position:"relative",zIndex:1,fontSize:8,fontWeight:current==="settings"?700:500,color:current==="settings"?G.moss:G.dim}}>More</span>
      </button>
    </div>
  </div>;
}
