const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy vercel.json to dist
fs.copyFileSync('vercel.json', path.join('dist', 'vercel.json'));

// Create _redirects file in dist
fs.writeFileSync(path.join('dist', '_redirects'), '/* /index.html 200');

console.log('Vercel configuration files copied to dist folder'); 