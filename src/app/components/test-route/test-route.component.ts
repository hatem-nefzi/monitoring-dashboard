// src/app/test-route/test-route.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KubernetesService } from '../../services/kubernetes.service';
import { PodListComponent } from '../../components/pod-list/pod-list.component';

@Component({
  selector: 'app-test-route',
  standalone: true,
  imports: [CommonModule, PodListComponent],
  template: `
    <div class="test-container">
      <h2>Kubernetes Pods Dashboard</h2>
      <button (click)="fetchPods()">Refresh Pod Data</button>
      
      <app-pod-list 
        [pods]="pods" 
        [loading]="loading">
      </app-pod-list>
      
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
    }
    button {
      margin-bottom: 20px;
      padding: 10px 15px;
      background: #3f51b5;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .error-message {
      color: #f44336;
      margin-top: 20px;
    }
  `]
})
export class TestRouteComponent {
  pods: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private k8sService: KubernetesService) {}

  fetchPods(): void {
    this.loading = true;
    this.error = null;
    
    this.k8sService.getPods().subscribe({
      next: (response) => {
        this.pods = response.pods || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}