const parsePort = (value, fallback) => {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

export const env = {
  host: process.env.HOST || '127.0.0.1',
  port: parsePort(process.env.PORT, 3001),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:4173',
};
