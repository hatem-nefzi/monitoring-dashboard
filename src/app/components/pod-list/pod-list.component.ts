import { Component, Input } from '@angular/core';
import { PodInfo } from '../../models/kubernetes.model';

@Component({
  selector: 'app-pod-list',
  templateUrl: './pod-list.component.html',
  styleUrls: ['./pod-list.component.scss']
})
export class PodListComponent {
  @Input() pods: PodInfo[] = [];
  @Input() loading = false;
  displayedColumns: string[] = ['name', 'namespace', 'status', 'node', 'containers', 'metrics'];

  getStatusClass(status: string): string {
    return this.getStatusColor(status);
  }

  getStatusColor(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Running': 'success',
      'Succeeded': 'success',
      'Pending': 'warning',
      'Failed': 'danger',
      'Terminated': 'danger'
    };
    return statusMap[status] || 'secondary';
  }
}