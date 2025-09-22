import { HttpInterceptorFn } from '@angular/common/http';

export const tracingInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add tracing to API calls
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Generate trace ID for this request
  const frontendTraceId = generateTraceId();
  const component = getComponentFromUrl(req.url);

  // Add headers to ALL API requests automatically
  const tracedRequest = req.clone({
    setHeaders: {
      'X-Frontend-Trace-Id': frontendTraceId,
      'X-Frontend-Component': component,
      'X-Frontend-Method': req.method,
      'X-Frontend-Timestamp': new Date().toISOString()
    }
  });

  console.log(`🔍 Auto-tracing: ${req.method} ${req.url} [${frontendTraceId}]`);

  return next(tracedRequest);
};

function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getComponentFromUrl(url: string): string {
  if (url.includes('/pods')) return 'pods-dashboard';
  if (url.includes('/deployments')) return 'deployments-dashboard';
  if (url.includes('/services')) return 'services-dashboard';
  if (url.includes('/namespaces')) return 'namespaces-selector';
  if (url.includes('/logs')) return 'logs-viewer';
  return 'unknown-component';
}