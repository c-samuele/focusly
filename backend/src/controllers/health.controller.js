export const getHealth = (_req, res) => {
  res.json(200, {
    status: 'ok',
    service: 'study-planner-backend',
    timestamp: new Date().toISOString(),
    capabilities: {
      restApi: true,
      cloudStorageReady: true,
      socketsReady: true,
      authReady: true,
    },
  });
};
