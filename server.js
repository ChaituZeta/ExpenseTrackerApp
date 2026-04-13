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

const tsxCli = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
console.log('Checking for tsx at:', tsxCli);

if (!existsSync(tsxCli)) {
  console.error('CRITICAL ERROR: tsx CLI not found. Please run "npm install" in the Hostinger panel.');
  process.exit(1);
}

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
  // Exit the parent process so Hostinger knows we are down
  process.exit(code || 1);
});
