import { Component, Input } from '@angular/core';
import { PodInfo } from '../../models/kubernetes.model';
//
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-pod-list',
    standalone: true,
    imports: [
      CommonModule,
      MatCardModule,
      MatTableModule,
      MatChipsModule,
      MatProgressSpinnerModule,
      MatIconModule,
      MatTooltipModule
    ],
    templateUrl: './pod-list.component.html',
    styleUrls: ['./pod-list.component.scss']
  })
export class PodListComponent {
  @Input() pods: PodInfo[] = [];
  @Input() loading = false;
  displayedColumns: string[] = ['name', 'namespace', 'status', 'node', 'containers', 'metrics','actions'];

  getStatusClass(status: string): string {
    return this.getStatusColor(status);
  }

  // Add these methods to your PodListComponent class
getStatusColor(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Running': 'primary',
      'Succeeded': 'accent',
      'Pending': 'warn',
      'Failed': 'warn',
      'Terminated': 'warn',
      'Unknown': ''
    };
    return statusMap[status] || '';
  }
  
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'Running': 'check_circle',
      'Succeeded': 'done_all',
      'Pending': 'schedule',
      'Failed': 'error',
      'Terminated': 'stop_circle',
      'Unknown': 'help'
    };
    return iconMap[status] || 'help';
  }
}