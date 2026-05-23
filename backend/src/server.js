import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initializeSocketLayer } from './sockets/index.js';

const app = createApp();
const server = http.createServer(app);

initializeSocketLayer(server);

server.listen(env.port, env.host, () => {
  console.log(`Backend listening on http://${env.host}:${env.port}`);
});
