// src/components/Toast.jsx

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext.jsx";

export default function Toast({message,color,onDone}){
  const {theme:G}=useTheme();
  useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);},[onDone]);
  return <motion.div
    initial={{opacity:0,y:10,x:"-50%"}}
    animate={{opacity:1,y:0,x:"-50%"}}
    exit={{opacity:0,y:10,x:"-50%"}}
    transition={{duration:0.25,ease:"easeOut"}}
    style={{position:"fixed",bottom:90,left:"50%",zIndex:1200,background:color||G.moss,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.3)",pointerEvents:"none",whiteSpace:"nowrap"}}>
    {message}
  </motion.div>;
}
