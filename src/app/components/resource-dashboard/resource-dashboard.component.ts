// src/components/resource-dashboard/resource-dashboard.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { KubernetesService } from '../../services/kubernetes.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription, timer, of } from 'rxjs';
import { switchMap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DeploymentInfo, ServiceInfo, IngressInfo } from '../../models/kubernetes.model';

// Enhanced interfaces for better type safety
interface EnhancedDeploymentInfo extends DeploymentInfo {
  healthStatus: 'healthy' | 'warning' | 'critical';
  healthPercentage: number;
  age?: string;
}

interface EnhancedServiceInfo extends ServiceInfo {
  age?: string;
}

interface EnhancedIngressInfo extends IngressInfo {
  age?: string;
}

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
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './resource-dashboard.component.html',
  styleUrls: ['./resource-dashboard.component.scss']
})
export class ResourceDashboardComponent implements OnInit, OnDestroy {
  deployments: EnhancedDeploymentInfo[] = [];
  services: EnhancedServiceInfo[] = [];
  ingresses: EnhancedIngressInfo[] = [];
  
  // Filtered data for display
  filteredDeployments: EnhancedDeploymentInfo[] = [];
  filteredServices: EnhancedServiceInfo[] = [];
  filteredIngresses: EnhancedIngressInfo[] = [];
  
  namespaces: string[] = ['all'];
  loading = false;
  autoRefreshEnabled = true;
  private refreshSubscription?: Subscription;
  private searchSubscription?: Subscription;

  namespaceControl = new FormControl('all');
  searchControl = new FormControl('');
  selectedTab = new FormControl(0);

  // Table columns - now with status and age
  deploymentColumns = ['status', 'name', 'namespace', 'replicas', 'available', 'age', 'labels'];
  serviceColumns = ['name', 'namespace', 'type', 'clusterIP', 'ports', 'age', 'labels'];
  ingressColumns = ['name', 'namespace', 'hosts', 'paths', 'age', 'annotations'];

  // Stats for dashboard header
  stats = {
    totalDeployments: 0,
    healthyDeployments: 0,
    totalServices: 0,
    totalIngresses: 0
  };

  constructor(private k8sService: KubernetesService) {}

  ngOnInit(): void {
    this.loadData();
    this.setupAutoRefresh();
    this.setupSearch();
    
    this.namespaceControl.valueChanges.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.searchSubscription?.unsubscribe();
  }

