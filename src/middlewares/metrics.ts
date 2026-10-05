import client from 'prom-client';
import type { NextFunction, Request, Response } from 'express';

export const metricsRegistry = new client.Registry();
if (process.env.NODE_ENV !== 'test') {
  client.collectDefaultMetrics({ register: metricsRegistry });
}

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Общее количество HTTP-запросов, по методу/маршруту/коду ответа',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Длительность обработки HTTP-запроса, секунды',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const routeTemplate = req.route?.path ? `${req.baseUrl}${req.route.path}` : undefined;
    const route = routeTemplate ?? (res.statusCode === 404 ? 'unmatched' : req.path);
    const labels = { method: req.method, route, status_code: String(res.statusCode) };

    httpRequestsTotal.inc(labels);
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.observe(labels, durationSeconds);
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response) {
  res.setHeader('Content-Type', metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
}
