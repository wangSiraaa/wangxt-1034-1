const fs = require('fs');
const path = require('path');
const TARGET = path.join(__dirname, 'src/pages/admin/SummerCamp.tsx');
const old = fs.readFileSync(TARGET, 'utf-8');
const lines = old.split('\n');
console.log('Old file:', lines.length, 'lines');
