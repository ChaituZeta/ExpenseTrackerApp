/**
 * Hostinger Startup File
 * This file bootstraps the TypeScript server using tsx.
 * Point your Hostinger "Startup File" to this file (server.js).
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- STARTUP DEBUG INFO ---');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);

const possibleTsxPaths = [
  path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
  path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.js'),
  path.join(__dirname, 'node_modules', '.bin', 'tsx')
];

let tsxCli = '';
for (const p of possibleTsxPaths) {
  console.log('Checking for tsx at:', p);
  if (existsSync(p)) {
    tsxCli = p;
    break;
  }
}

if (!tsxCli) {
  console.error('CRITICAL ERROR: tsx CLI not found in any expected location.');
  console.error('Please ensure you have run "npm install" and that "tsx" is in your package.json dependencies.');
  
  // Fallback diagnostic server so the user doesn't just see a 503
  import('http').then(http => {
    const server = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <h1>FinTrack Startup Error</h1>
        <p>The application failed to start because the <b>tsx</b> library was not found.</p>
        <p><b>Action Required:</b> Go to your Hostinger Node.js dashboard and click <b>"npm install"</b>.</p>
        <hr/>
        <pre>Diagnostic Info: ${new Date().toISOString()}</pre>
      `);
    });
    server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
      console.log('Diagnostic server running on port', process.env.PORT || 3000);
    });
  });
} else {
  console.log('Using tsx at:', tsxCli);
  const child = spawn(process.execPath, [tsxCli, 'server.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  child.on('error', (err) => {
    console.error('PROCESS SPAWN ERROR:', err);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    console.log(`Application process exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
      console.error('The app crashed. Check server.ts for syntax errors or missing environment variables.');
    }
    process.exit(code || 1);
  });
}
