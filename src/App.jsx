// FORGE v5 — Drop this into src/App.jsx
// After pasting, find the two lines below and add your credentials:
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const SUPABASE_URL = "https://tzphvodzfuyrbgfeuwzk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cGh2b2R6ZnV5cmJnZmV1d3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjM0MjMsImV4cCI6MjA5MDYzOTQyM30.iJYeDxmTuV5ENUP7nJcPy0f3Bx0zhP_TTMpACKQ5Sjs";

/* ── CSS ──────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:#06080F;font-family:'DM Sans',sans-serif;color:#EEF0FF;overscroll-behavior:none}
input,select,textarea,button{font-family:'DM Sans',sans-serif}
.sora{font-family:'Sora',sans-serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%{transform:scale(.5);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes winSlide{0%{transform:translateY(120px);opacity:0}15%{transform:translateY(0);opacity:1}80%{transform:translateY(0);opacity:1}100%{transform:translateY(-30px);opacity:0}}
@keyframes glow{0%,100%{box-shadow:0 0 20px #FF450030}50%{box-shadow:0 0 40px #FF450060}}
.fade-up{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
.pop{animation:pop .35s cubic-bezier(.16,1,.3,1) both}
::-webkit-scrollbar{width:2px}
::-webkit-scrollbar-thumb{background:#1C2440;border-radius:2px}
`;

const C = { bg:"#06080F", card:"#0C1220", card2:"#111928", border:"#1C2440", accent:"#FF4500", muted:"#4A5580", text:"#EEF0FF", subtle:"#8B93C4" };

/* ── BODY PARTS ───────────────────────────────────────────────────── */
const BP = {
  Glutes:    { color:"#E879F9", icon:"🍑" }, Quads:      { color:"#60A5FA", icon:"🦵" },
  Hamstrings:{ color:"#34D399", icon:"🏃" }, Calves:     { color:"#FBBF24", icon:"⚡" },
  Chest:     { color:"#F87171", icon:"🫁" }, Back:       { color:"#FB923C", icon:"🦅" },
  Shoulders: { color:"#F472B6", icon:"🏔️" }, Biceps:     { color:"#22D3EE", icon:"💪" },
  Triceps:   { color:"#86EFAC", icon:"⚡" }, Core:       { color:"#FDE68A", icon:"🎯" },
  Cardio:    { color:"#FF6B4A", icon:"❤️" },
};

/* ── INJURY EXCLUSIONS ────────────────────────────────────────────── */
const INJURIES = [
  "Knee pain / injury",
  "Lower back pain",
  "Shoulder injury",
  "Wrist pain",
  "Hip pain / injury",
  "Ankle instability",
  "Neck issues",
  "No injuries",
];
const INJURY_EXCLUDE = {
  "Knee pain / injury":   ["Barbell Back Squat","Bulgarian Split Squat","Dumbbell Split Squat","Walking Lunge","Reverse Lunge","Jump Rope","Shuttle Runs","Box Steps","Leg Press"],
  "Lower back pain":      ["Romanian Deadlift","Single-Leg RDL","Resistance Band Deadlift","Barbell Back Squat","Shuttle Runs","Barbell Hip Thrust"],
  "Shoulder injury":      ["Barbell Bench Press","Dumbbell Shoulder Press","Arnold Press","Overhead Tricep Ext","Pull-Up","Dumbbell Chest Press","Dumbbell Lateral Raise","Dumbbell Front Raise"],
  "Wrist pain":           ["Barbell Bench Press","Full Push-Up","Knee Push-Up","Barbell Curl","Chair Dip"],
  "Hip pain / injury":    ["Barbell Hip Thrust","Dumbbell Hip Thrust","Sumo Squat","Banded Glute Bridge","Glute Bridge"],
  "Ankle instability":    ["Jump Rope","Shuttle Runs","Box Steps","Dance Fitness","Walking Lunge"],
  "Neck issues":          ["Barbell Back Squat","Barbell Bench Press","Pull-Up"],
};

/* ── EXERCISES (same DB as v4) ────────────────────────────────────── */
const EX = {
  "Bodyweight Squat":       { bp:"Quads",     lvl:"Beginner",     eq:"None",           yt:"aclHkVaku9U", sets:3, reps:"15",          desc:"Feet shoulder-width apart, squat until thighs are parallel to the floor.",tip:"Keep chest tall, weight through the full foot." },
  "Goblet Squat":           { bp:"Quads",     lvl:"Beginner",     eq:"Dumbbell",       yt:"MeIiIdhvXT4", sets:3, reps:"12",           desc:"Hold dumbbell at chest. Excellent squat pattern developer.",tip:"Elbows brush inside of knees at the bottom." },
  "Barbell Back Squat":     { bp:"Quads",     lvl:"Advanced",     eq:"Barbell + Rack", yt:"ultWZbUMPL8", sets:4, reps:"8–10",         desc:"The foundational lower body compound lift.",tip:"Brace your core like you're about to take a punch." },
  "Dumbbell Split Squat":   { bp:"Quads",     lvl:"Intermediate", eq:"Dumbbells",      yt:"wrMHbizEf_I", sets:3, reps:"10–12 each",  desc:"Staggered stance, lower back knee toward floor.",tip:"Keep front shin vertical and torso upright." },
  "Bulgarian Split Squat":  { bp:"Quads",     lvl:"Advanced",     eq:"Bench + DBs",    yt:"2C-uNgKwPLE", sets:3, reps:"8–10 each",   desc:"Rear foot elevated on a bench. Most challenging single-leg variation.",tip:"Find balance before adding weight." },
  "Leg Press":              { bp:"Quads",     lvl:"Intermediate", eq:"Machine",        yt:"IZxyjW7MPJQ", sets:3, reps:"12, 10, 8",   desc:"Push platform away, feet hip-width. Easy to progressively overload.",tip:"Don't lock out knees at the top." },
  "Reverse Lunge":          { bp:"Quads",     lvl:"Beginner",     eq:"Optional DBs",   yt:"xrjmhzf3hEY", sets:3, reps:"12 each",     desc:"Step backward and lower back knee. Easier on knees than forward lunges.",tip:"Front knee directly over ankle." },
  "Walking Lunge":          { bp:"Quads",     lvl:"Intermediate", eq:"Optional DBs",   yt:"L8fvypPrv-s", sets:3, reps:"20 total",    desc:"Alternate forward lunges across the floor.",tip:"Long stride keeps tension on the quads." },
  "Glute Bridge":           { bp:"Glutes",    lvl:"Beginner",     eq:"Bodyweight",     yt:"nuO8Y3UPRkw", sets:3, reps:"15",           desc:"Press through heels to lift hips. Activates glutes before heavier work.",tip:"Squeeze hard at the top — hold for a full second." },
  "Banded Glute Bridge":    { bp:"Glutes",    lvl:"Beginner",     eq:"Band",           yt:"ktdIgom5B18", sets:3, reps:"12",           desc:"Band above knees activates glute medius deeply.",tip:"Drive knees outward against the band throughout." },
  "Dumbbell Hip Thrust":    { bp:"Glutes",    lvl:"Intermediate", eq:"DB + Bench",     yt:"LGvSBQrKSM4", sets:3, reps:"12",           desc:"Upper back on bench, dumbbell on hips. Best home glute builder.",tip:"Upper back stays on bench — only hips move." },
  "Barbell Hip Thrust":     { bp:"Glutes",    lvl:"Intermediate", eq:"Barbell",        yt:"SEdqd5n174Q", sets:4, reps:"10–12",        desc:"The definitive glute-building exercise.",tip:"Pad the barbell, chin tucked, full hip extension." },
  "Glute Kickback (Band)":  { bp:"Glutes",    lvl:"Beginner",     eq:"Band",           yt:"5E4tcMPgCE8", sets:3, reps:"12 each",     desc:"On all fours, kick leg back squeezing glute at top.",tip:"Add ankle weight for extra resistance." },
  "Sumo Squat":             { bp:"Glutes",    lvl:"Beginner",     eq:"Optional DB",    yt:"HJbIpY3ULDo", sets:3, reps:"15",           desc:"Wide stance, toes out. Targets glutes and inner thighs.",tip:"Hold dumbbell at chest for goblet variation." },
  "Resistance Band Deadlift":{ bp:"Hamstrings",lvl:"Beginner",    eq:"Band",           yt:"op9kVnSso6Q", sets:3, reps:"15",           desc:"Band under feet, hinge at hips. Perfect hip hinge introduction.",tip:"Progress to single-leg after 2–3 weeks." },
  "Romanian Deadlift":      { bp:"Hamstrings",lvl:"Intermediate", eq:"Dumbbells",      yt:"JCXUYuzwNrM", sets:3, reps:"10–12",        desc:"Hinge at hips with slight knee bend. Feel the hamstring stretch.",tip:"Back stays flat — push hips backward, not down." },
  "Single-Leg RDL":         { bp:"Hamstrings",lvl:"Intermediate", eq:"Dumbbell",       yt:"0yc6T6sK_Sw", sets:3, reps:"10 each",     desc:"Balance on one leg while hinging. Hamstring + stability.",tip:"Hips stay perfectly square to the floor." },
  "Lying Leg Curl":         { bp:"Hamstrings",lvl:"Intermediate", eq:"Machine",        yt:"1Tq3QdYUuHs", sets:3, reps:"12, 10, 8",   desc:"Curl lower leg toward glutes. Pure hamstring isolation.",tip:"Control the lowering phase." },
  "Standing Calf Raise":    { bp:"Calves",    lvl:"Beginner",     eq:"Step (optional)",yt:"gwLzBv-s4Q4", sets:4, reps:"20",           desc:"Rise onto toes and lower slowly through full range.",tip:"Full stretch at bottom matters as much as peak contraction." },
  "Single-Leg Calf Raise":  { bp:"Calves",    lvl:"Intermediate", eq:"Step + Wall",    yt:"gwLzBv-s4Q4", sets:3, reps:"15 each",     desc:"One foot on step edge. Doubles the intensity.",tip:"Wall for balance support only." },
  "Knee Push-Up":           { bp:"Chest",     lvl:"Beginner",     eq:"Mat",            yt:"jWxvty2KROs", sets:3, reps:"12",           desc:"Knees on floor, straight line from knees to shoulders.",tip:"Women: hands slightly wider and more naturally angled." },
  "Full Push-Up":           { bp:"Chest",     lvl:"Intermediate", eq:"None",           yt:"IODxDxX7oi4", sets:3, reps:"10–15",        desc:"Straight body from head to heels. Full chest activation.",tip:"Squeeze elbows slightly toward body." },
  "Chest Press (Machine)":  { bp:"Chest",     lvl:"Beginner",     eq:"Machine",        yt:"xJBqMDWEAoI", sets:3, reps:"12",           desc:"Machine bench press. Safe and effective for beginners.",tip:"Adjust seat so handles align with mid-chest." },
  "Dumbbell Chest Press":   { bp:"Chest",     lvl:"Intermediate", eq:"DBs + Bench",    yt:"VmB1G1K7v94", sets:3, reps:"10–12",        desc:"Press dumbbells from chest to full extension.",tip:"Use the full range of motion — feel the stretch." },
  "Barbell Bench Press":    { bp:"Chest",     lvl:"Advanced",     eq:"Barbell + Bench",yt:"rT7DgCr-3pg", sets:4, reps:"8–10",         desc:"The classic compound chest exercise.",tip:"Retract shoulder blades, feet firmly on floor." },
  "Dumbbell Chest Fly":     { bp:"Chest",     lvl:"Intermediate", eq:"DBs + Bench",    yt:"eozdVDA78K0", sets:3, reps:"12–15",        desc:"Arc the dumbbells wide and back up. Pure chest isolation.",tip:"Maintain a slight permanent bend in the elbows." },
  "Resistance Band Row":    { bp:"Back",      lvl:"Beginner",     eq:"Band",           yt:"QFq7yEVUiHk", sets:3, reps:"12 each",     desc:"Stand on band, hinge forward and row to lower ribs.",tip:"Drive elbow past your hip." },
  "Dumbbell Bent-Over Row": { bp:"Back",      lvl:"Intermediate", eq:"DB + Bench",     yt:"roCP2jME3fU", sets:3, reps:"10–12 each",  desc:"One hand on bench, row dumbbell from floor to hip.",tip:"Elbow drives straight back." },
  "Lat Pulldown":           { bp:"Back",      lvl:"Intermediate", eq:"Cable Machine",  yt:"CAwf7n6Luuc", sets:3, reps:"10–12",        desc:"Pull bar to upper chest. Elbows drive down and back.",tip:"Lean back slightly, keep chest tall." },
  "Seated Cable Row":       { bp:"Back",      lvl:"Intermediate", eq:"Cable Machine",  yt:"GZbfZ033f74", sets:3, reps:"10–12",        desc:"Seated row to lower ribs. Squeeze shoulder blades at end.",tip:"Don't rock torso." },
  "Pull-Up":                { bp:"Back",      lvl:"Advanced",     eq:"Pull-up Bar",    yt:"eGo4IYlbE5g", sets:3, reps:"5–8",          desc:"Drive elbows down to pull chin above bar.",tip:"Start with negatives." },
  "Face Pull":              { bp:"Back",      lvl:"Intermediate", eq:"Cable or Band",  yt:"rep-qVOkidI", sets:3, reps:"15–20",        desc:"Pull toward face with external rotation. Shoulder health essential.",tip:"Hands finish beside your ears." },
  "Band Pull-Apart":        { bp:"Shoulders", lvl:"Beginner",     eq:"Band",           yt:"wlDVi3OKXrI", sets:3, reps:"20",           desc:"Pull band apart squeezing shoulder blades. Excellent warm-up.",tip:"Do this before every upper body session." },
  "Dumbbell Lateral Raise": { bp:"Shoulders", lvl:"Beginner",     eq:"Dumbbells",      yt:"3VcKaXpzqRo", sets:3, reps:"15",           desc:"Raise to shoulder height. Targets medial deltoid for width.",tip:"Lead with elbows — imagine pouring water from a jug." },
  "Dumbbell Front Raise":   { bp:"Shoulders", lvl:"Beginner",     eq:"Dumbbells",      yt:"Gu-QdgE-puA", sets:2, reps:"12",           desc:"Raise both arms forward to eye level.",tip:"Keep core braced to avoid swinging." },
  "Dumbbell Shoulder Press":{ bp:"Shoulders", lvl:"Intermediate", eq:"Dumbbells",      yt:"qEwKCR5JCog", sets:3, reps:"10–12",        desc:"Press from ear height to overhead. Full deltoid activation.",tip:"Don't arch lower back — keep ribs down." },
  "Arnold Press":           { bp:"Shoulders", lvl:"Intermediate", eq:"Dumbbells",      yt:"6Z15_WdXmVw", sets:3, reps:"10–12",        desc:"Rotate palms inward to outward as you press.",tip:"Hits all three deltoid heads in one movement." },
  "Dumbbell Bicep Curl":    { bp:"Biceps",    lvl:"Beginner",     eq:"Dumbbells",      yt:"ykJmrZ5v0Oo", sets:3, reps:"12",           desc:"Classic curl. Supinate wrist as you curl up.",tip:"Keep elbows pinned to your sides." },
  "Hammer Curl":            { bp:"Biceps",    lvl:"Beginner",     eq:"Dumbbells",      yt:"TwD-YGVP4Bk", sets:3, reps:"12",           desc:"Neutral grip throughout. Targets brachialis for arm thickness.",tip:"Great for overall arm thickness." },
  "Barbell Curl":           { bp:"Biceps",    lvl:"Intermediate", eq:"Barbell",        yt:"LY1V6UbRHFM", sets:3, reps:"10–12",        desc:"Classic barbell curl. Allows heavier loading.",tip:"Keep wrists straight throughout." },
  "Chair Dip":              { bp:"Triceps",   lvl:"Beginner",     eq:"Chair",          yt:"0326dy_-CzM", sets:3, reps:"12",           desc:"Hands on chair, lower and press. Pure bodyweight tricep builder.",tip:"Further feet = harder." },
  "Band Tricep Pushdown":   { bp:"Triceps",   lvl:"Beginner",     eq:"Band",           yt:"vB5OHsJ3EME", sets:3, reps:"15",           desc:"Push down extending elbow to full lockout.",tip:"Keep elbows pinned tight to sides." },
  "Overhead Tricep Ext":    { bp:"Triceps",   lvl:"Intermediate", eq:"DB or Band",     yt:"nRiJVZDpdL0", sets:3, reps:"12",           desc:"Weight overhead, bend elbows to lower behind head.",tip:"Only position that fully stretches the long head." },
  "Plank":                  { bp:"Core",      lvl:"Beginner",     eq:"Mat",            yt:"pSHjTRCQxIw", sets:3, reps:"30–45 sec",   desc:"Squeeze abs, glutes, and quads simultaneously.",tip:"Perfect straight line — no sagging or piking." },
  "Dead Bug":               { bp:"Core",      lvl:"Beginner",     eq:"Mat",            yt:"4XLEnwUr1d8", sets:3, reps:"10 each",     desc:"Extend opposite arm and leg. Anti-extension stability.",tip:"Press lower back into floor the entire time." },
  "Bicycle Crunch":         { bp:"Core",      lvl:"Intermediate", eq:"Mat",            yt:"1we3bh9uhqY", sets:3, reps:"20 total",   desc:"Alternating elbow-to-knee. Full oblique engagement.",tip:"Slow and controlled — quality over speed." },
  "Leg Raise":              { bp:"Core",      lvl:"Intermediate", eq:"Mat",            yt:"JB2oyawG9KI", sets:3, reps:"12",           desc:"Raise straight legs to 90 degrees. Lower ab challenge.",tip:"Press lower back down as legs lower." },
  "Side Plank":             { bp:"Core",      lvl:"Intermediate", eq:"Mat",            yt:"_rdfjFSFKMY", sets:2, reps:"30 sec each", desc:"Support on one forearm. Lateral core stability.",tip:"Hip stays high throughout." },
  "Brisk Walk":             { bp:"Cardio",    lvl:"Beginner",     eq:"None",           yt:"o3LiGRZl3Is", sets:1, reps:"30–45 min",  desc:"Elevated heart rate but still conversational. Zone 2 training.",tip:"Arms pumping actively." },
  "Stationary Cycling":     { bp:"Cardio",    lvl:"Beginner",     eq:"Stationary Bike",yt:"PwWMPiHhF9s", sets:1, reps:"20–45 min",  desc:"Low-impact cardio you can do while watching TV.",tip:"Zone 2: you can talk but are slightly breathless." },
  "Swimming Laps":          { bp:"Cardio",    lvl:"Beginner",     eq:"Pool",           yt:"gh5mAtmeR3Y", sets:1, reps:"30–45 min",  desc:"Full-body low-impact cardio. Great active recovery.",tip:"Mix strokes for a complete full-body session." },
  "Pilates Flow":           { bp:"Cardio",    lvl:"Beginner",     eq:"Mat",            yt:"g-8n6xaU5Cg", sets:1, reps:"45–60 min",  desc:"Core-focused movement building strength and flexibility.",tip:"Breath drives the movement in Pilates." },
  "Jump Rope":              { bp:"Cardio",    lvl:"Intermediate", eq:"Jump Rope",      yt:"u3zgHI8QnqE", sets:1, reps:"10 min",     desc:"High-intensity cardio. Burns significant calories quickly.",tip:"Land softly on balls of feet." },
  "Dance Fitness":          { bp:"Cardio",    lvl:"Intermediate", eq:"None",           yt:"oR_4w8VJ-PQ", sets:1, reps:"20–40 min",  desc:"High-energy dance cardio at maximum heart rate.",tip:"You should NOT be able to hold a conversation." },
  "Box Steps":              { bp:"Cardio",    lvl:"Intermediate", eq:"Step or Chair",  yt:"dQqApCWDlsZ", sets:2, reps:"20 each leg",desc:"Step up on a surface. Combines lower body strength with cardio.",tip:"Lead with alternate legs each set." },
  "Shuttle Runs":           { bp:"Cardio",    lvl:"Advanced",     eq:"Open Space",     yt:"uPOFWDlbBn4", sets:1, reps:"6,5,4,3,2,1",desc:"Sprint end-to-end in descending rounds. Maximum effort.",tip:"Maximum effort on every single sprint." },
};

