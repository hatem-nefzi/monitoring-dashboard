import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KubernetesService } from '../../services/kubernetes.service';
import { PodListComponent } from '../../components/pod-list/pod-list.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription, timer, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { PodInfo } from '../../models/kubernetes.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-test-route',
  standalone: true,
  imports: [
    CommonModule,
    PodListComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './test-route.component.html',
  styleUrls: ['./test-route.component.scss']
})
export class TestRouteComponent implements OnInit, OnDestroy {
  allPods: PodInfo[] = [];
  filteredPods: PodInfo[] = [];
  namespaces: string[] = ['all'];
  loading = false;
  autoRefreshEnabled = true;
  private refreshSubscription?: Subscription;

  // Status counts
  runningPodsCount = 0;
  pendingPodsCount = 0;
  failedPodsCount = 0;

  namespaceControl = new FormControl('all');

  constructor(private k8sService: KubernetesService) {}

  ngOnInit(): void {
    this.loadData();
    this.setupAutoRefresh();
    
    this.namespaceControl.valueChanges.subscribe(() => {
      this.filterPods();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadData(): void {
    this.loading = true;
    this.k8sService.getPods().subscribe({
      next: (response) => {
        console.log('Fetched Pods:', response.pods);
  
        this.allPods = Array.isArray(response.pods) ? response.pods : [];
        this.extractNamespaces();
        this.filterPods();
        this.calculateStatusCounts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching pods:', err);
        this.loading = false;
      }
    });
  }
  

  setupAutoRefresh(): void {
    this.stopAutoRefresh();
    
    if (this.autoRefreshEnabled) {
      this.refreshSubscription = timer(0, 30000).pipe(
        switchMap(() => {
          this.loading = true;
          return this.k8sService.getPods().pipe(
            catchError(err => {
              console.error('Refresh error:', err);
              return of({ success: false, pods: [] });
            })
          );
        })
      ).subscribe(response => {
        this.allPods = response.pods || [];
        this.filterPods();
        this.calculateStatusCounts();
        this.loading = false;
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
    const uniqueNamespaces = [...new Set(this.allPods.map(pod => pod.namespace))];
    this.namespaces = ['all', ...uniqueNamespaces];
  }

  filterPods(): void {
    const selectedNamespace = this.namespaceControl.value;
    console.log('Selected Namespace:', selectedNamespace);
  
    if (selectedNamespace === 'all') {
      this.filteredPods = Array.isArray(this.allPods) ? [...this.allPods] : [];
    } else {
      this.filteredPods = Array.isArray(this.allPods) 
        ? this.allPods.filter(pod => pod.namespace === selectedNamespace) 
        : [];
    }
  
    console.log('Filtered Pods:', this.filteredPods);
  }
  

  calculateStatusCounts(): void {
    this.runningPodsCount = this.allPods.filter(p => p.status === 'Running').length;
    this.pendingPodsCount = this.allPods.filter(p => p.status === 'Pending').length;
    this.failedPodsCount = this.allPods.filter(p => 
      ['Failed', 'Terminated', 'Unknown'].includes(p.status)).length;
  }
}