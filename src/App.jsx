// src/App.jsx — Shell: data loading, routing, nav, toast

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider, useTheme } from "./ThemeContext.jsx";
import { DEF } from "./theme.js";
import { ld, sv, td, uid } from "./helpers.js";
import Home from "./pages/Home.jsx";
import Log from "./pages/Log.jsx";
import Coach from "./pages/Coach.jsx";
import Settings from "./pages/Settings.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Toast from "./components/Toast.jsx";

function AppInner(){
  const {theme:G,mode}=useTheme();
  const [data,setData]=useState(DEF);
  const [page,setPage]=useState("home");
  const [initialForm,setInitialForm]=useState(null);
  const [ok,setOk]=useState(false);
  const [toast,setToast]=useState(null);

  useEffect(()=>{(async()=>{const s=await ld();if(s)setData({...DEF,...s,
    profile:{...DEF.profile,...s?.profile,targets:{...DEF.profile.targets,...s?.profile?.targets}},
    prs:s?.prs||[],painLog:s?.painLog||[],postWorkout:s?.postWorkout||[],aiMemory:s?.aiMemory||[],
    hydration:s?.hydration||[],supplements:s?.supplements||[],healthImports:s?.healthImports||[],
    heartRate:s?.heartRate||[],ecg:s?.ecg||[],bloodOx:s?.bloodOx||[],respiratory:s?.respiratory||[],
    stepsData:s?.stepsData||[],watchWorkouts:s?.watchWorkouts||[],suppStacks:s?.suppStacks||[],feedback:s?.feedback||[]});setOk(true);})();},[]);

  useEffect(()=>{const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";l.rel="stylesheet";document.head.appendChild(l);},[]);

  const quickLog=(type)=>{
    if(type==="water"){
      const nd={...data,hydration:[...data.hydration,{oz:"16",type:"Water",date:td(),time:new Date().toTimeString().slice(0,5),id:uid()}]};
      setData(nd);sv(nd);setToast({message:"💧 +16oz logged",color:G.teal});
      try{navigator.vibrate?.(50);}catch{}
    }
  };

  const go=(p,form)=>{
    if(p==="log"&&form){setInitialForm(form);setPage("log");}
    else{setInitialForm(null);setPage(p);}
  };

  if(!ok)return <div style={{background:G.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
    <div style={{color:G.moss,fontSize:28,fontWeight:800,letterSpacing:-1}}>Vitals</div>
    <div style={{display:"flex",gap:6}}>
      {[0,1,2].map(i=><motion.div key={i} style={{width:6,height:6,borderRadius:3,background:G.moss}}
        animate={{opacity:[0.2,1,0.2],scale:[0.8,1,0.8]}}
        transition={{duration:1.2,repeat:Infinity,delay:i*0.2}}/>)}
    </div>
  </div>;

  const tabTitle={home:"Vitals",log:"Log",coach:"Coach",settings:"Settings"};

  const renderPage=()=>{
    if(page==="home")return <Home data={data} go={go} onQuickLog={quickLog}/>;
    if(page==="log")return <Log data={data} setData={setData} initialForm={initialForm}/>;
    if(page==="coach")return <Coach data={data} setData={setData} go={go}/>;
    if(page==="settings")return <Settings data={data} setData={setData}/>;
    return <Home data={data} go={go} onQuickLog={quickLog}/>;
  };

  return <div style={{background:G.bg,minHeight:"100vh",fontFamily:"'Inter',sans-serif",color:G.txt,maxWidth:480,margin:"0 auto",position:"relative",paddingBottom:80}}>
    <div style={{padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,background:`${G.bg}dd`,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:`1px solid ${G.glassBorder}`}}>
      <div style={{fontSize:18,fontWeight:800,color:G.txt,letterSpacing:-.5}}>{tabTitle[page]||"Vitals"}</div>
      {page==="home"&&<button onClick={()=>go("log")} style={{background:`linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`,color:"#fff",border:"none",borderRadius:20,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 20px ${G.moss}30`}}>+ Log</button>}
    </div>
    <div style={{padding:"12px 20px 40px"}}>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{opacity:0,y:8}}
          animate={{opacity:1,y:0}}
          exit={{opacity:0,y:-8}}
          transition={{duration:0.2,ease:"easeInOut"}}>
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
    <BottomNav current={page} onNav={p=>{setInitialForm(null);setPage(p);}}/>
    <AnimatePresence>
      {toast&&<Toast key="toast" message={toast.message} color={toast.color} onDone={()=>setToast(null)}/>}
    </AnimatePresence>
  </div>;
}

export default function App(){
  return <ThemeProvider><AppInner/></ThemeProvider>;
}
