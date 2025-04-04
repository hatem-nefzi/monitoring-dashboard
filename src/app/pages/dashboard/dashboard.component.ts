// src/app/pages/dashboard/dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PodListComponent } from '../../components/pod-list/pod-list.component';
import { KubernetesService } from '../../services/kubernetes.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    PodListComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  pods: any[] = [];
  loading = false;

  constructor(private k8sService: KubernetesService) {}

  fetchPods(): void {
    this.loading = true;
    this.k8sService.getPods().subscribe({
      next: (response) => {
        this.pods = response.pods || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching pods:', err);
        this.loading = false;
      }
    });
  }
}