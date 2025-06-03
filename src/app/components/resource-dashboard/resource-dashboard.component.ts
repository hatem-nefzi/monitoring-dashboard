// src/components/resource-dashboard/resource-dashboard.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { KubernetesService } from '../../services/kubernetes.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription, timer, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DeploymentInfo, ServiceInfo, IngressInfo } from '../../models/kubernetes.model';

@Component({
  selector: 'app-resource-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './resource-dashboard.component.html',
  styleUrls: ['./resource-dashboard.component.scss']
})
export class ResourceDashboardComponent implements OnInit, OnDestroy {
  deployments: DeploymentInfo[] = [];
  services: ServiceInfo[] = [];
  ingresses: IngressInfo[] = [];
  namespaces: string[] = ['all'];
  loading = false;
  autoRefreshEnabled = true;
  private refreshSubscription?: Subscription;

  namespaceControl = new FormControl('all');
  selectedTab = new FormControl(0);

  // Table columns
  deploymentColumns = ['name', 'namespace', 'replicas', 'available', 'labels'];
  serviceColumns = ['name', 'namespace', 'type', 'clusterIP', 'ports', 'labels'];
  ingressColumns = ['name', 'namespace', 'hosts', 'paths', 'annotations'];

  constructor(private k8sService: KubernetesService) {}

  ngOnInit(): void {
    this.loadData();
    this.setupAutoRefresh();
    
    this.namespaceControl.valueChanges.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadData(): void {
    this.loading = true;
    const namespace = this.namespaceControl.value === 'all' ? undefined : this.namespaceControl.value || undefined;

    this.k8sService.getDeployments(namespace).subscribe({
      next: (response) => {
        this.deployments = response.success ? response.deployments : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching deployments:', err);
        this.loading = false;
      }
    });

    this.k8sService.getServices(namespace).subscribe({
      next: (response) => {
        this.services = response.success ? response.services : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching services:', err);
        this.loading = false;
      }
    });

    this.k8sService.getIngresses(namespace).subscribe({
      next: (response) => {
        this.ingresses = response.success ? response.ingresses : [];
        this.extractNamespaces();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching ingresses:', err);
        this.loading = false;
      }
    });
  }

  setupAutoRefresh(): void {
    this.stopAutoRefresh();
    
    if (this.autoRefreshEnabled) {
      this.refreshSubscription = timer(0, 30000).subscribe(() => {
        this.loadData();
      });
    }
  }

  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.setupAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  manualRefresh(): void {
    if (!this.loading) {
      this.loadData();
    }
  }

  extractNamespaces(): void {
    const allNamespaces = [
      ...new Set([
        ...this.deployments.map(d => d.namespace),
        ...this.services.map(s => s.namespace),
        ...this.ingresses.map(i => i.namespace)
      ])
    ];
    this.namespaces = ['all', ...allNamespaces];
  }

  formatLabels(labels: { [key: string]: string }): string {
    return labels ? Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(', ') : '';
  }

  formatPorts(ports: any[]): string {
    return ports ? ports.map(p => `${p.port}:${p.targetPort}/${p.protocol}`).join(', ') : '';
  }
}