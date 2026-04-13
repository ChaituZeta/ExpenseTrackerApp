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

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- HOSTINGER WRAPPER STARTING ---');
console.log('Node Version:', process.version);
console.log('Assigned Port:', process.env.PORT || '3000 (default)');

// Use npx to run tsx - this is more reliable on Hostinger
const child = spawn('npx', ['tsx', 'server.ts'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

child.on('error', (err) => {
  console.error('CRITICAL: Failed to start child process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log('Child process exited with code:', code);
  process.exit(code || 1);
});