/* ── GENDER NOTES ─────────────────────────────────────────────────── */
const GENDER_NOTES = {
  Female: {
    levelNote: "For women, research shows glute and lower body training with hip-dominant movements delivers the strongest results early on. Your plan is weighted toward this.",
    priorityBP: ["Glutes","Quads","Hamstrings","Core"],
  },
  Male: {
    levelNote: "For men, compound push/pull movements with progressive overload drive the fastest strength gains. Your plan prioritises upper-lower balance.",
    priorityBP: ["Chest","Back","Shoulders","Quads"],
  },
  "Prefer not to say": {
    levelNote: "Your plan is built for balanced full-body development.",
    priorityBP: ["Quads","Glutes","Chest","Back"],
  },
};

/* ── PRESET PLANS ─────────────────────────────────────────────────── */
const PRESET_PLANS = {
  Beginner: {
    label:"Full Body (3× / week)",
    rationale:"Beginners build strength fastest training each muscle group 3× per week. Neural adaptation accelerates faster with full body sessions — proven by research to be No.1 for 0–3 months.",
    days:{
      1:{focus:"Full Body A",emoji:"💪",color:"#34D399",tag:"HOME",type:"strength",exs:[{n:"Goblet Squat",s:3,r:"10–12",bp:"Quads"},{n:"Knee Push-Up",s:3,r:"10",bp:"Chest"},{n:"Resistance Band Row",s:3,r:"12",bp:"Back"},{n:"Glute Bridge",s:3,r:"15",bp:"Glutes"},{n:"Dumbbell Lateral Raise",s:2,r:"12",bp:"Shoulders"},{n:"Plank",s:3,r:"30 sec",bp:"Core"}]},
      2:{focus:"Light Cardio",emoji:"❤️",color:"#FF6B4A",tag:"HOME",type:"pick-one",note:"Pick ONE — conversational pace. Slightly breathless but still able to talk.",opts:[{n:"Brisk Walk",d:"30–45 min"},{n:"Stationary Cycling",d:"20–40 min"},{n:"Swimming Laps",d:"30 min"},{n:"Pilates Flow",d:"45 min"}]},
      3:{focus:"Full Body B",emoji:"🔥",color:"#60A5FA",tag:"HOME",type:"strength",exs:[{n:"Reverse Lunge",s:3,r:"12 each",bp:"Quads"},{n:"Dumbbell Chest Press",s:3,r:"10",bp:"Chest"},{n:"Dumbbell Bent-Over Row",s:3,r:"10 each",bp:"Back"},{n:"Banded Glute Bridge",s:3,r:"12",bp:"Glutes"},{n:"Dumbbell Shoulder Press",s:2,r:"12",bp:"Shoulders"},{n:"Dead Bug",s:3,r:"10 each",bp:"Core"}]},
      4:{focus:"Active Rest",emoji:"🌿",color:"#4A5580",tag:"REST",type:"rest",exs:[],note:"Move gently — a walk, stretching, or nothing. Intentional recovery."},
      5:{focus:"Full Body C",emoji:"⚡",color:"#E879F9",tag:"HOME/GYM",type:"strength",exs:[{n:"Bodyweight Squat",s:3,r:"15",bp:"Quads"},{n:"Full Push-Up",s:3,r:"8–12",bp:"Chest"},{n:"Lat Pulldown",s:3,r:"12",bp:"Back"},{n:"Dumbbell Hip Thrust",s:3,r:"12",bp:"Glutes"},{n:"Arnold Press",s:3,r:"10",bp:"Shoulders"},{n:"Bicycle Crunch",s:3,r:"20",bp:"Core"}]},
      6:{focus:"Cardio + Fun",emoji:"😄",color:"#FBBF24",tag:"HOME",type:"pick-one",note:"Higher effort today — push a bit more.",opts:[{n:"Dance Fitness",d:"30 min"},{n:"Jump Rope",d:"10 min"},{n:"Brisk Walk",d:"45 min"}]},
      0:{focus:"Rest Day",emoji:"😴",color:"#4A5580",tag:"REST",type:"rest",exs:[],note:"Complete rest. Muscles grow during recovery."},
    }
  },
  Intermediate:{
    label:"Upper / Lower Split (4× / week)",
    rationale:"With 6+ months experience, Upper/Lower delivers more volume per muscle group per session, driving greater hypertrophy. Each muscle still gets 2× frequency per week.",
    days:{
      1:{focus:"Upper — Push",emoji:"💪",color:"#F87171",tag:"GYM",type:"strength",exs:[{n:"Barbell Bench Press",s:4,r:"8–10",bp:"Chest"},{n:"Dumbbell Shoulder Press",s:3,r:"10–12",bp:"Shoulders"},{n:"Dumbbell Lateral Raise",s:3,r:"15",bp:"Shoulders"},{n:"Arnold Press",s:3,r:"10",bp:"Shoulders"},{n:"Overhead Tricep Ext",s:3,r:"12",bp:"Triceps"}]},
      2:{focus:"Lower — Quads",emoji:"🦵",color:"#60A5FA",tag:"GYM",type:"strength",exs:[{n:"Barbell Back Squat",s:4,r:"8–10",bp:"Quads"},{n:"Leg Press",s:3,r:"12, 10, 8",bp:"Quads"},{n:"Dumbbell Split Squat",s:3,r:"10 each",bp:"Quads"},{n:"Lying Leg Curl",s:3,r:"12",bp:"Hamstrings"},{n:"Standing Calf Raise",s:4,r:"20",bp:"Calves"},{n:"Plank",s:3,r:"45 sec",bp:"Core"}]},
      3:{focus:"Rest + Cardio",emoji:"❤️",color:"#4A5580",tag:"HOME",type:"pick-one",note:"Active recovery — light cardio only.",opts:[{n:"Brisk Walk",d:"30 min"},{n:"Swimming Laps",d:"30 min"},{n:"Pilates Flow",d:"45 min"}]},
      4:{focus:"Upper — Pull",emoji:"🦅",color:"#FB923C",tag:"GYM",type:"strength",exs:[{n:"Pull-Up",s:3,r:"5–8",bp:"Back"},{n:"Lat Pulldown",s:3,r:"10–12",bp:"Back"},{n:"Seated Cable Row",s:3,r:"10–12",bp:"Back"},{n:"Dumbbell Bicep Curl",s:3,r:"12",bp:"Biceps"},{n:"Hammer Curl",s:3,r:"12",bp:"Biceps"}]},
      5:{focus:"Lower — Glutes & Hams",emoji:"🍑",color:"#E879F9",tag:"GYM",type:"strength",exs:[{n:"Romanian Deadlift",s:4,r:"10–12",bp:"Hamstrings"},{n:"Barbell Hip Thrust",s:4,r:"10–12",bp:"Glutes"},{n:"Single-Leg RDL",s:3,r:"10 each",bp:"Hamstrings"},{n:"Glute Kickback (Band)",s:3,r:"12 each",bp:"Glutes"},{n:"Lying Leg Curl",s:3,r:"12",bp:"Hamstrings"}]},
      6:{focus:"Active Recovery",emoji:"🌿",color:"#4A5580",tag:"REST",type:"rest",exs:[],note:"Foam roll, stretch, walk. Intentional recovery aids adaptation."},
      0:{focus:"Rest Day",emoji:"😴",color:"#4A5580",tag:"REST",type:"rest",exs:[]},
    }
  },
  Advanced:{
    label:"Push / Pull / Legs (6× / week)",
    rationale:"For 2+ years of training, PPL 6× maximises weekly volume while hitting each muscle twice. ~14–20 sets per muscle per week — the evidence-based sweet spot for hypertrophy.",
    days:{
      1:{focus:"Push A — Chest & Shoulders",emoji:"🫁",color:"#F87171",tag:"GYM",type:"strength",exs:[{n:"Barbell Bench Press",s:4,r:"6–8",bp:"Chest"},{n:"Dumbbell Chest Press",s:3,r:"10–12",bp:"Chest"},{n:"Dumbbell Shoulder Press",s:4,r:"8–10",bp:"Shoulders"},{n:"Dumbbell Lateral Raise",s:4,r:"15",bp:"Shoulders"},{n:"Overhead Tricep Ext",s:3,r:"12",bp:"Triceps"}]},
      2:{focus:"Pull A — Back & Biceps",emoji:"🦅",color:"#FB923C",tag:"GYM",type:"strength",exs:[{n:"Pull-Up",s:4,r:"6–10",bp:"Back"},{n:"Lat Pulldown",s:3,r:"10–12",bp:"Back"},{n:"Seated Cable Row",s:3,r:"10–12",bp:"Back"},{n:"Dumbbell Bicep Curl",s:3,r:"12",bp:"Biceps"},{n:"Hammer Curl",s:3,r:"12",bp:"Biceps"}]},
      3:{focus:"Legs A — Quads",emoji:"🦵",color:"#60A5FA",tag:"GYM",type:"strength",exs:[{n:"Barbell Back Squat",s:4,r:"6–8",bp:"Quads"},{n:"Leg Press",s:3,r:"10–12",bp:"Quads"},{n:"Bulgarian Split Squat",s:3,r:"8 each",bp:"Quads"},{n:"Standing Calf Raise",s:5,r:"20",bp:"Calves"}]},
      4:{focus:"Push B — Shoulders",emoji:"🏔️",color:"#F472B6",tag:"GYM",type:"strength",exs:[{n:"Arnold Press",s:4,r:"10",bp:"Shoulders"},{n:"Dumbbell Lateral Raise",s:4,r:"15",bp:"Shoulders"},{n:"Dumbbell Chest Press",s:3,r:"10",bp:"Chest"},{n:"Band Tricep Pushdown",s:3,r:"15",bp:"Triceps"}]},
      5:{focus:"Pull B — Back",emoji:"💪",color:"#22D3EE",tag:"GYM",type:"strength",exs:[{n:"Seated Cable Row",s:4,r:"10–12",bp:"Back"},{n:"Dumbbell Bent-Over Row",s:3,r:"10 each",bp:"Back"},{n:"Pull-Up",s:3,r:"8",bp:"Back"},{n:"Dumbbell Bicep Curl",s:3,r:"10",bp:"Biceps"}]},
      6:{focus:"Legs B — Glutes & Hams",emoji:"🍑",color:"#E879F9",tag:"GYM",type:"strength",exs:[{n:"Barbell Hip Thrust",s:4,r:"8–10",bp:"Glutes"},{n:"Romanian Deadlift",s:4,r:"10–12",bp:"Hamstrings"},{n:"Single-Leg RDL",s:3,r:"10 each",bp:"Hamstrings"},{n:"Glute Kickback (Band)",s:3,r:"12 each",bp:"Glutes"}]},
      0:{focus:"Active Rest",emoji:"🌿",color:"#4A5580",tag:"REST",type:"rest",exs:[],note:"Complete rest. You've earned it."},
    }
  }
};

const LEVEL_ORDER = ["Beginner","Intermediate","Advanced"];
const RECOVERY_EXS = [
  {n:"Foam Rolling",s:1,r:"5–10 min",bp:"Core"},
  {n:"Full-Body Stretching",s:1,r:"5–10 min",bp:"Core"},
];

