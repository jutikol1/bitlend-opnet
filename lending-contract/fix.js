const fs = require('fs');
let content = fs.readFileSync('deploy.ts', 'utf8');

// Ganti guard check lama
content = content.replace(
  `if (PRIVATE_KEY === 'YOUR_WIF_PRIVATE_KEY_HERE') {`,
  `if (!PRIVATE_KEY || PRIVATE_KEY.length < 10) {`
);

fs.writeFileSync('deploy.ts', content);
console.log('Fixed!');

// Verifikasi
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('PRIVATE_KEY ===') || l.includes('PRIVATE_KEY.length')) {
    console.log('Line', i+1, ':', l.trim());
  }
});
