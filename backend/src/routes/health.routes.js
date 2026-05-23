import { getHealth } from '../controllers/health.controller.js';

export const registerHealthRoutes = (router) => {
  router.get('/api/health', getHealth);
};