const STRETCH_BY_DAY = {
  0: { label:"Upper body stretch", search:"upper body stretching routine after workout" },
  1: { label:"Full body stretch", search:"full body stretching routine 10 minutes" },
  2: { label:"Leg & glute stretch", search:"leg day stretching routine quad hamstring glute stretch" },
  3: { label:"Chest & back stretch", search:"chest back shoulder stretching routine after workout" },
  4: { label:"Cardio cooldown stretch", search:"cardio cooldown stretching routine 10 minutes" },
  5: { label:"Active recovery stretch", search:"active recovery stretching routine full body" },
  6: { label:"Glute & hamstring stretch", search:"glute hamstring leg day stretching routine" },
};

const WARMUP_BY_DAY = {
  0: { label:"Upper body warmup", search:"upper body warmup routine before workout" },
  1: { label:"Full body warmup", search:"full body warmup routine 5 minutes" },
  2: { label:"Leg day warmup", search:"leg day warmup routine dynamic stretching" },
  3: { label:"Chest back warmup", search:"chest back warmup routine before workout" },
  4: { label:"Cardio warmup", search:"cardio warmup routine dynamic stretching" },
  5: { label:"Light movement warmup", search:"gentle warmup routine active recovery" },
  6: { label:"Leg day warmup", search:"glute leg warmup routine gym before workout" },
};
const FULL_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_ABB   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MOTIVATION = ["Every rep is a vote for who you're becoming. 🔥","Strong is a skill — you're practising it right now. 💪","Consistency beats intensity. Show up. ⚡","You're one workout away from a good mood. 🌟","Progress is progress — even slow. 💎","Stronger than yesterday. That's the only goal. 🚀","Don't think. Just start. The rest follows. 🎯"];
const ACHVS = [
  {id:"first_log",icon:"🔥",title:"First Rep!",desc:"Completed your very first exercise"},
  {id:"streak_3", icon:"⚡",title:"3-Day Streak",desc:"3 consecutive days of training"},
  {id:"streak_7", icon:"🏆",title:"Week Warrior",desc:"7 days straight — you're on fire"},
  {id:"streak_14",icon:"💎",title:"Two-Week Titan",desc:"14-day streak. Incredibly consistent."},
  {id:"streak_30",icon:"👑",title:"Monthly Legend",desc:"30-day streak. This is elite."},
  {id:"pr_broken", icon:"🚀",title:"New Personal Record!",desc:"Hit a new weight PR on any exercise"},
  {id:"strength_10",icon:"📈",title:"Consistent Lifter",desc:"10 strength sessions completed"},
  {id:"weight_7",  icon:"📊",title:"Data Driven",desc:"7 weight entries logged"},
];

/* ── UTILS ────────────────────────────────────────────────────────── */
const dk = (d=new Date()) => d.toISOString().split("T")[0];
const fmtDate = d => new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const addDays = (s,n) => { const d=new Date(s+"T12:00:00"); d.setDate(d.getDate()+n); return dk(d); };
function calcStreak(logs){let s=0;for(let i=0;i<90;i++){const d=new Date();d.setDate(d.getDate()-i);const l=logs[dk(d)]||{};if(Object.keys(l).some(k=>k.startsWith("done_")&&l[k]))s++;else if(i>0)break;}return s;}
function getEarned(data,streak){const s=new Set(data.earnedAchievements||[]);const tot=Object.values(data.logs||{}).reduce((a,l)=>a+Object.keys(l).filter(k=>k.startsWith("done_")&&l[k]).length,0);if(tot>=1)s.add("first_log");if(streak>=3)s.add("streak_3");if(streak>=7)s.add("streak_7");if(streak>=14)s.add("streak_14");if(streak>=30)s.add("streak_30");if((data.strength||[]).length>=10)s.add("strength_10");if((data.weightLog||[]).length>=7)s.add("weight_7");return[...s];}

function filterExercisesForInjuries(exList, injuries) {
  if (!injuries || injuries.includes("No injuries")) return exList;
  const excluded = new Set(injuries.flatMap(inj => INJURY_EXCLUDE[inj]||[]));
  return exList.filter(ex => !excluded.has(ex.n));
}

function applyInjuriesToPlan(plan, injuries) {
  if (!injuries || injuries.includes("No injuries")) return plan;
  const newPlan = {};
  Object.entries(plan).forEach(([d,day]) => {
    newPlan[d] = { ...day, exs:(day.exs||[]).filter(ex=>!injuries.flatMap(inj=>INJURY_EXCLUDE[inj]||[]).includes(ex.n)) };
  });
  return newPlan;
}

/* ── SUPABASE ─────────────────────────────────────────────────────── */
let _sb = null;
function getSB() {
  if (_sb) return _sb;
  if (SUPABASE_URL === "YOUR_SUPABASE_URL_HERE") return null;
  try { _sb = createClient(SUPABASE_URL, SUPABASE_KEY); return _sb; } catch { return null; }
}

/* ── STORAGE ──────────────────────────────────────────────────────── */
function useStorage(userId) {
  const [data,setData]=useState({profile:null,logs:{},strength:[],weightLog:[],earnedAchievements:[],targets:{}});
  const [ready,setReady]=useState(false);
  const q=useRef({}),timer=useRef(null);

  useEffect(()=>{
    if(!userId&&getSB()){setReady(true);return;}
    (async()=>{
      const d={profile:null,logs:{},strength:[],weightLog:[],earnedAchievements:[],targets:{}};
      const sb=getSB();
      if(sb&&userId){
        try{const{data:rows}=await sb.from("forge_data").select("key,value").eq("user_id",userId);
          (rows||[]).forEach(r=>{try{const v=JSON.parse(r.value);if(r.key==="profile")d.profile=v;else if(r.key==="strength")d.strength=v;else if(r.key==="weight")d.weightLog=v;else if(r.key==="achievements")d.earnedAchievements=v;else if(r.key==="targets")d.targets=v;else if(r.key.startsWith("log_"))d.logs[r.key.slice(4)]=v;}catch{}});}catch{}
      }else{try{const s=localStorage.getItem("forge_local");if(s)Object.assign(d,JSON.parse(s));}catch{}}
      setData(d);setReady(true);
    })();
  },[userId]);

  const flush=useCallback(()=>{
    const p={...q.current};q.current={};const sb=getSB();
    Object.entries(p).forEach(async([k,v])=>{
      if(sb&&userId){try{await sb.from("forge_data").upsert({user_id:userId,key:k,value:JSON.stringify(v),updated_at:new Date().toISOString()});}catch{}}
      else{try{const s=JSON.parse(localStorage.getItem("forge_local")||"{}");s[k]=v;localStorage.setItem("forge_local",JSON.stringify(s));}catch{}}
    });
  },[userId]);

  const save=useCallback((k,v)=>{q.current[k]=v;if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(flush,700);},[flush]);
  const setProfile=useCallback(p=>{setData(d=>({...d,profile:p}));save("profile",p);},[save]);
  const setLog=useCallback((date,log)=>{setData(d=>({...d,logs:{...d.logs,[date]:log}}));save(`log_${date}`,log);},[save]);
  const addStrength=useCallback(e=>{setData(d=>{const s=[...d.strength,{...e,id:Date.now()}];save("strength",s);return{...d,strength:s}});},[save]);
  const addWeight=useCallback(e=>{setData(d=>{const w=[...d.weightLog.filter(x=>x.date!==e.date),e].sort((a,b)=>a.date<b.date?-1:1);save("weight",w);return{...d,weightLog:w}});},[save]);
  const saveAchievements=useCallback(a=>{setData(d=>({...d,earnedAchievements:a}));save("achievements",a);},[save]);
  const saveTargets=useCallback(t=>{setData(d=>({...d,targets:t}));save("targets",t);},[save]);
  return{data,ready,setProfile,setLog,addStrength,addWeight,saveAchievements,saveTargets};
}

/* ── AUTH ─────────────────────────────────────────────────────────── */
function useAuth(){
  const [user,setUser]=useState(null);const [authLoading,setAuthLoading]=useState(true);const sb=getSB();
  useEffect(()=>{
    if(!sb){setAuthLoading(false);return;}
    sb.auth.getSession().then(({data})=>{setUser(data?.session?.user||null);setAuthLoading(false);});
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{setUser(session?.user||null);});
    return()=>subscription?.unsubscribe();
  },[]);
  const signInGoogle=async()=>{if(!sb)return;await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});};
  const signOut=async()=>{if(!sb)return;await sb.auth.signOut();setUser(null);};
  return{user,authLoading,signInGoogle,signOut,hasSB:!!sb};
}

