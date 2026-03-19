// src/theme.js — Constants and default data structure (colors live in themes.js)

export const PAIN_LOCS=["Neck","Shoulder L","Shoulder R","Upper Back","Lower Back","Elbow L","Elbow R","Wrist L","Wrist R","Hip L","Hip R","Knee L","Knee R","Ankle L","Ankle R","Chest","Glute L","Glute R","Hamstring L","Hamstring R","Quad L","Quad R","Calf L","Calf R"];
export const PAIN_TYPES=["Sharp","Dull/Aching","Burning","Stiffness","Tingling","Cramping","Throbbing"];
export const SUPP_LIST=["Creatine","Vitamin D","Omega-3","Magnesium","Zinc","Vitamin C","B Complex","Ashwagandha","Iron","Protein Powder","Pre-Workout","Multivitamin","Turmeric","Collagen","L-Glutamine","Beta-Alanine","Caffeine","Melatonin","Other"];
export const GOAL_OPTS=["Muscle Mass","Strength","Explosiveness","Fat Loss","Endurance","Flexibility","General Health","Athletic Performance"];

export const NAV_PAGES=[
  {id:"nutr",label:"Nutrition",icon:"🍽️",color:"#2dd36f"},
  {id:"train",label:"Training",icon:"💪",color:"#ff9f43"},
  {id:"hydra",label:"Hydration",icon:"💧",color:"#22d3ee"},
  {id:"supps",label:"Supps",icon:"💊",color:"#b48eff"},
  {id:"sleep",label:"Sleep",icon:"🌙",color:"#818cf8"},
  {id:"life",label:"Lifestyle",icon:"🧘",color:"#f472b6"},
  {id:"health",label:"Health Import",icon:"❤️",color:"#ff4d6a"},
  {id:"body",label:"Body",icon:"📏",color:"#4dc9f6"},
  {id:"workout",label:"Workout Builder",icon:"⚡",color:"#fbbf24"},
  {id:"feedback",label:"Feedback",icon:"💬",color:"#4dc9f6"},
  {id:"settings",label:"Settings",icon:"⚙️",color:"#a0a0b8"},
];

export const DEF={
  profile:{name:"",age:"",allergies:"",goals:["Muscle Mass","Strength"],units:"imperial",
    targets:{calories:2800,protein:180,water:100},
    customAllergies:""},
  nutrition:[],training:[],postWorkout:[],prs:[],painLog:[],bodyMetrics:[],sleep:[],lifestyle:[],
  hydration:[],supplements:[],healthImports:[],heartRate:[],ecg:[],bloodOx:[],respiratory:[],stepsData:[],watchWorkouts:[],
  insights:[],aiMemory:[],suppStacks:[],feedback:[],
};
