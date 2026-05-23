import { env } from './config/env.js';
import { registerHealthRoutes } from './routes/health.routes.js';

const createRouter = () => {
  const routes = new Map();

  return {
    get: (path, handler) => {
      routes.set(`GET ${path}`, handler);
    },
    match: (method, path) => routes.get(`${method.toUpperCase()} ${path}`),
  };
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
};

const applyCors = (req, res) => {
  const requestOrigin = req.headers.origin;
  const allowOrigin = requestOrigin === env.frontendOrigin ? requestOrigin : env.frontendOrigin;

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
};

export const createApp = () => {
  const router = createRouter();
  registerHealthRoutes(router);

  return (req, res) => {
    applyCors(req, res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const routeHandler = router.match(req.method || 'GET', requestUrl.pathname);

    if (!routeHandler) {
      sendJson(res, 404, {
        error: 'Not Found',
        path: requestUrl.pathname,
      });
      return;
    }

    const response = {
      json: (statusCode, payload) => sendJson(res, statusCode, payload),
    };

    routeHandler(
      {
        method: req.method || 'GET',
        url: requestUrl,
        headers: req.headers,
      },
      response
    );
  };
};
