import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ClipboardModule } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-pod-inspect-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    ClipboardModule
  ],
  templateUrl: './pod-inspect-dialog.component.html',
  styleUrls: ['./pod-inspect-dialog.component.scss']
})
export class PodInspectDialogComponent implements OnInit {
  podDetails: any;
  loading = false;
  activeTab = 'summary';
  copied = false;

  constructor(
    public dialogRef: MatDialogRef<PodInspectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      podDetails: any;
      podName: string;
      namespace: string;
    }
  ) {
    this.podDetails = data.podDetails;
  }

  ngOnInit(): void {
    if (!this.podDetails) {
      this.loading = true;
    }
  }

  copyToClipboard(content: string): void {
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }

  getFormattedDetails(): string {
    return JSON.stringify(this.podDetails, null, 2);
  }

  close(): void {
    this.dialogRef.close();
  }
}