/**
 * Hostinger Startup File
 * This file bootstraps the TypeScript server using tsx.
 * Point your Hostinger "Startup File" to this file (startup.js).
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting FinTrack Application...');

const child = spawn('npx', ['tsx', 'server.ts'], {
  stdio: 'inherit',
  shell: true,
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
