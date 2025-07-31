// src/app/services/metrics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private metrics = {
    page_views: new Map<string, number>(),
    user_interactions: 0,
    errors: 0,
    load_time: 0,
    api_calls: new Map<string, { success: number, error: number }>()
  };

  constructor(private router: Router, private http: HttpClient) {
    this.initializeRouteTracking();
    this.initializeErrorTracking();
    this.measureLoadTime();
  }

  private initializeRouteTracking() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const route = event.urlAfterRedirects;
        const currentCount = this.metrics.page_views.get(route) || 0;
        this.metrics.page_views.set(route, currentCount + 1);
      });
  }

  private initializeErrorTracking() {
    window.addEventListener('error', () => {
      this.metrics.errors++;
    });

    window.addEventListener('unhandledrejection', () => {
      this.metrics.errors++;
    });
  }

  private measureLoadTime() {
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.metrics.load_time = loadTime;
    });
  }

  trackUserInteraction() {
    this.metrics.user_interactions++;
  }

  trackApiCall(endpoint: string, success: boolean) {
    if (!this.metrics.api_calls.has(endpoint)) {
      this.metrics.api_calls.set(endpoint, { success: 0, error: 0 });
    }
    
    const calls = this.metrics.api_calls.get(endpoint)!;
    if (success) {
      calls.success++;
    } else {
      calls.error++;
    }
  }

  getMetricsAsPrometheus(): string {
    let prometheus = '';
    
    // Page views
    this.metrics.page_views.forEach((count, route) => {
      prometheus += `frontend_page_views{route="${route}"} ${count}\n`;
    });
    
    // User interactions
    prometheus += `frontend_user_interactions_total ${this.metrics.user_interactions}\n`;
    
    // Errors
    prometheus += `frontend_errors_total ${this.metrics.errors}\n`;
    
    // Load time
    prometheus += `frontend_load_time_ms ${this.metrics.load_time}\n`;
    
    // API calls
    this.metrics.api_calls.forEach((calls, endpoint) => {
      prometheus += `frontend_api_calls_total{endpoint="${endpoint}",status="success"} ${calls.success}\n`;
      prometheus += `frontend_api_calls_total{endpoint="${endpoint}",status="error"} ${calls.error}\n`;
    });
    
    return prometheus;
  }
}