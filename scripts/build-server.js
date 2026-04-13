import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  console.log('Building server for production...');
  
  try {
    await esbuild.build({
      entryPoints: ['server.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: 'server.dist.cjs',
      format: 'cjs',
      minify: false, // Keep it readable for debugging
      sourcemap: true,
      external: ['fsevents', 'vite'], // Vite should be external as it's only for dev
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      banner: {
        js: '/** Production Server Build **/',
      },
    });
    console.log('Build successful: server.dist.cjs');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
