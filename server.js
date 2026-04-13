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

/**
 * Hostinger Startup File
 * This file runs the pre-compiled production server.
 */
import './server.dist.cjs';