  setupSearch(): void {
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadData(): void {
  this.loading = true;
  const namespace = this.namespaceControl.value === 'all' ? undefined : this.namespaceControl.value || undefined;

  // Load all resources in parallel
  const deployments$ = this.k8sService.getDeployments(namespace);
  const services$ = this.k8sService.getServices(namespace);
  const ingresses$ = this.k8sService.getIngresses(namespace);

  // Deployments - Map the response to match expected format
  deployments$.subscribe({
    next: (response) => {
      console.log('Raw deployments response:', response);
      // The service returns the array directly, so we need to wrap it
      const deployments = Array.isArray(response) ? response : (response.deployments || response.data || []);
      console.log('Processed deployments array:', deployments);
      this.deployments = deployments.map((dep: DeploymentInfo) => this.enhanceDeployment(dep));
      this.applyFilters();
      this.updateStats();
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching deployments:', err);
      this.deployments = [];
      this.applyFilters();
      this.updateStats();
      this.loading = false;
    }
  });

  // Services - Map the response to match expected format
  services$.subscribe({
    next: (response) => {
      const services = Array.isArray(response) ? response : (response.services || response.data || []);
      this.services = services.map((svc: ServiceInfo) => this.enhanceService(svc));
      this.applyFilters();
    },
    error: (err) => {
      console.error('Error fetching services:', err);
      this.services = [];
      this.applyFilters();
    }
  });

  // Ingresses - Map the response to match expected format
  ingresses$.subscribe({
    next: (response) => {
      const ingresses = Array.isArray(response) ? response : (response.ingresses || response.data || []);
      this.ingresses = ingresses.map((ing: IngressInfo) => this.enhanceIngress(ing));
      this.applyFilters();
      this.extractNamespaces();
    },
    error: (err) => {
      console.error('Error fetching ingresses:', err);
      this.ingresses = [];
      this.applyFilters();
      this.extractNamespaces();
    }
  });
}

  enhanceDeployment(deployment: any): EnhancedDeploymentInfo {
  const available = deployment.availableReplicas || 0;
  const desired = deployment.replicas || 1;
  const healthPercentage = Math.round((available / desired) * 100);
  
  let healthStatus: 'healthy' | 'warning' | 'critical';
  if (healthPercentage === 100) {
    healthStatus = 'healthy';
  } else if (healthPercentage >= 50) {
    healthStatus = 'warning';
  } else {
    healthStatus = 'critical';
  }

  // Debug: log the actual deployment object to see what properties exist
  console.log('Deployment object received:', deployment);
  
  // Try different possible property names for creation timestamp
  const creationTimestamp = 
    deployment.creationTimestamp || 
    deployment.creationTime || 
    deployment.createdAt ||
    deployment.metadata?.creationTimestamp;

  console.log('Found creation timestamp:', creationTimestamp);

  return {
    ...deployment,
    healthStatus,
    healthPercentage,
    age: this.calculateAge(creationTimestamp)
  };
}

  enhanceService(service: ServiceInfo): EnhancedServiceInfo {
    return {
      ...service,
      age: this.calculateAge(service.creationTimestamp)
    };
  }

  enhanceIngress(ingress: IngressInfo): EnhancedIngressInfo {
    return {
      ...ingress,
      age: this.calculateAge(ingress.creationTimestamp)
    };
  }

  calculateAge(creationTimestamp?: string): string {
  if (!creationTimestamp) {
    return 'Unknown';
  }
  
  try {
    const created = new Date(creationTimestamp);
    
    // Check if the date is valid
    if (isNaN(created.getTime())) {
      return 'Unknown';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    
    // Handle future dates
    if (diffMs < 0) {
      return 'Just now';
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return 'Just now';
  } catch (error) {
    return 'Unknown';
  }
}

  applyFilters(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    
    this.filteredDeployments = this.deployments.filter(deployment => 
      this.matchesSearch(deployment, searchTerm)
    );
    
    this.filteredServices = this.services.filter(service => 
      this.matchesSearch(service, searchTerm)
    );
    
    this.filteredIngresses = this.ingresses.filter(ingress => 
      this.matchesSearch(ingress, searchTerm)
    );
  }

  private matchesSearch(resource: any, searchTerm: string): boolean {
    if (!searchTerm) return true;
    
    const searchableFields = [
      resource.name,
      resource.namespace,
      this.formatLabels(resource.labels),
      this.formatLabels(resource.annotations),
      resource.type,
      ...(resource.hosts || []),
      ...(resource.paths || [])
    ];
    
    return searchableFields.some(field => 
      field?.toString().toLowerCase().includes(searchTerm)
    );
  }

  updateStats(): void {
    this.stats = {
      totalDeployments: this.deployments.length,
      healthyDeployments: this.deployments.filter(d => d.healthStatus === 'healthy').length,
      totalServices: this.services.length,
      totalIngresses: this.ingresses.length
    };
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

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  extractNamespaces(): void {
    const allNamespaces = [
      ...new Set([
        ...this.deployments.map(d => d.namespace),
        ...this.services.map(s => s.namespace),
        ...this.ingresses.map(i => i.namespace)
      ])
    ];
    this.namespaces = ['all', ...allNamespaces.sort()];
  }

  formatLabels(labels: { [key: string]: string }): string {
    return labels ? Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(', ') : '';
  }

  formatPorts(ports: any[]): string {
    return ports ? ports.map(p => `${p.port}:${p.targetPort}/${p.protocol}`).join(', ') : '';
  }

  getHealthIcon(status: 'healthy' | 'warning' | 'critical'): string {
    switch (status) {
      case 'healthy': return 'check_circle';
      case 'warning': return 'warning';
      case 'critical': return 'error';
    }
  }

  getHealthColor(status: 'healthy' | 'warning' | 'critical'): string {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warn';
      case 'critical': return 'error';
    }
  }

  getHealthTooltip(deployment: EnhancedDeploymentInfo): string {
    return `${deployment.availableReplicas}/${deployment.replicas} replicas available (${deployment.healthPercentage}%)`;
  }
}