/* ── SHARED UI ────────────────────────────────────────────────────── */
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16,...style,...(onClick?{cursor:"pointer"}:{})}}>{children}</div>;
const Ring=({pct,color,size=54,sw=4.5})=>{const r=(size-sw*2)/2,c=2*Math.PI*r,off=c-c*Math.min(pct,100)/100;return(<div style={{position:"relative",width:size,height:size,flexShrink:0}}><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1C2440" strokeWidth={sw}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)"}}/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color}}>{pct}%</div></div>);};
const Chip=({label,color=C.accent,active,onClick,small})=><button onClick={onClick} style={{padding:small?"4px 10px":"7px 14px",borderRadius:30,fontSize:small?11:13,fontWeight:600,border:`1.5px solid ${active?color:C.border}`,background:active?color+"22":"transparent",color:active?color:C.muted,cursor:"pointer",transition:"all .18s",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}}>{label}</button>;
const Pill=({label,color})=><span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:.5,textTransform:"uppercase",background:color+"22",color}}>{label}</span>;
const Btn=({children,onClick,color=C.accent,secondary,disabled,style})=><button onClick={disabled?undefined:onClick} style={{padding:"13px 20px",borderRadius:14,border:secondary?`1.5px solid ${C.border}`:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:14,transition:"all .2s",background:disabled?"#1C2440":secondary?"transparent":color,color:disabled?C.muted:secondary?C.subtle:C.text,opacity:disabled?.5:1,...style}}>{children}</button>;
const Inp=({label,value,onChange,placeholder,type="text",suffix,style})=><div style={style}>{label&&<div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:5}}>{label}</div>}<div style={{position:"relative"}}><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} style={{width:"100%",background:"#080B15",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",paddingRight:suffix?36:14,fontFamily:"DM Sans,sans-serif"}}/>{suffix&&<span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:12,color:C.muted}}>{suffix}</span>}</div></div>;
const Toast=({msg})=>msg?<div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:"#141E38",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:600,zIndex:999,whiteSpace:"nowrap",animation:"fadeUp .3s ease",boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}>{msg}</div>:null;

function YTThumb({yt, name, bp, height=100}){
  const color = BP[bp]?.color || C.accent;
  const searchQuery = encodeURIComponent(`how to do ${name||""} exercise proper form`);
  const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
  return(
    <div onClick={()=>window.open(searchUrl,"_blank")}
      style={{height, borderRadius:12, background:`linear-gradient(135deg,${color}18,${color}08)`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        border:`1.5px solid ${color}30`, cursor:"pointer", gap:8, transition:"all .2s"}}>
      <div style={{width:44,height:44,background:"#FF0000CC",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{color:"#fff",fontSize:16,marginLeft:3}}>▶</span>
      </div>
      <div style={{fontSize:11,color,fontWeight:700,textAlign:"center",padding:"0 12px",lineHeight:1.4}}>
        Watch on YouTube<br/>
        <span style={{fontSize:10,color:C.muted,fontWeight:400}}>Best tutorial auto-selected</span>
      </div>
    </div>
  );
}

function AchievementBanner({achievement,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3800);return()=>clearTimeout(t);},[]);
  return(<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",zIndex:1000,animation:"winSlide 3.8s ease forwards",pointerEvents:"none"}}><div style={{background:"linear-gradient(135deg,#1A2040,#0C1830)",border:"1.5px solid #3A4570",borderRadius:20,padding:"14px 20px",display:"flex",gap:14,alignItems:"center",boxShadow:"0 20px 60px rgba(0,0,0,.8)",minWidth:280}}><div style={{fontSize:36,animation:"pop .4s cubic-bezier(.16,1,.3,1)"}}>{achievement.icon}</div><div><div style={{fontSize:10,color:C.accent,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Achievement Unlocked!</div><div className="sora" style={{fontSize:15,fontWeight:800}}>{achievement.title}</div><div style={{fontSize:11,color:C.subtle}}>{achievement.desc}</div></div></div></div>);
}

/* ── SHARE MODAL ──────────────────────────────────────────────────── */
function ShareModal({data,streak,onClose}){
  const [copied,setCopied]=useState(false);
  const totalDone=Object.values(data.logs||{}).reduce((s,l)=>s+Object.keys(l).filter(k=>k.startsWith("done_")&&l[k]).length,0);
  const latest=(data.weightLog||[]).slice(-1)[0];
  const txt=`💪 My FORGE stats:\n🔥 ${streak}-day streak\n✅ ${totalDone} exercises completed${latest?`\n⚖️ ${latest.weight}${latest.unit} current weight`:""}\n\nTracking my fitness journey on FORGE — forgebetteryou.netlify.app`;

  const share=async()=>{
    try{if(navigator.share)await navigator.share({title:"My FORGE Progress",text:txt,url:"https://forgebetteryou.netlify.app"});}catch{}
  };
  const copy=async()=>{
    try{await navigator.clipboard.writeText(txt);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}
  };
  const whatsapp=()=>window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
  const twitter=()=>window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}`,"_blank");
  const instagram=()=>{copy();alert("Text copied! Open Instagram and paste in your story or DM 🔥");};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:430,paddingBottom:40}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:C.border,borderRadius:4,margin:"0 auto 20px"}}/>
        <div className="sora" style={{fontSize:18,fontWeight:800,marginBottom:6}}>Share Your Progress 📤</div>
        <p style={{fontSize:13,color:C.subtle,marginBottom:18,lineHeight:1.6}}>Show your friends what you've been building.</p>
        {/* Preview card */}
        <div style={{background:"linear-gradient(135deg,#1A0A00,#0C1830)",border:`1.5px solid ${C.border}`,borderRadius:16,padding:18,marginBottom:18}}>
          <div className="sora" style={{fontSize:22,fontWeight:900,marginBottom:12}}>FORGE<span style={{color:C.accent}}>.</span></div>
          <div style={{display:"flex",gap:16,marginBottom:12}}>
            {[{label:"Streak",val:`${streak}d`,icon:"🔥",color:C.accent},{label:"Exercises",val:totalDone,icon:"✅",color:"#34D399"},{label:"Sessions",val:(data.strength||[]).length,icon:"💪",color:"#E879F9"}].map(({label,val,icon,color})=>(
              <div key={label} style={{flex:1,textAlign:"center",background:"rgba(255,255,255,.05)",borderRadius:12,padding:"10px 6px"}}>
                <div style={{fontSize:18}}>{icon}</div>
                <div className="sora" style={{fontSize:18,fontWeight:900,color}}>{val}</div>
                <div style={{fontSize:10,color:C.muted}}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:C.muted}}>forgebetteryou.netlify.app</div>
        </div>
        {/* Share buttons */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <button onClick={whatsapp} style={{padding:"12px",borderRadius:12,background:"#25D366",color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"DM Sans,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 WhatsApp</button>
          <button onClick={twitter} style={{padding:"12px",borderRadius:12,background:"#1DA1F2",color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"DM Sans,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>🐦 Twitter / X</button>
          <button onClick={instagram} style={{padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#E1306C,#833AB4)",color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"DM Sans,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>📸 Instagram</button>
          <button onClick={copy} style={{padding:"12px",borderRadius:12,background:copied?"#34D39920":C.card2,color:copied?"#34D399":C.subtle,border:`1.5px solid ${copied?"#34D399":C.border}`,cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"DM Sans,sans-serif"}}>{copied?"✓ Copied!":"📋 Copy text"}</button>
        </div>
        {navigator.share&&<button onClick={share} style={{width:"100%",padding:"13px",borderRadius:14,background:`linear-gradient(135deg,${C.accent},#FF8C42)`,color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"DM Sans,sans-serif"}}>📤 Share via phone</button>}
      </div>
    </div>
  );
}

/* ── PLAN EDITOR (used in onboarding AND settings) ────────────────── */
function PlanEditor({profile,preset,injuries,onSave,onClose,title="Edit Your Plan"}){
  const currentPlan=profile?.plan||preset.days;
  const [plan,setPlan]=useState(()=>{
    // Deep copy current plan
    const p={};
    [0,1,2,3,4,5,6].forEach(d=>{p[d]={...(currentPlan[d]||preset.days[0]),exs:[...(currentPlan[d]?.exs||[])]};});
    return p;
  });
  const [editDay,setEditDay]=useState(null); // null | 0-6
  const [swapExIdx,setSwapExIdx]=useState(null); // which exercise to swap
  const [exSearchBP,setExSearchBP]=useState(null);

  const restDay={focus:"Rest Day",emoji:"😴",color:"#4A5580",tag:"REST",type:"rest",exs:[],note:"Complete rest. Recovery is part of the program."};

  const assignPresetDay=(calDay,presetDayKey)=>{
    const template=presetDayKey==="rest"?restDay:{...preset.days[presetDayKey],exs:filterExercisesForInjuries([...(preset.days[presetDayKey].exs||[])],injuries)};
    setPlan(p=>({...p,[calDay]:template}));
  };

  const swapExercise=(calDay,exIdx,newExName)=>{
    const info=EX[newExName]||{};
    setPlan(p=>{const exs=[...p[calDay].exs];exs[exIdx]={n:newExName,s:info.sets||3,r:info.reps||"12",bp:info.bp};return{...p,[calDay]:{...p[calDay],exs}};});
    setSwapExIdx(null);setExSearchBP(null);
  };

  const removeExercise=(calDay,exIdx)=>setPlan(p=>{const exs=[...p[calDay].exs];exs.splice(exIdx,1);return{...p,[calDay]:{...p[calDay],exs}};});

  const addExercise=(calDay,exName)=>{
    const info=EX[exName]||{};
    const ex={n:exName,s:info.sets||3,r:info.reps||"12",bp:info.bp};
    setPlan(p=>({...p,[calDay]:{...p[calDay],exs:[...(p[calDay].exs||[]),ex]}}));
  };

  const availableExForSwap=useMemo(()=>{
    if(editDay===null||swapExIdx===null)return[];
    const bp=exSearchBP||(plan[editDay]?.exs[swapExIdx]?.bp);
    const excluded=injuries?.flatMap(inj=>INJURY_EXCLUDE[inj]||[])||[];
    return Object.entries(EX).filter(([n,i])=>{
      if(excluded.includes(n))return false;
      if(bp&&i.bp!==bp)return false;
      return true;
    });
  },[editDay,swapExIdx,exSearchBP,injuries,plan]);

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:200,overflowY:"auto"}}>
      <div style={{maxWidth:430,margin:"0 auto",padding:"20px 20px 100px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",color:C.subtle,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:13}}>← Back</button>
          <div className="sora" style={{fontSize:18,fontWeight:800,flex:1}}>{title}</div>
        </div>

        {/* Day overview */}
        {editDay===null&&<>
          <div style={{background:"#FF450012",border:`1px solid #FF450030`,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#FF8C42",lineHeight:1.6}}>
            💡 Tap any day to change it or swap exercises. Your logged workout data stays safe.
          </div>
          {[0,1,2,3,4,5,6].map(d=>{
            const day=plan[d];const isRest=day?.type==="rest";
            return(
              <div key={d} onClick={()=>setEditDay(d)} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,marginBottom:8,padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .2s"}}>
                <div style={{width:40,height:40,borderRadius:12,background:isRest?"#1C2440":day?.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{day?.emoji||"😴"}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text}}>{FULL_DAYS[d]}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{day?.focus||"Rest"}{!isRest&&day?.exs?.length>0?` · ${day.exs.length} exercises`:""}</div>
                </div>
                <span style={{color:C.muted,fontSize:18}}>›</span>
              </div>
            );
          })}
          <Btn onClick={()=>onSave(plan)} style={{width:"100%",marginTop:12,background:"linear-gradient(135deg,#FF4500,#FF8C42)"}}>Save Plan ✓</Btn>
        </>}

        {/* Edit specific day */}
        {editDay!==null&&swapExIdx===null&&(()=>{
          const day=plan[editDay];const isRest=day?.type==="rest";
          return(<>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setEditDay(null)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",color:C.subtle,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:13}}>← Days</button>
              <div className="sora" style={{fontSize:16,fontWeight:800}}>{FULL_DAYS[editDay]}</div>
            </div>

            {/* Change which day type */}
            <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Change Day Type</div>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,padding:"0 0 6px",scrollbarWidth:"none"}}>
              <div onClick={()=>assignPresetDay(editDay,"rest")} style={{flexShrink:0,padding:"8px 14px",borderRadius:30,border:`1.5px solid ${isRest?"#4A5580":C.border}`,background:isRest?"#4A558022":"transparent",cursor:"pointer",display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:14}}>😴</span><span style={{fontSize:12,color:isRest?"#8B93C4":C.muted,fontWeight:isRest?700:400,whiteSpace:"nowrap"}}>Rest Day</span>
              </div>
              {Object.entries(preset.days).filter(([,p])=>p.type!=="rest").map(([key,p])=>(
                <div key={key} onClick={()=>assignPresetDay(editDay,key)} style={{flexShrink:0,padding:"8px 14px",borderRadius:30,border:`1.5px solid ${day?.focus===p.focus?p.color:C.border}`,background:day?.focus===p.focus?p.color+"22":"transparent",cursor:"pointer",display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:14}}>{p.emoji}</span><span style={{fontSize:12,color:day?.focus===p.focus?p.color:C.muted,fontWeight:day?.focus===p.focus?700:400,whiteSpace:"nowrap"}}>{p.focus}</span>
                </div>
              ))}
            </div>

            {/* Exercise list */}
            {!isRest&&<>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Exercises — tap to swap or remove</div>
              {(day.exs||[]).map((ex,i)=>{
                const bpc=BP[ex.bp]?.color||C.accent;
                return(
                  <div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,marginBottom:7,padding:"11px 13px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>{BP[ex.bp]?.icon||"💪"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,color:C.text}}>{ex.n}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{ex.s} sets × {ex.r}</div>
                    </div>
                    <Pill label={ex.bp} color={bpc}/>
                    <button onClick={()=>setSwapExIdx(i)} style={{background:"#6366F120",border:`1px solid #6366F140`,borderRadius:8,padding:"5px 10px",color:"#818CF8",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",flexShrink:0}}>Swap</button>
                    <button onClick={()=>removeExercise(editDay,i)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16,flexShrink:0,padding:"2px 4px"}}>✕</button>
                  </div>
                );
              })}
              {/* Add exercise */}
              <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",margin:"14px 0 8px"}}>Add Exercise</div>
              <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:10,scrollbarWidth:"none"}}>
                {Object.keys(BP).map(bp=><Chip key={bp} label={bp} color={BP[bp]?.color} active={exSearchBP===bp} onClick={()=>setExSearchBP(exSearchBP===bp?null:bp)} small/>)}
              </div>
              {exSearchBP&&Object.entries(EX).filter(([n,i])=>i.bp===exSearchBP&&!(injuries?.flatMap(inj=>INJURY_EXCLUDE[inj]||[])||[]).includes(n)&&!(day.exs||[]).some(e=>e.n===n)).slice(0,6).map(([name,info])=>(
                <div key={name} onClick={()=>{addExercise(editDay,name);setExSearchBP(null);}} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",marginBottom:6,cursor:"pointer",display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:16}}>{BP[info.bp]?.icon}</span>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{name}</div><div style={{fontSize:11,color:C.muted}}>{info.lvl} · {info.reps}</div></div>
                  <span style={{color:"#34D399",fontWeight:700}}>+</span>
                </div>
              ))}
            </>}
          </>);
        })()}

        {/* Swap exercise picker */}
        {editDay!==null&&swapExIdx!==null&&(()=>{
          const currentEx=plan[editDay]?.exs[swapExIdx];
          return(<>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <button onClick={()=>setSwapExIdx(null)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",color:C.subtle,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:13}}>← Back</button>
              <div className="sora" style={{fontSize:16,fontWeight:800}}>Swap: {currentEx?.n}</div>
            </div>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Filter by muscle</div>
            <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:12,scrollbarWidth:"none"}}>
              <Chip label="Same muscle" color={BP[currentEx?.bp]?.color||C.accent} active={!exSearchBP} onClick={()=>setExSearchBP(null)} small/>
              {Object.keys(BP).map(bp=><Chip key={bp} label={bp} color={BP[bp]?.color} active={exSearchBP===bp} onClick={()=>setExSearchBP(bp)} small/>)}
            </div>
            {availableExForSwap.map(([name,info])=>(
              <div key={name} onClick={()=>swapExercise(editDay,swapExIdx,name)} style={{background:C.card,border:`1.5px solid ${name===currentEx?.n?"#6366F1":C.border}`,borderRadius:12,marginBottom:7,padding:"12px 13px",cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:18}}>{BP[info.bp]?.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13,color:name===currentEx?.n?"#818CF8":C.text}}>{name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{info.lvl} · {info.eq} · {info.reps}</div>
                  {info.yt&&<div style={{fontSize:10,color:"#FF4444",marginTop:2,fontWeight:600}}>▶ Video available</div>}
                </div>
                {name===currentEx?.n&&<span style={{color:"#818CF8",fontWeight:800,flexShrink:0}}>Current</span>}
              </div>
            ))}
          </>);
        })()}
      </div>
    </div>
  );
}

