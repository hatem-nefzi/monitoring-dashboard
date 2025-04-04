// src/app/test-route/test-route.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { KubernetesService } from '../../services/kubernetes.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-test-route',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <h2>Pod Data Test</h2>
    <button (click)="fetchPods()">Fetch Pods</button>
    
    <div *ngIf="loading">Loading...</div>
    
    <div *ngIf="error" class="error">
      Error: {{ error }}
    </div>
    
    <pre *ngIf="podsData">{{ podsData | json }}</pre>
  `,
  styles: [`
    .error { color: red; }
    pre { background: #f5f5f5; padding: 10px; }
  `]
})
export class TestRouteComponent {
  podsData: any;
  loading = false;
  error: string | null = null;

  constructor(private k8sService: KubernetesService) {}

  fetchPods(): void {
    this.loading = true;
    this.error = null;
    
    this.k8sService.getPods().subscribe({
      next: (response) => {
        this.podsData = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
        console.error('Error fetching pods:', err);
      }
    });
  }
}