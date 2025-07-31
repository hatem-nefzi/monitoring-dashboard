// src/app/metrics/metrics.component.ts
import { Component } from '@angular/core';
import { MetricsService } from '../services/metrics.service';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-metrics',
  template: ``, // No template needed for metrics endpoint
})
export class MetricsComponent {
  constructor(private metricsService: MetricsService) {}

  getMetrics(): string {
    return this.metricsService.getMetricsAsPrometheus();
  }
}

// Add to your app-routing.module.ts
// {
//   path: 'metrics',
//   component: MetricsComponent
// }

// Or better, create a simple endpoint in your main component:
// Add this to your app.component.ts:

// ngOnInit() {
//   // Expose metrics endpoint
//   if ((window as any).location.pathname === '/metrics') {
//     document.body.innerHTML = `<pre>${this.metricsService.getMetricsAsPrometheus()}</pre>`;
//   }
// }