import http from 'http';
import { spawn } from 'child_process';

const serverProc = spawn('node', ['server/index.js'], { cwd: process.cwd(), stdio: 'pipe' });

serverProc.stdout.on('data', (d) => {
  const msg = d.toString();
  if (msg.includes('Server active on port')) {
    // Make request to healthz
    http.get('http://localhost:10000/healthz', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('HEALTHCHECK VERIFIED:', JSON.parse(data).status);
        serverProc.kill();
        process.exit(0);
      });
    }).on('error', (err) => {
      console.error('Request Error:', err);
      serverProc.kill();
      process.exit(1);
    });
  }
});

serverProc.stderr.on('data', (d) => {
  console.error('SERVER STDERR:', d.toString());
});

setTimeout(() => {
  console.error('Smoke test timeout after 6 seconds');
  serverProc.kill();
  process.exit(1);
}, 6000);
