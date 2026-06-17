const fs=require("fs");let c=fs.readFileSync("src/pages/admin/SummerCamp.tsx","utf-8");const o="  const sessions: GeneratedSession[] = [];
  try {
    const baseDate = parseISO(cohort.startDate);
    for";const n="FOUND_IT";if(c.includes(o)){console.log("has try")}else{const idx=c.indexOf("const sessions: GeneratedSession[] = []");console.log("sessions array at:",idx);console.log("context:",c.substring(idx, idx+200))}
