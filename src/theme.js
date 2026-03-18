// src/theme.js — Colors, constants, default data structure

export const G={
  bg:"#06070b",surface:"rgba(255,255,255,0.03)",
  glass:"rgba(255,255,255,0.06)",glass2:"rgba(255,255,255,0.09)",glass3:"rgba(255,255,255,0.12)",
  glassBorder:"rgba(255,255,255,0.08)",glassBorder2:"rgba(255,255,255,0.12)",
  blur:"blur(24px)",blur2:"blur(40px)",
  txt:"#f2f2f8",sub:"#a0a0b8",dim:"#606078",muted:"#38384a",
  gMoss:["#2dd36f","#0d9e4f"],gBlue:["#4dc9f6","#2979ff"],gPurple:["#b48eff","#7c4dff"],
  gOrange:["#ff9f43","#ff6b35"],gRed:["#ff4d6a","#e02050"],gTeal:["#22d3ee","#0891b2"],
  gPink:["#f472b6","#db2777"],gAmber:["#fbbf24","#d97706"],gIndigo:["#818cf8","#4f46e5"],
  moss:"#2dd36f",blue:"#4dc9f6",purple:"#b48eff",orange:"#ff9f43",
  red:"#ff4d6a",teal:"#22d3ee",pink:"#f472b6",amber:"#fbbf24",indigo:"#818cf8",
};

export const PAIN_LOCS=["Neck","Shoulder L","Shoulder R","Upper Back","Lower Back","Elbow L","Elbow R","Wrist L","Wrist R","Hip L","Hip R","Knee L","Knee R","Ankle L","Ankle R","Chest","Glute L","Glute R","Hamstring L","Hamstring R","Quad L","Quad R","Calf L","Calf R"];
export const PAIN_TYPES=["Sharp","Dull/Aching","Burning","Stiffness","Tingling","Cramping","Throbbing"];
export const SUPP_LIST=["Creatine","Vitamin D","Omega-3","Magnesium","Zinc","Vitamin C","B Complex","Ashwagandha","Iron","Protein Powder","Pre-Workout","Multivitamin","Turmeric","Collagen","L-Glutamine","Beta-Alanine","Caffeine","Melatonin","Other"];
export const GOAL_OPTS=["Muscle Mass","Strength","Explosiveness","Fat Loss","Endurance","Flexibility","General Health","Athletic Performance"];

export const NAV_PAGES=[
  {id:"nutr",label:"Nutrition",icon:"🍽️",color:G.moss},
  {id:"train",label:"Training",icon:"💪",color:G.orange},
  {id:"hydra",label:"Hydration",icon:"💧",color:G.teal},
  {id:"supps",label:"Supps",icon:"💊",color:G.purple},
  {id:"sleep",label:"Sleep",icon:"🌙",color:G.indigo},
  {id:"life",label:"Lifestyle",icon:"🧘",color:G.pink},
  {id:"health",label:"Health Import",icon:"❤️",color:G.red},
  {id:"body",label:"Body",icon:"📏",color:G.blue},
  {id:"workout",label:"Workout Builder",icon:"⚡",color:G.amber},
  {id:"feedback",label:"Feedback",icon:"💬",color:G.blue},
  {id:"settings",label:"Settings",icon:"⚙️",color:G.sub},
];

export const DEF={
  profile:{name:"",age:"",allergies:"",goals:["Muscle Mass","Strength"],units:"imperial",
    targets:{calories:2800,protein:180,water:100},
    customAllergies:""},
  nutrition:[],training:[],postWorkout:[],prs:[],painLog:[],bodyMetrics:[],sleep:[],lifestyle:[],
  hydration:[],supplements:[],healthImports:[],heartRate:[],ecg:[],bloodOx:[],respiratory:[],stepsData:[],watchWorkouts:[],
  insights:[],aiMemory:[],suppStacks:[],feedback:[],
};
