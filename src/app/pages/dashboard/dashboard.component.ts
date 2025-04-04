import { Component, OnInit } from '@angular/core';
import { KubernetesService } from '../../services/kubernetes.service';
import { PodInfo, DeploymentInfo, PipelineStatus } from '../../models/kubernetes.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  pods: PodInfo[] = [];
  deployments: DeploymentInfo[] = [];
  pipelines: PipelineStatus[] = [];
  loading = {
    pods: true,
    deployments: true,
    pipelines: true
  };
  errors: any = {};

  constructor(private k8sService: KubernetesService) {}

  ngOnInit(): void {
    this.loadPods();
    this.loadDeployments();
    this.loadPipelines();
  }

  loadPods(): void {
    this.loading.pods = true;
    this.k8sService.getPods().subscribe({
      next: (response) => {
        if (response.success) {
          this.pods = response.data || [];
        } else {
          this.errors.pods = response.error;
        }
        this.loading.pods = false;
      },
      error: (err) => {
        this.errors.pods = err.message;
        this.loading.pods = false;
      }
    });
  }

  loadDeployments(): void {
    this.loading.deployments = true;
    this.k8sService.getDeployments().subscribe({
      next: (response) => {
        if (response.success) {
          this.deployments = response.data || [];
        } else {
          this.errors.deployments = response.error;
        }
        this.loading.deployments = false;
      },
      error: (err) => {
        this.errors.deployments = err.message;
        this.loading.deployments = false;
      }
    });
  }

  loadPipelines(): void {
    this.loading.pipelines = true;
    this.k8sService.getPipelineStatus().subscribe({
      next: (response) => {
        if (response.success) {
          this.pipelines = response.data || [];
        } else {
          this.errors.pipelines = response.error;
        }
        this.loading.pipelines = false;
      },
      error: (err) => {
        this.errors.pipelines = err.message;
        this.loading.pipelines = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Running': 'success',
      'Succeeded': 'success',
      'SUCCESS': 'success',
      'Pending': 'warning',
      'Waiting': 'warning',
      'RUNNING': 'info',
      'Failed': 'danger',
      'Terminated': 'danger',
      'FAILURE': 'danger',
      'ABORTED': 'secondary'
    };
    return statusMap[status] || 'secondary';
  }

  refreshAll(): void {
    this.loadPods();
    this.loadDeployments();
    this.loadPipelines();
  }
}