/* ── UPGRADE PLAN MODAL ───────────────────────────────────────────── */
function UpgradePlanModal({currentLevel,profile,setProfile,onClose}){
  const currentIdx=LEVEL_ORDER.indexOf(currentLevel);
  const nextLevel=LEVEL_ORDER[currentIdx+1];
  const [confirmed,setConfirmed]=useState(false);
  if(!nextLevel)return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:20,padding:28,maxWidth:360,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:48,marginBottom:12}}>👑</div>
        <div className="sora" style={{fontSize:22,fontWeight:900,marginBottom:8}}>You're already at the top!</div>
        <p style={{color:C.subtle,fontSize:14,lineHeight:1.7,marginBottom:20}}>Advanced is the highest level. Keep pushing — the goal now is progressive overload and consistency.</p>
        <Btn onClick={onClose} style={{width:"100%"}}>Got it!</Btn>
      </div>
    </div>
  );
  const next=PRESET_PLANS[nextLevel];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:430,paddingBottom:40,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:C.border,borderRadius:4,margin:"0 auto 20px"}}/>
        <div className="sora" style={{fontSize:20,fontWeight:800,marginBottom:4}}>⬆️ Upgrade to {nextLevel}</div>
        <p style={{color:C.subtle,fontSize:13,marginBottom:16,lineHeight:1.6}}>{next.rationale}</p>
        <div style={{background:"#FF450012",border:`1px solid #FF450030`,borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:13,color:"#FF8C42",lineHeight:1.6}}>
          ⚠️ This replaces your current plan. Your workout logs and strength data are always kept.
        </div>
        <div className="sora" style={{fontWeight:700,marginBottom:10,fontSize:14}}>{next.label} — Preview</div>
        {Object.entries(next.days).map(([d,day])=>(
          <div key={d} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:32,height:32,borderRadius:10,background:day.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{day.emoji}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{FULL_DAYS[d]}</div><div style={{fontSize:11,color:C.muted}}>{day.focus}</div></div>
            <Pill label={day.tag||"REST"} color={day.color}/>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <Btn onClick={onClose} secondary style={{flex:1,padding:"12px"}}>Not yet</Btn>
          <Btn onClick={()=>{setProfile({...profile,level:nextLevel,plan:PRESET_PLANS[nextLevel].days});setConfirmed(true);setTimeout(onClose,1500);}} style={{flex:2,padding:"12px",background:`linear-gradient(135deg,${C.accent},#FF8C42)`}}>
            {confirmed?"✓ Upgraded!":"Upgrade my plan"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ── LOGIN SCREEN ─────────────────────────────────────────────────── */
function LoginScreen({signInGoogle,hasSB,onSkip}){
  const [loading,setLoading]=useState(false);
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",maxWidth:400,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:56,marginBottom:16,animation:"glow 2s ease-in-out infinite"}}>🔥</div>
        <div className="sora" style={{fontSize:36,fontWeight:900,letterSpacing:-1,marginBottom:8}}>FORGE<span style={{color:C.accent}}>.</span></div>
        <div style={{fontSize:15,color:C.subtle,lineHeight:1.7}}>Your personal training app.<br/>Log in to sync across all your devices.</div>
      </div>
      {hasSB?(
        <>
          <button onClick={async()=>{setLoading(true);await signInGoogle();setLoading(false);}} disabled={loading} style={{width:"100%",padding:"16px 20px",borderRadius:16,border:"2px solid #2A3560",background:"#0F1830",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:14,transition:"all .2s",opacity:loading?.6:1}}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span style={{fontWeight:700,fontSize:16,color:C.text,fontFamily:"DM Sans,sans-serif"}}>{loading?"Connecting…":"Continue with Google"}</span>
          </button>
          <div style={{fontSize:12,color:C.muted,textAlign:"center",lineHeight:1.7,marginBottom:20}}>Your data is private. No password needed.</div>
          <button onClick={onSkip} style={{background:"transparent",border:"none",color:C.muted,fontSize:13,cursor:"pointer",textDecoration:"underline",fontFamily:"DM Sans,sans-serif"}}>Continue without login (data won't sync between devices)</button>
        </>
      ):(
        <>
          <div style={{background:"#FF450015",border:"1px solid #FF450040",borderRadius:14,padding:16,marginBottom:20,fontSize:13,color:"#FF8C42",lineHeight:1.7,textAlign:"center"}}>
            <strong>Add Supabase credentials</strong> to the top of App.jsx to enable Google login.
          </div>
          <Btn onClick={onSkip} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#FF8C42)`}}>Continue without login →</Btn>
        </>
      )}
    </div>
  );
}

/* ── ONBOARDING v2 ────────────────────────────────────────────────── */
function Onboarding({onDone,userName}){
  const [step,setStep]=useState(0);
  const [name,setName]=useState(userName||"");
  const [gender,setGender]=useState(null);
  const [age,setAge]=useState("");
  const [level,setLevel]=useState(null);
  const [goals,setGoals]=useState([]);
  const [equipment,setEquipment]=useState(null);
  const [injuries,setInjuries]=useState([]);
  const [planMode,setPlanMode]=useState(null);
  const [showPlanEditor,setShowPlanEditor]=useState(false);
  const [customPlan,setCustomPlan]=useState(null);

  const toggleInjury=i=>setInjuries(p=>p.includes(i)?p.filter(x=>x!==i):[...p.filter(x=>x!=="No injuries"),i]);
  const genderNote=gender?GENDER_NOTES[gender]:null;
  const ageNum=parseInt(age)||25;
  const preset=level?PRESET_PLANS[level]:PRESET_PLANS.Beginner;

  const buildFinalPlan=()=>{
    if(customPlan)return customPlan;
    return applyInjuriesToPlan(preset.days,injuries);
  };

  const LEVELS=[{k:"Beginner",icon:"🌱",desc:"0–6 months training",color:"#34D399"},{k:"Intermediate",icon:"⚡",desc:"6 months – 2 years",color:"#60A5FA"},{k:"Advanced",icon:"🔥",desc:"2+ years of consistent training",color:"#E879F9"}];
  const ALL_GOALS=["Lose body fat","Build muscle","Tone up","Stronger glutes","Stronger legs","More energy","Better posture","Improve endurance","Increase flexibility","Overall fitness"];
  const ALL_EQ=["Home only (bodyweight + bands)","Home with dumbbells","Full gym access","Mix of home + gym"];

  if(showPlanEditor)return(
    <PlanEditor
      profile={{plan:customPlan||preset.days,level}}
      preset={preset}
      injuries={injuries}
      title="Customise Your Plan"
      onSave={p=>{setCustomPlan(p);setShowPlanEditor(false);}}
      onClose={()=>setShowPlanEditor(false)}
    />
  );

  const STEPS=[
    /* 0: Name + Gender + Age */
    <div key="s0" className="fade-up" style={{display:"flex",flexDirection:"column",gap:22}}>
      <div>
        <div className="sora" style={{fontSize:11,color:C.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Welcome to FORGE</div>
        <div className="sora" style={{fontSize:28,fontWeight:900,lineHeight:1.1}}>Let's build your plan<span style={{color:C.accent}}>.</span></div>
        <p style={{color:C.subtle,marginTop:8,fontSize:14,lineHeight:1.7}}>A few quick questions so we can personalise everything — including working around any injuries.</p>
      </div>
      <Inp label="Your name" value={name} onChange={setName} placeholder="e.g. Tvesha"/>
      <div>
        <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>I identify as</div>
        <div style={{display:"flex",gap:8}}>
          {["Female","Male","Prefer not to say"].map(g=>(
            <div key={g} onClick={()=>setGender(g)} style={{flex:1,padding:"12px 8px",borderRadius:12,border:`2px solid ${gender===g?"#6366F1":C.border}`,background:gender===g?"#6366F115":C.card,cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:gender===g?700:400,color:gender===g?"#818CF8":C.muted,transition:"all .2s"}}>
              {g==="Female"?"👩":g==="Male"?"👨":"🙋"}<div style={{marginTop:4,fontSize:11}}>{g}</div>
            </div>
          ))}
        </div>
        {gender&&gender!=="Prefer not to say"&&<div style={{marginTop:10,padding:"10px 12px",background:"#6366F110",borderRadius:10,fontSize:12,color:"#818CF8",lineHeight:1.6}}>💡 {GENDER_NOTES[gender].levelNote}</div>}
      </div>
      <Inp label="Your age" value={age} onChange={setAge} placeholder="e.g. 28" type="number" suffix="yrs"
        style={undefined}/>
      {ageNum>=50&&age&&<div style={{background:"#34D39910",border:`1px solid #34D39930`,borderRadius:10,padding:"10px 12px",fontSize:12,color:"#34D399",lineHeight:1.6}}>🌿 We'll prioritise low-impact, joint-friendly exercises for your plan.</div>}
      {ageNum<18&&age&&<div style={{background:"#FBBF2410",border:`1px solid #FBBF2430`,borderRadius:10,padding:"10px 12px",fontSize:12,color:"#FBBF24",lineHeight:1.6}}>⚡ For under 18s, we focus on form and bodyweight first — no heavy compounds.</div>}
      <Btn onClick={()=>setStep(1)} disabled={!name||!gender||!age} style={{width:"100%"}}>Continue →</Btn>
    </div>,

    /* 1: Level */
    <div key="s1" className="fade-up" style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><div className="sora" style={{fontSize:26,fontWeight:800}}>Experience level</div><p style={{color:C.subtle,marginTop:6,fontSize:14}}>Be honest — we'll calibrate your plan exactly.</p></div>
      {LEVELS.map(({k,icon,desc,color})=>(
        <div key={k} onClick={()=>setLevel(k)} style={{padding:"16px",borderRadius:14,border:`2px solid ${level===k?color:C.border}`,background:level===k?color+"12":C.card,cursor:"pointer",display:"flex",gap:14,alignItems:"center",transition:"all .2s"}}>
          <span style={{fontSize:28}}>{icon}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:16,color:level===k?color:C.text}}>{k}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{desc}</div>
            {level===k&&<div style={{fontSize:12,color,marginTop:6,lineHeight:1.5}}>{PRESET_PLANS[k].label} — {PRESET_PLANS[k].rationale.slice(0,80)}...</div>}
          </div>
          {level===k&&<div style={{width:24,height:24,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800,flexShrink:0}}>✓</div>}
        </div>
      ))}
      <div style={{display:"flex",gap:10}}>
        <Btn onClick={()=>setStep(0)} secondary style={{flex:1}}>← Back</Btn>
        <Btn onClick={()=>setStep(2)} disabled={!level} style={{flex:2}}>Continue →</Btn>
      </div>
    </div>,

    /* 2: Goals + Equipment + Injuries */
    <div key="s2" className="fade-up" style={{display:"flex",flexDirection:"column",gap:20}}>
      <div><div className="sora" style={{fontSize:26,fontWeight:800}}>Goals + Limitations</div></div>
      <div>
        <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Your goals</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{ALL_GOALS.map(g=><Chip key={g} label={g} color={C.accent} active={goals.includes(g)} onClick={()=>setGoals(p=>p.includes(g)?p.filter(x=>x!==g):[...p,g])}/>)}</div>
      </div>
      <div>
        <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Equipment access</div>
        {ALL_EQ.map(e=><div key={e} onClick={()=>setEquipment(e)} style={{padding:"12px 16px",borderRadius:12,border:`2px solid ${equipment===e?"#6366F1":C.border}`,background:equipment===e?"#6366F112":C.card,cursor:"pointer",fontSize:14,marginBottom:8,color:equipment===e?"#818CF8":C.subtle,fontWeight:equipment===e?700:400,transition:"all .2s"}}>{e}</div>)}
      </div>
      <div>
        <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>Any injuries or pain areas?</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {INJURIES.map(inj=>(
            <div key={inj} onClick={()=>{if(inj==="No injuries")setInjuries(["No injuries"]);else toggleInjury(inj);}} style={{padding:"7px 14px",borderRadius:30,border:`1.5px solid ${injuries.includes(inj)?inj==="No injuries"?"#34D399":"#F87171":C.border}`,background:injuries.includes(inj)?inj==="No injuries"?"#34D39920":"#F8717120":"transparent",cursor:"pointer",fontSize:13,fontWeight:injuries.includes(inj)?700:400,color:injuries.includes(inj)?inj==="No injuries"?"#34D399":"#F87171":C.muted,transition:"all .2s"}}>
              {inj==="No injuries"?"✓ ":injuries.includes(inj)&&inj!=="No injuries"?"⚠️ ":""}{inj}
            </div>
          ))}
        </div>
        {injuries.length>0&&!injuries.includes("No injuries")&&<div style={{marginTop:10,padding:"10px 12px",background:"#F8717110",borderRadius:10,fontSize:12,color:"#F87171",lineHeight:1.6}}>⚠️ We'll remove exercises that aggravate: {injuries.join(", ")}.</div>}
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn onClick={()=>setStep(1)} secondary style={{flex:1}}>← Back</Btn>
        <Btn onClick={()=>setStep(3)} disabled={!goals.length||!equipment||!injuries.length} style={{flex:2}}>Review plan →</Btn>
      </div>
    </div>,

    /* 3: Plan review + edit */
    <div key="s3" className="fade-up" style={{display:"flex",flexDirection:"column",gap:18}}>
      <div>
        <div className="sora" style={{fontSize:26,fontWeight:800}}>Your plan is ready 🎉</div>
        <p style={{color:C.subtle,marginTop:6,fontSize:14}}>Built for {level} · {gender} · {ageNum} yrs. Tap "Edit" to customise any day or swap exercises.</p>
      </div>
      <div style={{padding:"12px 14px",background:"#FF450010",border:`1px solid ${C.accent}30`,borderRadius:12}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:4}}>WHY THIS PLAN</div>
        <div style={{fontSize:12,color:C.subtle,lineHeight:1.6}}>{preset.rationale}</div>
      </div>
      <Card>
        {[0,1,2,3,4,5,6].map((d,i)=>{
          const plan=customPlan||applyInjuriesToPlan(preset.days,injuries);
          const day=plan[d];const isRest=day?.type==="rest";
          return(
            <div key={d} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<6?`1px solid ${C.border}`:"none"}}>
              <div style={{width:34,height:34,borderRadius:10,background:isRest?"#1C2440":day?.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{day?.emoji||"😴"}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:isRest?C.muted:C.text}}>{FULL_DAYS[d]}</div><div style={{fontSize:11,color:C.muted}}>{day?.focus||"Rest"}{!isRest&&day?.exs?.length>0?` · ${day.exs.length} ex`:""}</div></div>
              {!isRest&&<Pill label={day?.tag||"HOME"} color={day?.color||C.accent}/>}
            </div>
          );
        })}
      </Card>
      <div style={{display:"flex",gap:8}}>
        <Btn onClick={()=>setShowPlanEditor(true)} secondary style={{flex:1,padding:"12px",fontSize:13}}>✏️ Edit plan</Btn>
        <Btn onClick={()=>setStep(2)} secondary style={{flex:"0 0 auto",padding:"12px",fontSize:13}}>← Back</Btn>
      </div>
      <Btn onClick={()=>onDone({name,gender,age:ageNum,level,goals,equipment,injuries,createdAt:dk(),plan:buildFinalPlan()})} style={{width:"100%",background:"linear-gradient(135deg,#FF4500,#FF8C42)",fontSize:15}}>
        🔥 Let's forge it, {name.split(" ")[0]}!
      </Btn>
    </div>
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,padding:"24px 20px 40px",maxWidth:430,margin:"0 auto",overflowY:"auto"}}>
      <div style={{marginBottom:24}}>
        <div className="sora" style={{fontSize:22,fontWeight:900,letterSpacing:-.5}}>FORGE<span style={{color:C.accent}}>.</span></div>
        <div style={{display:"flex",gap:5,marginTop:10}}>{[0,1,2,3].map(i=><div key={i} style={{height:3,borderRadius:3,flex:i===step?2:1,background:i<=step?C.accent:C.border,transition:"all .4s"}}/>)}</div>
      </div>
      {STEPS[step]}
    </div>
  );
}

/* ── TODAY PAGE ───────────────────────────────────────────────────── */
function TodayPage({data,setLog,streak,onShare}){
  const [currentDate,setCurrentDate]=useState(dk());
  const [expanded,setExpanded]=useState({});
  const [toast,setToast]=useState(null);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),1800);};
  const isToday=currentDate===dk();
  const dateObj=new Date(currentDate+"T12:00:00");
  const dow=dateObj.getDay();
  const dayPlan=(data.profile?.plan||{})[dow]||{focus:"Rest Day",emoji:"😴",color:C.muted,type:"rest",exs:[]};
  const log=data.logs[currentDate]||{};
  const isPicOne=dayPlan.type==="pick-one";
  const allExs=[...(dayPlan.exs||[]),...RECOVERY_EXS];
  const doneCount=allExs.filter((_,i)=>log[`done_${i}`]).length;
  const pct=allExs.length>0?Math.round(doneCount/allExs.length*100):0;
  const toggle=i=>{const n={...log,[`done_${i}`]:!log[`done_${i}`]};setLog(currentDate,n);if(!log[`done_${i}`])showToast("✓ Logged!");};
  const setVal=(i,f,v)=>setLog(currentDate,{...log,[`${f}_${i}`]:v});

  return(<div style={{paddingBottom:80}}>
    <div style={{padding:"14px 20px 0",background:`linear-gradient(160deg,${C.bg},${dayPlan.color}12)`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <button onClick={()=>setCurrentDate(addDays(currentDate,-1))} style={{width:34,height:34,borderRadius:10,background:C.card,border:`1px solid ${C.border}`,cursor:"pointer",color:C.subtle,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>‹</button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:600}}>{dateObj.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>
          {isToday&&<div style={{fontSize:10,color:C.accent,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>TODAY</div>}
        </div>
        <button onClick={()=>setCurrentDate(addDays(currentDate,1))} disabled={isToday} style={{width:34,height:34,borderRadius:10,background:isToday?C.border:C.card,border:`1px solid ${C.border}`,cursor:isToday?"not-allowed":"pointer",color:isToday?C.muted:C.subtle,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:isToday?.3:1}}>›</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <div style={{flex:1}}>
          <div className="sora" style={{fontSize:20,fontWeight:800,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {dayPlan.emoji} {dayPlan.focus}
{streak>0&&isToday&&(
  <div style={{display:"flex",alignItems:"center",gap:6,background:streak>=30?"#FFD70015":streak>=7?"#FF450020":"#FF450015",border:`2px solid ${streak>=30?"#FFD700":streak>=7?"#FF4500":"#FF450040"}`,borderRadius:14,padding:"6px 14px",animation:streak>=7?"glow 2s ease-in-out infinite":"none",flexShrink:0}}>
    <span style={{fontSize:streak>=14?22:18}}>{streak>=30?"👑":streak>=14?"💎":streak>=7?"⚡":"🔥"}</span>
    <div>
      <div style={{fontSize:streak>=7?16:14,fontWeight:900,color:streak>=30?"#FFD700":C.accent,lineHeight:1,fontFamily:"Sora,sans-serif"}}>{streak}d</div>
      {streak>=7&&<div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",lineHeight:1,marginTop:2}}>{streak>=30?"Legend":streak>=14?"Titan":"On fire"}</div>}
    </div>
  </div>
)}
         </div>
        </div>
        <Ring pct={pct} color={dayPlan.color} size={48} sw={4}/>
      </div>
      <div style={{height:4,background:C.border,borderRadius:4,marginBottom:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${dayPlan.color},${dayPlan.color}BB)`,borderRadius:4,transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/></div>
      <div style={{fontSize:11,color:C.muted,paddingBottom:12,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{doneCount} of {allExs.length} completed · {MOTIVATION[dateObj.getDay()%MOTIVATION.length]}</span>
        {pct>0&&<button onClick={onShare} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:14,flexShrink:0}}>📤</button>}
      </div>
    </div>

    <div style={{padding:"12px 20px"}}>
     {/* Energy check-in */}
{isToday&&(
  <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12}}>
    <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>How's your energy today?</div>
    <div style={{display:"flex",gap:6}}>
      {[{val:1,emoji:"😴",label:"Tired"},{val:2,emoji:"😕",label:"Low"},{val:3,emoji:"😊",label:"OK"},{val:4,emoji:"💪",label:"Good"},{val:5,emoji:"🔥",label:"Amazing"}].map(({val,emoji,label})=>(
        <div key={val} onClick={()=>setLog(currentDate,{...log,energy:val})} style={{flex:1,textAlign:"center",padding:"10px 4px",borderRadius:12,border:`2px solid ${log.energy===val?C.accent:C.border}`,background:log.energy===val?C.accent+"18":"transparent",cursor:"pointer",transition:"all .2s"}}>
          <div style={{fontSize:22}}>{emoji}</div>
          <div style={{fontSize:10,color:log.energy===val?C.accent:C.muted,marginTop:3,fontWeight:log.energy===val?700:400}}>{label}</div>
        </div>
      ))}
    </div>
    {log.energy&&<div style={{marginTop:10,fontSize:12,color:C.subtle,textAlign:"center",lineHeight:1.5,padding:"8px 12px",background:"#ffffff08",borderRadius:10}}>
      {log.energy<=2?"Take it easy today — lighter session still counts. 🌿":log.energy===3?"Solid. Focus on form and consistency. 💫":"You're ready. Push harder today. 🔥"}
    </div>}
  </div>
)}

{/* Water tracker */}
<div style={{background:C.card,border:`1.5px solid #1C2440`,borderRadius:14,padding:14,marginBottom:12}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
    <div>
      <div style={{fontWeight:700,fontSize:14}}>💧 Water intake</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>Target: 8 glasses</div>
    </div>
    <div style={{fontSize:16,fontWeight:800,color:(log.water||0)>=8?"#34D399":"#3D9EFF"}}>{log.water||0} / 8</div>
  </div>
  <div style={{height:6,background:"#1C2440",borderRadius:6,overflow:"hidden",marginBottom:12}}>
    <div style={{height:"100%",width:`${Math.min(100,((log.water||0)/8)*100)}%`,background:`linear-gradient(90deg,#3D9EFF,#34D399)`,borderRadius:6,transition:"width .4s cubic-bezier(.4,0,.2,1)"}}/>
  </div>
  <div style={{display:"flex",gap:8}}>
    <button onClick={()=>setLog(currentDate,{...log,water:Math.max(0,(log.water||0)-1)})} style={{width:40,height:40,borderRadius:10,background:"#1C2440",border:"none",color:C.subtle,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
    <div style={{flex:1,display:"flex",gap:4,alignItems:"center"}}>
      {Array.from({length:8},(_,i)=>(
        <div key={i} onClick={()=>setLog(currentDate,{...log,water:i+1})} style={{flex:1,height:28,borderRadius:6,background:i<(log.water||0)?"#3D9EFF":"#1C2440",cursor:"pointer",transition:"background .2s",border:`1px solid ${i<(log.water||0)?"#3D9EFF":"#2A3560"}`}}/>
      ))}
    </div>
    <button onClick={()=>setLog(currentDate,{...log,water:Math.min(8,(log.water||0)+1)})} style={{width:40,height:40,borderRadius:10,background:"#3D9EFF22",border:"1px solid #3D9EFF40",color:"#3D9EFF",fontSize:22,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
  </div>
  {(log.water||0)>=8&&<div style={{marginTop:10,textAlign:"center",fontSize:12,color:"#34D399",fontWeight:700}}>✓ Hydration goal reached! 🎉</div>}
</div>

{/* Rest day tips */}
{dayPlan.type==="rest"&&(
  <div style={{marginBottom:12}}>
    <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Today's Recovery Focus</div>
    {[
      {icon:"🧘",title:"Stretch for 10 minutes",tip:"Even light stretching speeds up muscle repair and reduces next-day soreness."},
      {icon:"💧",title:"Drink more water than usual",tip:"Your muscles are repairing today. Hydration is when the real recovery happens."},
      {icon:"😴",title:"Prioritise sleep tonight",tip:"80% of muscle growth happens during sleep. Aim for 8 hours."},
      {icon:"🚶",title:"Light walk if you feel restless",tip:"A 20-minute walk boosts blood flow without adding fatigue."},
    ].map(({icon,title,tip},i)=>(
      <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:24,flexShrink:0}}>{icon}</span>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:4}}>{title}</div>
          <div style={{fontSize:12,color:C.subtle,lineHeight:1.6}}>{tip}</div>
        </div>
      </div>
    ))}
  </div>
)}

{/* Streak upgrade */}
      {dayPlan.note&&<div style={{background:`${dayPlan.color}12`,border:`1px solid ${dayPlan.color}30`,borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.subtle,lineHeight:1.55}}>💡 {dayPlan.note}</div>}

      {isPicOne&&<>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Choose Your Activity</div>
        {dayPlan.opts.map(opt=>{const chosen=log.cardioChoice===opt.n;return(
          <div key={opt.n} onClick={()=>setLog(currentDate,{...log,cardioChoice:opt.n})} style={{background:chosen?`${dayPlan.color}18`:C.card,border:`2px solid ${chosen?dayPlan.color:C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .25s"}}>
            <div style={{width:26,height:26,borderRadius:8,border:`2px solid ${chosen?dayPlan.color:C.muted}`,background:chosen?dayPlan.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>{chosen&&<span style={{color:"#fff",fontSize:12,fontWeight:800}}>✓</span>}</div>
            <div><div style={{fontWeight:700,fontSize:14,color:chosen?dayPlan.color:C.text}}>{opt.n}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{opt.d}</div></div>
          </div>
        );})}
        {log.cardioChoice&&<div style={{marginTop:14}}><Card><div style={{fontWeight:700,fontSize:15,marginBottom:10,color:dayPlan.color}}>{log.cardioChoice}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}><Inp label="Duration" placeholder="e.g. 35 min" suffix="min" value={log.cardio_dur||""} onChange={v=>setLog(currentDate,{...log,cardio_dur:v})}/><Inp label="How was it?" placeholder="Easy / Hard" value={log.cardio_feel||""} onChange={v=>setLog(currentDate,{...log,cardio_feel:v})}/></div><div onClick={()=>toggle(0)} style={{padding:"10px",borderRadius:10,background:log.done_0?"#1E3A2A":"#1A2240",border:`1.5px solid ${log.done_0?"#34D399":C.border}`,color:log.done_0?"#34D399":C.subtle,fontWeight:700,fontSize:13,textAlign:"center",cursor:"pointer"}}>{log.done_0?"✓ Session Completed!":"Mark as done"}</div></Card></div>}
      </>}

      {!isPicOne&&dayPlan.exs&&dayPlan.exs.length>0&&<>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Today's Exercises</div>
        {dayPlan.exs.map((ex,i)=>{
          const info=EX[ex.n]||{};const done=!!log[`done_${i}`];const isExp=!!expanded[i];
          const bpc=BP[ex.bp]?.color||C.accent;
          const prevWeight=(data.logs[addDays(currentDate,-7)]||{})[`weight_${i}`];
          return(<div key={i} style={{background:done?C.card2+"AA":C.card,border:`1.5px solid ${done?C.border:isExp?dayPlan.color:C.border}`,borderRadius:16,marginBottom:8,overflow:"hidden",transition:"all .25s"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",cursor:"pointer"}} onClick={()=>setExpanded(e=>({...e,[i]:!isExp}))}>
              <div onClick={ev=>{ev.stopPropagation();toggle(i);}} style={{width:26,height:26,borderRadius:8,border:`2px solid ${done?"transparent":C.border}`,background:done?dayPlan.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"all .2s",marginTop:2,animation:done?"pop .35s ease":"none"}}>{done&&<span style={{color:"#fff",fontSize:13,fontWeight:800}}>✓</span>}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,color:done?C.muted:C.text,textDecoration:done?"line-through":"none",lineHeight:1.3}}>{ex.n}</div>
                <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:12,color:C.muted}}>{ex.s} sets × {ex.r}</span>
                  {ex.bp&&<Pill label={ex.bp} color={bpc}/>}
                  {prevWeight&&<span style={{fontSize:11,color:"#34D399",fontWeight:700}}>↑ Last week: {prevWeight}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                {info.yt&&<button onClick={ev=>{ev.stopPropagation();window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent("how to do "+name+" exercise proper form")}`,"_blank");}} style={{width:26,height:26,background:"#FF0000CC",borderRadius:7,border:"none",cursor:"pointer",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center"}}>▶</button>}
                <span style={{color:C.muted,fontSize:18,transition:"transform .2s",transform:isExp?"rotate(90deg)":"none"}}>›</span>
              </div>
            </div>
            {isExp&&(<div style={{padding:"0 14px 14px",borderTop:`1px solid ${C.border}`,background:"rgba(0,0,0,.25)"}}>
              {info.yt&&<div style={{marginBottom:10}}><YTThumb name={ex.n} bp={ex.bp||info.bp} height={100}/></div>}
              {info.desc&&<div style={{fontSize:13,color:C.subtle,lineHeight:1.6,marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>{info.desc}</div>}
              {info.tip&&<div style={{fontSize:12,color:C.muted,fontStyle:"italic",marginBottom:10,lineHeight:1.5}}>💬 {info.tip}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <Inp label="Weight / Resistance" placeholder="e.g. 8kg, band" value={log[`weight_${i}`]||""} onChange={v=>setVal(i,"weight",v)}/>
                <Inp label="Actual reps / time" placeholder="e.g. 12, 10, 8" value={log[`reps_${i}`]||""} onChange={v=>setVal(i,"reps",v)}/>
              </div>
              <Inp label="Notes" placeholder="How did it feel?" value={log[`note_${i}`]||""} onChange={v=>setVal(i,"note",v)}/>
            </div>)}
          </div>);
        })}
      </>}

      <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginTop:14,marginBottom:10}}>Recovery (Every Day)</div>

{/* Warmup + Stretch video links for the day */}
<div style={{display:"flex",gap:8,marginBottom:10}}>
  {[WARMUP_BY_DAY[dow], STRETCH_BY_DAY[dow]].map((item,i)=>(
    <div key={i} onClick={()=>window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.search)}`,"_blank")}
      style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",cursor:"pointer",display:"flex",gap:8,alignItems:"center"}}>
      <div style={{width:28,height:28,background:"#FF0000CC",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{color:"#fff",fontSize:11,marginLeft:2}}>▶</span>
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:C.text,lineHeight:1.3}}>{i===0?"Today's warmup":"Today's stretch"}</div>
        <div style={{fontSize:10,color:C.muted,marginTop:1}}>{item.label}</div>
      </div>
    </div>
  ))}
</div>

{RECOVERY_EXS.map((ex,ri)=>{
  const i=(dayPlan.exs?.length||0)+ri;const done=!!log[`done_${i}`];
  return(
    <div key={ri} style={{background:done?C.card2+"AA":C.card,border:`1.5px solid ${C.border}`,borderRadius:14,marginBottom:7,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
      <div onClick={()=>toggle(i)} style={{width:26,height:26,borderRadius:8,border:`2px solid ${done?"transparent":"#4A5580"}`,background:done?"#34D399":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .2s",flexShrink:0}}>
        {done&&<span style={{color:"#fff",fontSize:12,fontWeight:800}}>✓</span>}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:14,color:done?C.muted:C.text,textDecoration:done?"line-through":"none"}}>{ex.n}</div>
        <div style={{fontSize:12,color:C.muted,marginTop:2}}>{ex.r}</div>
      </div>
    </div>
  );
})} const i=(dayPlan.exs?.length||0)+ri;const done=!!log[`done_${i}`];return(<div key={ri} style={{background:done?C.card2+"AA":C.card,border:`1.5px solid ${C.border}`,borderRadius:14,marginBottom:7,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}><div onClick={()=>toggle(i)} style={{width:26,height:26,borderRadius:8,border:`2px solid ${done?"transparent":"#4A5580"}`,background:done?"#34D399":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .2s",flexShrink:0}}>{done&&<span style={{color:"#fff",fontSize:12,fontWeight:800}}>✓</span>}</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:done?C.muted:C.text,textDecoration:done?"line-through":"none"}}>{ex.n}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{ex.r}</div></div></div>);})}

      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:14,marginTop:14}}>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>📝 Session Notes</div>
        <textarea value={log.dayNote||""} onChange={e=>setLog(currentDate,{...log,dayNote:e.target.value})} placeholder="Wins? PRs? How did it feel?" style={{width:"100%",background:"#080B15",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:13,outline:"none",resize:"none",minHeight:70,lineHeight:1.6,fontFamily:"DM Sans,sans-serif"}}/>
      </div>
    </div>
    <Toast msg={toast}/>
  </div>);
}

/* ── STRENGTH / BODY / PROGRESS ── (same as v4, abbreviated) ─────── */
function StrengthPage({data,addStrength,saveTargets}){
  const [tab,setTab]=useState("muscles");const [selBP,setSelBP]=useState(null);const [selEx,setSelEx]=useState(null);
  const [form,setForm]=useState({exercise:"",weight:"",reps:"",sets:"3",date:dk(),notes:""});
  const [showForm,setShowForm]=useState(false);const [toast,setToast]=useState(null);
  const [showTarget,setShowTarget]=useState(null);const [targetVal,setTargetVal]=useState("");
  const [exFilter,setExFilter]=useState(null);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2000);};
  const weekAgo=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-7);return dk(d);},[]);
  const twoWkAgo=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-14);return dk(d);},[]);
  const bpStats=useMemo(()=>{const s={};Object.keys(BP).forEach(bp=>{s[bp]={thisWeek:[],lastWeek:[],allTime:[]};});(data.strength||[]).forEach(e=>{const bp=e.bp||EX[e.exercise]?.bp||"Core";if(!s[bp])s[bp]={thisWeek:[],lastWeek:[],allTime:[]};s[bp].allTime.push(e);if(e.date>=weekAgo)s[bp].thisWeek.push(e);else if(e.date>=twoWkAgo)s[bp].lastWeek.push(e);});return s;},[data.strength,weekAgo,twoWkAgo]);
  const exChart=useMemo(()=>!selEx?[]:(data.strength||[]).filter(e=>e.exercise===selEx).sort((a,b)=>a.date<b.date?-1:1).map(e=>({date:fmtDate(e.date),weight:parseFloat(e.weight)||0})),[data.strength,selEx]);
  const submitLog=()=>{if(!form.exercise||!form.weight)return;const bp=EX[form.exercise]?.bp||"Core";const prevBest=Math.max(0,...(data.strength||[]).filter(e=>e.exercise===form.exercise).map(e=>parseFloat(e.weight)||0));addStrength({...form,bp});if(parseFloat(form.weight)>prevBest&&prevBest>0)showToast("🚀 New PR!");else showToast("💪 Logged!");setForm({exercise:"",weight:"",reps:"",sets:"3",date:dk(),notes:""});setShowForm(false);};

  return(<div style={{paddingBottom:80}}>
    <div style={{padding:"16px 20px 0"}}>
      <div className="sora" style={{fontSize:24,fontWeight:900,marginBottom:14}}>💪 Strength</div>
      <div style={{display:"flex",background:C.card,borderRadius:12,padding:3,marginBottom:16}}>
        {[["muscles","Muscles"],["log","Log"],["exercises","Library"]].map(([t,l])=><button key={t} onClick={()=>{setTab(t);setSelBP(null);setSelEx(null);}} style={{flex:1,padding:"8px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:12,background:tab===t?"#1A2A50":"transparent",color:tab===t?C.text:C.muted,transition:"all .2s"}}>{l}</button>)}
      </div>
    </div>
    <div style={{padding:"0 20px"}}>
      {tab==="muscles"&&(!selBP?(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {Object.entries(BP).map(([bp,meta])=>{const s=bpStats[bp]||{thisWeek:[],lastWeek:[],allTime:[]};const twMax=s.thisWeek.reduce((m,e)=>Math.max(m,parseFloat(e.weight)||0),0);const lwMax=s.lastWeek.reduce((m,e)=>Math.max(m,parseFloat(e.weight)||0),0);return(<div key={bp} onClick={()=>{setSelBP(bp);setSelEx(null);}} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:14,cursor:"pointer",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-8,right:-8,fontSize:44,opacity:.06}}>{meta.icon}</div><div style={{fontSize:28,marginBottom:8}}>{meta.icon}</div><div style={{fontWeight:700,fontSize:15,color:meta.color,marginBottom:2}}>{bp}</div><div style={{fontSize:11,color:C.muted}}>{s.allTime.length} sessions</div>{s.thisWeek.length>0&&<div style={{marginTop:8,display:"flex",gap:5}}><div style={{padding:"3px 7px",borderRadius:7,background:meta.color+"18",fontSize:10,color:meta.color,fontWeight:700}}>{s.thisWeek.length}× this week</div>{twMax>lwMax&&lwMax>0&&<div style={{padding:"3px 7px",borderRadius:7,background:"#34D39920",fontSize:10,color:"#34D399",fontWeight:700}}>↑ PR</div>}</div>}</div>);})}
        </div>
      ):(
        <div className="fade-up">
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><button onClick={()=>{setSelBP(null);setSelEx(null);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",color:C.subtle,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:13}}>← Back</button><div className="sora" style={{fontSize:20,fontWeight:800,color:BP[selBP]?.color}}>{BP[selBP]?.icon} {selBP}</div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>{[["This Week",bpStats[selBP]?.thisWeek||[],"#34D399"],["Last Week",bpStats[selBP]?.lastWeek||[],C.subtle]].map(([label,sessions,color])=>{const maxW=sessions.reduce((m,e)=>Math.max(m,parseFloat(e.weight)||0),0);return(<Card key={label} style={{textAlign:"center"}}><div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{label}</div><div className="sora" style={{fontSize:26,fontWeight:900,color}}>{sessions.length}</div><div style={{fontSize:11,color:C.muted}}>sessions</div>{maxW>0&&<div style={{marginTop:4,fontSize:12,color,fontWeight:700}}>Max: {maxW}kg</div>}</Card>);})}</div>
          {Object.entries(EX).filter(([,i])=>i.bp===selBP).map(([name,info])=>{const sessions=(data.strength||[]).filter(e=>e.exercise===name).sort((a,b)=>b.date<a.date?-1:1);const best=sessions.reduce((m,e)=>Math.max(m,parseFloat(e.weight)||0),0);const isSel=selEx===name;const target=(data.targets||{})[name];const tPct=target&&best>0?Math.min(100,Math.round(best/parseFloat(target)*100)):null;
            return(<div key={name} style={{background:isSel?C.card2:C.card,border:`1.5px solid ${isSel?BP[selBP]?.color:C.border}`,borderRadius:14,marginBottom:8,overflow:"hidden"}}>
              <div onClick={()=>setSelEx(isSel?null:name)} style={{padding:"12px 14px",cursor:"pointer",display:"flex",gap:12,alignItems:"center"}}>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:isSel?BP[selBP]?.color:C.text}}>{name}</div><div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:info.lvl==="Beginner"?"#34D39920":info.lvl==="Intermediate"?"#60A5FA20":"#E879F920",color:info.lvl==="Beginner"?"#34D399":info.lvl==="Intermediate"?"#60A5FA":"#E879F9",fontWeight:700}}>{info.lvl}</span>{best>0&&<span style={{fontSize:12,color:"#34D399",fontWeight:800}}>Best: {best}kg</span>}</div>{target&&<div style={{marginTop:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:3}}><span>Target: {target}kg</span><span>{tPct||0}%</span></div><div style={{height:4,background:C.border,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${tPct||0}%`,background:tPct>=100?"#34D399":BP[selBP]?.color,borderRadius:4,transition:"width .5s"}}/></div></div>}</div>
                {info.yt&&<button onClick={ev=>{ev.stopPropagation();window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent("how to do "+name+" exercise proper form")}`,"_blank");}} style={{width:26,height:26,background:"#FF0000",borderRadius:7,border:"none",cursor:"pointer",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>▶</button>}
              </div>
              {isSel&&(<div style={{padding:"0 14px 14px",borderTop:`1px solid ${C.border}`}}>
                {info.yt&&<div style={{marginBottom:10}}><YTThumb name={selEx} bp={selBP} height={90}/></div>}
                {exChart.length>1&&<div style={{marginBottom:10,height:130}}><ResponsiveContainer width="100%" height="100%"><LineChart data={exChart}><XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} width={32} domain={["auto","auto"]}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>`${v}kg`}/>{(data.targets||{})[name]&&<ReferenceLine y={parseFloat((data.targets||{})[name])} stroke="#34D399" strokeDasharray="4 4" label={{value:"Target",fill:"#34D399",fontSize:9,position:"insideTopRight"}}/>}<Line type="monotone" dataKey="weight" stroke={BP[selBP]?.color} strokeWidth={2.5} dot={{fill:BP[selBP]?.color,r:4}} activeDot={{r:6}}/></LineChart></ResponsiveContainer></div>}
                {showTarget===name?<div style={{display:"flex",gap:8}}><div style={{flex:1}}><Inp placeholder="Target weight (kg)" type="number" value={targetVal} onChange={setTargetVal}/></div><Btn onClick={()=>{saveTargets({...(data.targets||{}),[name]:targetVal});setShowTarget(null);setTargetVal("");showToast("🎯 Target set!");}} style={{padding:"10px 16px",fontSize:13}} color="#34D399">Set</Btn><Btn onClick={()=>setShowTarget(null)} secondary style={{padding:"10px 14px",fontSize:13}}>✕</Btn></div>:<button onClick={()=>setShowTarget(name)} style={{background:"transparent",border:`1px dashed ${C.border}`,borderRadius:10,padding:"8px 14px",width:"100%",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",marginTop:6}}>🎯 {(data.targets||{})[name]?`Change target (${(data.targets||{})[name]}kg)`:"Set a target weight"}</button>}
              </div>)}
            </div>);
          })}
          <Btn onClick={()=>{setTab("log");setSelBP(null);}} color={BP[selBP]?.color} style={{width:"100%",marginTop:10}}>+ Log a {selBP} session</Btn>
        </div>
      ))}

      {tab==="log"&&<>
        <Btn onClick={()=>setShowForm(f=>!f)} style={{width:"100%",marginBottom:14,background:"linear-gradient(135deg,#FF4500,#FF8C42)"}}>+ Log a session</Btn>
        {showForm&&<Card style={{marginBottom:14}}>
          <div className="sora" style={{fontWeight:800,marginBottom:14,fontSize:16}}>New Entry</div>
          <div style={{marginBottom:10}}><div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:5}}>Exercise</div><select value={form.exercise} onChange={e=>setForm(f=>({...f,exercise:e.target.value,reps:EX[e.target.value]?.reps||""}))} style={{width:"100%",background:"#080B15",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:form.exercise?C.text:C.muted,fontSize:14,outline:"none"}}><option value="">Select exercise...</option>{Object.keys(BP).map(bp=><optgroup key={bp} label={`── ${bp} ──`}>{Object.entries(EX).filter(([,i])=>i.bp===bp).map(([n])=><option key={n} value={n}>{n}</option>)}</optgroup>)}</select></div>
          {form.exercise&&EX[form.exercise]?.yt&&<div style={{marginBottom:10}}><YTThumb name={form.exercise} bp={EX[form.exercise].bp} height={85}/></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}><Inp label="Weight (kg)" placeholder="0" type="number" value={form.weight} onChange={v=>setForm(f=>({...f,weight:v}))}/><Inp label="Reps" placeholder="12" value={form.reps} onChange={v=>setForm(f=>({...f,reps:v}))}/><Inp label="Sets" placeholder="3" value={form.sets} onChange={v=>setForm(f=>({...f,sets:v}))}/></div>
          <Inp label="Date" type="date" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} style={{marginBottom:10}}/>
          <Inp label="Notes (optional)" placeholder="PR? How did it feel?" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} style={{marginBottom:14}}/>
          <div style={{display:"flex",gap:8}}><Btn onClick={()=>setShowForm(false)} secondary style={{flex:1,padding:"11px",fontSize:13}}>Cancel</Btn><Btn onClick={submitLog} disabled={!form.exercise||!form.weight} style={{flex:2,padding:"11px",fontSize:13,background:"linear-gradient(135deg,#FF4500,#FF8C42)"}}>Save</Btn></div>
        </Card>}
        {[...(data.strength||[])].reverse().slice(0,8).map((e,i)=><div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,marginBottom:7,padding:"11px 14px",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}>{BP[e.bp]?.icon||"💪"}</span><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{e.exercise}</div><div style={{fontSize:11,color:C.muted}}>{fmtDate(e.date)} · {e.sets}×{e.reps}</div></div><div className="sora" style={{fontSize:16,fontWeight:800,color:BP[e.bp]?.color||C.accent}}>{e.weight}kg</div></div>)}
      </>}

      {tab==="exercises"&&<>
        <div style={{display:"flex",gap:5,overflowX:"auto",padding:"0 0 12px",scrollbarWidth:"none"}}>
          <Chip label="All" color={C.accent} active={!exFilter} onClick={()=>setExFilter(null)} small/>
          {Object.keys(BP).map(bp=><Chip key={bp} label={bp} color={BP[bp]?.color} active={exFilter===bp} onClick={()=>setExFilter(exFilter===bp?null:bp)} small/>)}
        </div>
        {Object.entries(EX).filter(([,i])=>!exFilter||i.bp===exFilter).map(([name,info])=>{const best=Math.max(0,...(data.strength||[]).filter(e=>e.exercise===name).map(e=>parseFloat(e.weight)||0));return(<div key={name} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,marginBottom:8,padding:"13px 14px"}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{fontSize:22}}>{BP[info.bp]?.icon||"💪"}</span><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:14,lineHeight:1.3}}>{name}</div><div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}><Pill label={info.lvl} color={info.lvl==="Beginner"?"#34D399":info.lvl==="Intermediate"?"#60A5FA":"#E879F9"}/><Pill label={info.bp} color={BP[info.bp]?.color||C.accent}/><span style={{fontSize:11,color:C.muted}}>{info.eq}</span></div><div style={{fontSize:12,color:C.subtle,marginTop:7,lineHeight:1.55}}>{info.desc}</div>{info.tip&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic",marginTop:6,lineHeight:1.5}}>💬 {info.tip}</div>}</div><div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>{info.yt&&<button onClick={()=>window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent("how to do "+ex.n+" exercise proper form")}`,"_blank")} style={{width:28,height:28,background:"#FF0000",borderRadius:8,border:"none",cursor:"pointer",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center"}}>▶</button>}{best>0&&<div style={{fontSize:11,color:"#34D399",fontWeight:800,textAlign:"right"}}>PR<br/>{best}kg</div>}</div></div></div>);})}
      </>}
    </div>
    <Toast msg={toast}/>
  </div>);
}

function BodyPage({data,addWeight}){
  const [weight,setWeight]=useState("");const [date,setDate]=useState(dk());const [unit,setUnit]=useState("kg");const [period,setPeriod]=useState(30);const [toast,setToast]=useState(null);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),1800);};
  const save=()=>{if(!weight)return;addWeight({date,weight:parseFloat(weight),unit});setWeight("");showToast("⚖️ Logged!");};
  const chartData=useMemo(()=>{const cutoff=new Date();cutoff.setDate(cutoff.getDate()-period);return(data.weightLog||[]).filter(e=>new Date(e.date+"T12:00:00")>cutoff).map(e=>({date:fmtDate(e.date),weight:e.weight}));},[data.weightLog,period]);
  const latest=(data.weightLog||[]).slice(-1)[0];const prev7=(data.weightLog||[]).slice(-8,-1);const weekAvg=prev7.length?+(prev7.reduce((s,e)=>s+e.weight,0)/prev7.length).toFixed(1):null;const change=latest&&weekAvg?+(latest.weight-weekAvg).toFixed(1):null;
  return(<div style={{padding:"16px 20px",paddingBottom:80}}>
    <div className="sora" style={{fontSize:24,fontWeight:900,marginBottom:16}}>⚖️ Body Weight</div>
    {latest&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>{[{label:"Current",val:`${latest.weight}`,suf:unit,color:C.text},{label:"7-day avg",val:weekAvg||"—",suf:weekAvg?unit:"",color:C.subtle},{label:"Change",val:change!==null?`${change>0?"+":""}${change}`:"—",suf:change!==null?unit:"",color:change!==null?(change<0?"#34D399":change>0?"#F87171":C.subtle):C.subtle}].map(({label,val,suf,color})=><div key={label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{label}</div><div className="sora" style={{fontSize:18,fontWeight:900,color}}>{val}</div><div style={{fontSize:10,color:C.muted}}>{suf}</div></div>)}</div>}
    <div style={{display:"flex",gap:6,marginBottom:12}}>{[7,14,30,90].map(p=><Chip key={p} label={`${p}d`} color={C.accent} active={period===p} onClick={()=>setPeriod(p)} small/>)}</div>
    {chartData.length>1?<Card style={{marginBottom:16}}><div style={{fontWeight:700,marginBottom:12,fontSize:14}}>Weight trend — last {period} days</div><div style={{height:150}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366F1" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} width={35} domain={["auto","auto"]}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>`${v} ${unit}`}/><Area type="monotone" dataKey="weight" stroke="#6366F1" fill="url(#wGrad)" strokeWidth={2.5} dot={false} activeDot={{r:5,fill:"#6366F1"}}/></AreaChart></ResponsiveContainer></div></Card>:<Card style={{textAlign:"center",padding:"24px",marginBottom:16}}><div style={{fontSize:32,marginBottom:8}}>📉</div><div style={{fontSize:13,color:C.muted}}>Log at least 2 entries to see your trend</div></Card>}
    <Card style={{marginBottom:16}}><div className="sora" style={{fontWeight:800,marginBottom:12,fontSize:15}}>Log weight</div><div style={{display:"flex",gap:8,marginBottom:10}}>{["kg","lbs"].map(u=><button key={u} onClick={()=>setUnit(u)} style={{flex:1,padding:"9px",borderRadius:10,border:`1.5px solid ${unit===u?"#6366F1":C.border}`,background:unit===u?"#6366F115":"transparent",color:unit===u?"#818CF8":C.muted,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:13}}>{u}</button>)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}><Inp label={`Weight (${unit})`} type="number" placeholder="e.g. 62.5" suffix={unit} value={weight} onChange={setWeight}/><Inp label="Date" type="date" value={date} onChange={setDate}/></div><Btn onClick={save} disabled={!weight} style={{width:"100%",background:"linear-gradient(135deg,#6366F1,#818CF8)"}}>Save weight</Btn></Card>
    {(data.weightLog||[]).length>0&&<Card><div style={{fontWeight:700,marginBottom:12,fontSize:14}}>Recent entries</div>{[...(data.weightLog||[])].reverse().slice(0,10).map((e,i,arr)=>{const prev=arr[i+1];const diff=prev?+(e.weight-prev.weight).toFixed(1):null;return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}><div><div style={{fontSize:13,color:C.text,fontWeight:500}}>{fmtDate(e.date)}</div><div style={{fontSize:10,color:C.muted}}>{new Date(e.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long"})}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}>{diff!==null&&diff!==0&&<span style={{fontSize:11,color:diff<0?"#34D399":"#F87171",fontWeight:700}}>{diff>0?"+":""}{diff}{e.unit}</span>}<div className="sora" style={{fontSize:16,fontWeight:800,color:"#6366F1"}}>{e.weight} {e.unit}</div></div></div>);})}</Card>}
    <Toast msg={toast}/>
  </div>);
}

function ProgressPage({data,streak,earnedAchievements,onShare}){
  const [period,setPeriod]=useState(30);const now=useMemo(()=>new Date(),[]);
  const weeklyComp=useMemo(()=>[0,1,2,3].map(wk=>{let done=0,total=0;for(let d=0;d<7;d++){const date=new Date(now.getTime()-(wk*7+d)*864e5);const key=dk(date);const log=data.logs[key]||{};const dow=date.getDay();const plan=(data.profile?.plan||{})[dow];const t=(plan?.exs?.length||0)+2;done+=Object.keys(log).filter(k=>k.startsWith("done_")&&log[k]).length;total+=t;}return{label:wk===0?"This week":wk===1?"Last week":`${wk}w ago`,done,total,pct:total>0?Math.round(done/total*100):0};}),[data.logs,now]);
  const cutoffDate=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-period);return dk(d);},[period]);
  const bpComp=useMemo(()=>{const vol={};Object.entries(data.logs||{}).forEach(([date,log])=>{if(date<cutoffDate)return;const dow=new Date(date+"T12:00:00").getDay();const plan=(data.profile?.plan||{})[dow];(plan?.exs||[]).forEach((ex,i)=>{if(!log[`done_${i}`])return;const bp=ex.bp||(EX[ex.n]?.bp)||"Core";vol[bp]=(vol[bp]||0)+1;});});return Object.entries(vol).sort((a,b)=>b[1]-a[1]).map(([bp,count])=>({bp,count,color:BP[bp]?.color||C.accent}));},[data.logs,cutoffDate]);
  const compChart=useMemo(()=>{const result=[];for(let i=Math.min(period,60)-1;i>=0;i--){const d=new Date(now.getTime()-i*864e5);const key=dk(d);const log=data.logs[key]||{};const dow=d.getDay();const plan=(data.profile?.plan||{})[dow];const total=(plan?.exs?.length||0)+2;const done=Object.keys(log).filter(k=>k.startsWith("done_")&&log[k]).length;if(i%Math.ceil(period/12)===0||period<=14)result.push({date:fmtDate(key),pct:total>0?Math.round(done/total*100):0});}return result;},[data.logs,period,now]);
  const totalDone=Object.values(data.logs||{}).reduce((s,l)=>s+Object.keys(l).filter(k=>k.startsWith("done_")&&l[k]).length,0);
  const maxBPCount=bpComp[0]?.count||1;
  return(<div style={{padding:"16px 20px",paddingBottom:80}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div className="sora" style={{fontSize:24,fontWeight:900}}>📊 Progress</div>
      <button onClick={onShare} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",color:C.subtle,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:12}}>📤 Share</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>{[{label:"Streak",val:streak,suf:"days",icon:"🔥",color:C.accent},{label:"Done",val:totalDone,suf:"exercises",icon:"✅",color:"#34D399"},{label:"Sessions",val:(data.strength||[]).length,suf:"logged",icon:"💪",color:"#E879F9"}].map(({label,val,suf,icon,color})=><div key={label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:22,marginBottom:4}}>{icon}</div><div className="sora" style={{fontSize:22,fontWeight:900,color}}>{val}</div><div style={{fontSize:10,color:C.muted}}>{suf}</div><div style={{fontSize:10,color:C.muted,fontWeight:600}}>{label}</div></div>)}</div>
    <Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Weekly completion</div><div style={{display:"flex",gap:10,justifyContent:"space-around"}}>{weeklyComp.map(({label,pct,done,total})=><div key={label} style={{textAlign:"center"}}><Ring pct={pct} color={pct>=80?"#34D399":pct>=50?"#FBBF24":C.accent} size={56} sw={5}/><div style={{fontSize:10,color:C.muted,marginTop:6,fontWeight:600}}>{label}</div><div style={{fontSize:10,color:C.subtle}}>{done}/{total}</div></div>)}</div></Card>
    <div style={{display:"flex",gap:6,marginBottom:12}}>{[7,14,30,60].map(p=><Chip key={p} label={`${p}d`} color={C.accent} active={period===p} onClick={()=>setPeriod(p)} small/>)}</div>
    {compChart.some(d=>d.pct>0)&&<Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:12,fontSize:14}}>Daily completion % — last {period} days</div><div style={{height:130}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={compChart}><defs><linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} width={28} domain={[0,100]}/><Tooltip formatter={v=>`${v}%`} contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}}/><Area type="monotone" dataKey="pct" stroke={C.accent} fill="url(#cGrad)" strokeWidth={2.5} dot={false}/></AreaChart></ResponsiveContainer></div></Card>}
    {bpComp.length>0&&<Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:12,fontSize:14}}>Muscles trained — last {period} days</div>{bpComp.map(({bp,count,color})=><div key={bp} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:14}}>{BP[bp]?.icon||"💪"}</span><span style={{fontSize:13,fontWeight:600}}>{bp}</span></div><span style={{fontSize:12,color:C.muted,fontWeight:600}}>{count} exercises</span></div><div style={{height:5,background:C.border,borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",width:`${(count/maxBPCount)*100}%`,background:color,borderRadius:5,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/></div></div>)}</Card>}
    <Card><div style={{fontWeight:700,marginBottom:14,fontSize:14}}>🏆 Achievements</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{ACHVS.map(a=>{const earned=earnedAchievements.includes(a.id);return(<div key={a.id} style={{background:earned?"#1A2440":"#0A0E1A",border:`1.5px solid ${earned?"#3A4570":C.border}`,borderRadius:12,padding:12,textAlign:"center",opacity:earned?1:0.4,transition:"all .3s",position:"relative"}}><div style={{fontSize:28,marginBottom:6,filter:earned?"none":"grayscale(100%)"}}>{a.icon}</div><div style={{fontSize:12,fontWeight:700,color:earned?C.text:C.muted,lineHeight:1.3}}>{a.title}</div><div style={{fontSize:10,color:C.muted,marginTop:3,lineHeight:1.4}}>{a.desc}</div>{earned&&<div style={{fontSize:9,color:C.accent,marginTop:4,fontWeight:700,letterSpacing:.5}}>UNLOCKED</div>}</div>);})}</div></Card>
  </div>);
}

/* ── SETTINGS PAGE ────────────────────────────────────────────────── */
function SettingsPage({data,setProfile,addStrength,saveTargets,user,signOut,onShare}){
  const [showPlanEditor,setShowPlanEditor]=useState(false);
  const [showUpgrade,setShowUpgrade]=useState(false);
  const profile=data.profile||{};
  const level=profile.level||"Beginner";
  const preset=PRESET_PLANS[level];
  const nextLevel=LEVEL_ORDER[LEVEL_ORDER.indexOf(level)+1];
  const streak=useMemo(()=>calcStreak(data.logs||{}),[data.logs]);
  const totalDone=Object.values(data.logs||{}).reduce((s,l)=>s+Object.keys(l).filter(k=>k.startsWith("done_")&&l[k]).length,0);

  if(showPlanEditor)return(
    <PlanEditor
      profile={profile}
      preset={preset}
      injuries={profile.injuries||[]}
      title="Edit Your Plan"
      onSave={p=>{setProfile({...profile,plan:p});setShowPlanEditor(false);}}
      onClose={()=>setShowPlanEditor(false)}
    />
  );

  return(<div style={{padding:"16px 20px",paddingBottom:80}}>
    <div className="sora" style={{fontSize:24,fontWeight:900,marginBottom:20}}>⚙️ Settings</div>

    {/* Profile card */}
    <Card style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        {user?.user_metadata?.avatar_url?<img src={user.user_metadata.avatar_url} alt="" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>:<div style={{width:52,height:52,borderRadius:"50%",background:"#1A2440",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>👤</div>}
        <div>
          <div className="sora" style={{fontWeight:800,fontSize:17}}>{profile.name||user?.user_metadata?.full_name||"Athlete"}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{profile.gender&&profile.age?`${profile.gender} · ${profile.age} yrs · `:""}Level: <span style={{color:C.accent,fontWeight:700}}>{level}</span></div>
          {profile.injuries&&profile.injuries.length>0&&!profile.injuries.includes("No injuries")&&<div style={{fontSize:11,color:"#F87171",marginTop:4}}>⚠️ Injuries: {profile.injuries.join(", ")}</div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[{label:"Streak",val:`${streak}d`,icon:"🔥",color:C.accent},{label:"Done",val:totalDone,icon:"✅",color:"#34D399"},{label:"Sessions",val:(data.strength||[]).length,icon:"💪",color:"#E879F9"}].map(({label,val,icon,color})=><div key={label} style={{background:"#080B15",borderRadius:10,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:16}}>{icon}</div><div className="sora" style={{fontSize:16,fontWeight:800,color,marginTop:2}}>{val}</div><div style={{fontSize:10,color:C.muted}}>{label}</div></div>)}
      </div>
    </Card>

    {/* Plan management */}
    <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Your Training Plan</div>
    <Card style={{marginBottom:10}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{preset.label}</div>
      <div style={{fontSize:12,color:C.subtle,lineHeight:1.6,marginBottom:14}}>{preset.rationale.slice(0,120)}...</div>
      <div style={{display:"flex",gap:8}}>
        <Btn onClick={()=>setShowPlanEditor(true)} style={{flex:1,padding:"11px",fontSize:13,background:"#6366F1"}}>✏️ Edit plan</Btn>
        {nextLevel&&<Btn onClick={()=>setShowUpgrade(true)} style={{flex:1,padding:"11px",fontSize:13,background:"linear-gradient(135deg,#FF4500,#FF8C42)"}}>⬆️ Upgrade to {nextLevel}</Btn>}
      </div>
    </Card>

    {/* Week at a glance */}
    <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10,marginTop:14}}>This Week's Schedule</div>
    <Card style={{marginBottom:14}}>
      {[0,1,2,3,4,5,6].map((d,i)=>{
        const day=(profile.plan||{})[d];const isRest=day?.type==="rest";
        return(<div key={d} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<6?`1px solid ${C.border}`:"none"}}>
          <div style={{width:32,height:32,borderRadius:9,background:isRest?"#1C2440":day?.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{day?.emoji||"😴"}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:isRest?C.muted:C.text}}>{FULL_DAYS[d]}</div><div style={{fontSize:11,color:C.muted}}>{day?.focus||"Rest"}</div></div>
          {!isRest&&day?.exs?.length>0&&<span style={{fontSize:11,color:C.muted}}>{day.exs.length} ex</span>}
        </div>);
      })}
    </Card>

    {/* Share + Account */}
    <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Share & Account</div>
    <Card>
      <button onClick={onShare} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"DM Sans,sans-serif",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>📤 Share my progress</button>
      <button onClick={async()=>{const u=`https://forgebetteryou.netlify.app`;try{if(navigator.share)await navigator.share({title:"FORGE — Fitness Tracker",text:"Track your workouts, strength & body on FORGE 🔥",url:u});}catch{}}} style={{width:"100%",padding:"13px",borderRadius:12,background:`${C.accent}20`,color:C.accent,border:`1.5px solid ${C.accent}40`,cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"DM Sans,sans-serif",marginBottom:10}}>🔗 Invite a friend to FORGE</button>
      {user&&<button onClick={async()=>{if(window.confirm("Sign out of FORGE?"))await signOut();}} style={{width:"100%",padding:"13px",borderRadius:12,background:"transparent",color:C.muted,border:`1.5px solid ${C.border}`,cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"DM Sans,sans-serif"}}>Sign out ({user.email})</button>}
    </Card>

    {showUpgrade&&<UpgradePlanModal currentLevel={level} profile={profile} setProfile={setProfile} onClose={()=>setShowUpgrade(false)}/>}
  </div>);
}

/* ── APP ROOT ─────────────────────────────────────────────────────── */
export default function App(){
  const{user,authLoading,signInGoogle,signOut,hasSB}=useAuth();
  const[skippedAuth,setSkippedAuth]=useState(false);
  const userId=user?.id||null;
  const{data,ready,setProfile,setLog,addStrength,addWeight,saveAchievements,saveTargets}=useStorage(userId);
  const[page,setPage]=useState(0);
  const[newAchievement,setNewAchievement]=useState(null);
  const[showShare,setShowShare]=useState(false);
  const prevAchievements=useRef([]);

  const streak=useMemo(()=>calcStreak(data.logs||{}),[data.logs]);
  const earnedAchievements=useMemo(()=>getEarned(data,streak),[data,streak]);

  useEffect(()=>{
    if(!data.profile)return;
    const newOnes=earnedAchievements.filter(id=>!prevAchievements.current.includes(id));
    if(newOnes.length>0){const a=ACHVS.find(x=>x.id===newOnes[0]);if(a)setNewAchievement(a);saveAchievements(earnedAchievements);}
    prevAchievements.current=earnedAchievements;
  },[earnedAchievements]);

  const showAuth=!authLoading&&!user&&!skippedAuth;

  if(authLoading)return(<><style>{CSS}</style><div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg,gap:16}}><div className="sora" style={{fontSize:32,fontWeight:900,letterSpacing:-1}}>FORGE<span style={{color:C.accent}}>.</span></div><div style={{width:28,height:28,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div></>);
  if(showAuth)return(<><style>{CSS}</style><LoginScreen signInGoogle={signInGoogle} hasSB={hasSB} onSkip={()=>setSkippedAuth(true)}/></>);
  if(!ready)return(<><style>{CSS}</style><div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><div style={{width:28,height:28,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div></>);
  if(!data.profile)return(<><style>{CSS}</style><Onboarding onDone={setProfile} userName={user?.user_metadata?.full_name?.split(" ")[0]||""}/></>);

  const todayDow=new Date().getDay();const todayPlan=(data.profile?.plan||{})[todayDow];const todayLog=data.logs[dk()]||{};const todayExs=[...(todayPlan?.exs||[]),{},{}];const todayDone=todayExs.filter((_,i)=>todayLog[`done_${i}`]).length;const todayPct=todayExs.length>0?Math.round(todayDone/todayExs.length*100):0;
  const NAV=[{icon:"🏠",label:"Today"},{icon:"💪",label:"Strength"},{icon:"⚖️",label:"Body"},{icon:"📊",label:"Progress"},{icon:"⚙️",label:"Settings"}];

  return(<>
    <style>{CSS}</style>
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg,maxWidth:430,margin:"0 auto"}}>
      <div style={{background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"12px 20px 10px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div className="sora" style={{fontSize:15,fontWeight:900,letterSpacing:.5}}>FORGE<span style={{color:C.accent}}>.</span></div>
          <div style={{fontSize:12,color:C.muted}}>Hey, {data.profile?.name?.split(" ")[0]||"there"} 👋</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Today</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:56,height:4,background:C.border,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${todayPct}%`,background:C.accent,borderRadius:4,transition:"width .5s"}}/></div>
              <div className="sora" style={{fontSize:14,fontWeight:800,color:todayPct>=100?"#34D399":todayPct>50?"#FBBF24":C.accent}}>{todayPct}%</div>
            </div>
          </div>
          {user?.user_metadata?.avatar_url&&<button onClick={()=>setPage(4)} style={{width:32,height:32,borderRadius:"50%",background:"#1A2440",border:`2px solid ${C.border}`,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}}><img src={user.user_metadata.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></button>}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
        {page===0&&<TodayPage data={data} setLog={setLog} streak={streak} onShare={()=>setShowShare(true)}/>}
        {page===1&&<StrengthPage data={data} addStrength={addStrength} saveTargets={saveTargets}/>}
        {page===2&&<BodyPage data={data} addWeight={addWeight}/>}
        {page===3&&<ProgressPage data={data} streak={streak} earnedAchievements={earnedAchievements} onShare={()=>setShowShare(true)}/>}
        {page===4&&<SettingsPage data={data} setProfile={setProfile} addStrength={addStrength} saveTargets={saveTargets} user={user} signOut={signOut} onShare={()=>setShowShare(true)}/>}
      </div>

      <div style={{background:C.bg,borderTop:`1px solid ${C.border}`,padding:"6px 0 14px",display:"flex",flexShrink:0,position:"sticky",bottom:0,zIndex:50,width:"100%"}}>
        {NAV.map(({icon,label},i)=><button key={i} onClick={()=>setPage(i)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"transparent",border:"none",cursor:"pointer",padding:"6px 0"}}><span style={{fontSize:19,filter:page===i?"none":"grayscale(100%) opacity(50%)",transition:"all .2s"}}>{icon}</span><span style={{fontSize:10,fontWeight:page===i?700:400,color:page===i?C.accent:C.muted,fontFamily:"DM Sans,sans-serif",transition:"color .2s"}}>{label}</span>{page===i&&<div style={{width:16,height:2,background:C.accent,borderRadius:2}}/>}</button>)}
      </div>
    </div>

    {showShare&&<ShareModal data={data} streak={streak} onClose={()=>setShowShare(false)}/>}
    {newAchievement&&<AchievementBanner achievement={newAchievement} onDone={()=>setNewAchievement(null)}/>}
  </>);
}
