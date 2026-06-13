const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf8');
content = content.replace(/model: MODEL_PRO/g, 'model: getNativeModel(MODEL_PRO)');
fs.writeFileSync('services/geminiService.ts', content);
