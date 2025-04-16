import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { KubernetesService } from '../../services/kubernetes.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pod-log-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './pod-log-dialog.component.html',
  styleUrls: ['./pod-log-dialog.component.scss']
})
export class PodLogDialogComponent implements OnInit {
  logs = '';
  loading = true;
  error = '';
  containerNames: string[] = [];
  selectedContainer: string;
  tailLines = 100;

  constructor(
    private kubernetesService: KubernetesService,
    public dialogRef: MatDialogRef<PodLogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      podName: string;
      namespace: string;
      containerName: string;
    }
  ) {
    this.selectedContainer = data.containerName;
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = '';
    
    this.kubernetesService.getPodLogs(
      this.data.podName,
      this.data.namespace,
      this.selectedContainer,
      this.tailLines
    ).subscribe({
      next: (logs) => {
        this.logs = logs;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load logs. Please try again.';
        this.loading = false;
        console.error('Error loading logs:', err);
      }
    });
  }

  onContainerChange(): void {
    this.loadLogs();
  }

  close(): void {
    this.dialogRef.close();
  }
}