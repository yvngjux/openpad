import express from 'express';
import next from 'next';
import net from 'net';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Create IPv4-only socket
const server = new net.Server({ family: 4 });

app.prepare().then(() => {
  const expressApp = express();

  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  // Force IPv4
  const httpServer = expressApp.listen(3000, '0.0.0.0', () => {
    const addr = httpServer.address();
    console.log(`> Ready on http://0.0.0.0:3000`);
    console.log(`Server bound to ${addr.address}:${addr.port}`);
  });

  // Handle errors
  httpServer.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
});
