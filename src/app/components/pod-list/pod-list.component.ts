import { Component, Input } from '@angular/core';
import { PodInfo } from '../../models/kubernetes.model';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PodLogDialogComponent } from '../pod-log-dialog/pod-log-dialog.component';
import { PodInspectDialogComponent } from '../pod-inspect-dialog/pod-inspect-dialog.component';
import { KubernetesService } from '../../services/kubernetes.service';
import { CpuFormatPipe } from './cpu-format.pipe';
import { MemoryFormatPipe } from './memory-format.pipe';

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
    MatTooltipModule,
    MatButtonModule,
    MatDialogModule,
    CpuFormatPipe,
    MemoryFormatPipe
  ],
  templateUrl: './pod-list.component.html',
  styleUrls: ['./pod-list.component.scss']
})
export class PodListComponent {
  @Input() pods: PodInfo[] = [];
  @Input() loading = false;
  displayedColumns: string[] = ['name', 'namespace', 'status', 'node', 'containers', 'metrics', 'actions'];

  constructor(
    private dialog: MatDialog,
    private kubernetesService: KubernetesService
  ) {}

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

  viewPodLogs(pod: PodInfo): void {
    if (pod.containers && pod.containers.length > 1) {
      this.selectContainerForLogs(pod);
    } else {
      const containerName = pod.containers?.length > 0 ? pod.containers[0].name : '';
      this.openLogDialog(pod.name, pod.namespace, containerName);
    }
  }

  private selectContainerForLogs(pod: PodInfo): void {
    // For now, just use the first container
    // You could implement a more sophisticated container selection dialog here
    const containerName = pod.containers[0].name;
    this.openLogDialog(pod.name, pod.namespace, containerName);
  }

  private openLogDialog(podName: string, namespace: string, containerName: string): void {
    this.dialog.open(PodLogDialogComponent, {
      width: '80%',
      height: '600px',
      data: {
        podName,
        namespace,
        containerName
      }
    });
  }

  inspectPod(pod: PodInfo): void {
    this.kubernetesService.getPodDetails(pod.name, pod.namespace).subscribe({
      next: (details) => {
        this.dialog.open(PodInspectDialogComponent, {
          width: '80%',
          height: '80%',
          data: {
            podDetails: details,
            podName: pod.name,
            namespace: pod.namespace
          }
        });
      },
      error: (err) => {
        console.error('Error fetching pod details:', err);
        // Fallback to showing basic pod info if details fetch fails
        this.dialog.open(PodInspectDialogComponent, {
          width: '80%',
          height: '80%',
          data: {
            podDetails: pod, // Use the basic pod info we already have
            podName: pod.name,
            namespace: pod.namespace
          }
        });
      }
    });
  }
}