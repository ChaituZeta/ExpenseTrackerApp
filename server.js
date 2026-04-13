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

console.log('Starting FinTrack Application via server.js...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// We use node to run the tsx CLI script directly. 
// This avoids "Permission denied" (code 126) errors that happen when 
// the node_modules/.bin/tsx binary doesn't have execute permissions.
const tsxCli = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
console.log('Using tsx CLI at:', tsxCli);

const child = spawn(process.execPath, [tsxCli, 'server.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

child.on('error', (err) => {
  console.error('Failed to start process:', err);
});

child.on('exit', (code) => {
  console.log(`Application process exited with code ${code}`);
});
