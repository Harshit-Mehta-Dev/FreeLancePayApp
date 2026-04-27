const fs = require('fs');
const path = require('path');

const BLACKLIST = [
  /JWT_SECRET\s*=\s*[a-zA-Z0-9_-]{10,}/,
  /API_KEY\s*=\s*[a-zA-Z0-9_-]{10,}/,
  /PASSWORD\s*=\s*[a-zA-Z0-9_-]{8,}/,
  /SECRET\s*=\s*[a-zA-Z0-9_-]{10,}/
];

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build'];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (IGNORE_DIRS.includes(file)) continue;
    
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.env')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Don't flag .env files themselves as leaks, but check if they are in git
      if (file === '.env') {
         console.log(`[INFO] .env file found at ${fullPath}. Ensure this is in .gitignore!`);
         continue;
      }

      BLACKLIST.forEach(pattern => {
        if (pattern.test(content)) {
          console.error(`[CRITICAL] Potential secret leak found in ${fullPath}`);
          console.error(`Matched pattern: ${pattern}`);
        }
      });
    }
  }
}

console.log('🛡️ Starting Cyber-Cloud Secret Scan...');
scanDir(path.join(__dirname, '..'));
console.log('✅ Scan complete.');
