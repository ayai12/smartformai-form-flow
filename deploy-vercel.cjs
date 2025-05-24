const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel deployment preparation...');

// 1. Make sure vercel.json exists
if (!fs.existsSync('vercel.json')) {
  console.log('Creating vercel.json...');
  const vercelConfig = {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
    "cleanUrls": true,
    "trailingSlash": false
  };
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
}

// 2. Make sure _redirects exists in public folder
if (!fs.existsSync(path.join('public', '_redirects'))) {
  console.log('Creating _redirects file...');
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }
  fs.writeFileSync(path.join('public', '_redirects'), '/* /index.html 200');
}

// 3. Make sure 404.html exists in public folder
if (!fs.existsSync(path.join('public', '404.html'))) {
  console.log('Creating 404.html...');
  const notFoundPage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SmartFormAI - Redirecting</title>
  <script>
    sessionStorage.redirect = location.href;
    window.location.href = '/';
  </script>
</head>
<body>
  <h1>Redirecting...</h1>
  <p>If you're not redirected automatically, <a href="/">click here</a>.</p>
</body>
</html>`;
  fs.writeFileSync(path.join('public', '404.html'), notFoundPage);
}

console.log('✅ Preparation complete!');
console.log('🔄 Building project...');

try {
  // 4. Run the build
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
  
  console.log('🚀 Ready for deployment to Vercel!');
  console.log('Run "vercel" or "vercel --prod" to deploy');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 