const fs = require('fs');
let c = fs.readFileSync('deploy.ts', 'utf8');

// Ganti semua kemungkinan guard check
c = c.replace(/if \([^)]*PRIVATE_KEY[^)]*\) \{[\s\S]*?process\.exit\(1\);\s*\}/m, 
  'if (!PRIVATE_KEY || PRIVATE_KEY.length < 10) {\n    console.error("ERROR: PRIVATE_KEY kosong!");\n    process.exit(1);\n  }');

fs.writeFileSync('deploy.ts', c);
console.log('Done!');
