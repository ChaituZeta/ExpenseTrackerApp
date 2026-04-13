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

// Use the local tsx binary from node_modules for better compatibility
const tsxPath = path.join(__dirname, 'node_modules', '.bin', 'tsx');

if (!existsSync(tsxPath)) {
  console.error(`ERROR: tsx not found at ${tsxPath}. Did you run npm install?`);
  process.exit(1);
}

const child = spawn(tsxPath, ['server.ts'], {
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
