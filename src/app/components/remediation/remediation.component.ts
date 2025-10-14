import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RemediationService, RemediationAction, RemediationPolicy, RemediationStats } from '../../services/remediation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-remediation',
  standalone: true,
  imports: [CommonModule, FormsModule], // ← ADD THESE IMPORTS!
  templateUrl: './remediation.component.html',
  styleUrls: ['./remediation.component.scss']
})
export class RemediationComponent implements OnInit, OnDestroy {
  // Data - Initialize with defaults to avoid null errors
  actions: RemediationAction[] = [];
  stats: RemediationStats = {
    totalActions: 0,
    successfulActions: 0,
    failedActions: 0,
    policyEnabled: false,
    trackedPods: 0
  };
  policy: RemediationPolicy = {
    enabled: true,
    autoRestartCrashingPods: true,
    maxRestartAttempts: 3,
    autoDeleteFailedPods: false,
    autoScaleOnHighCPU: false,
    cpuThresholdPercent: 80.0,
    notifyOnAction: true
  };
  
  // UI State
  loading = true;
  error: string | null = null;
  autoRefresh = true;
  selectedAction: RemediationAction | null = null;
  
  // Filters
  filterStatus: string = 'all';
  filterIssue: string = 'all';
  searchTerm: string = '';
  
  // Subscriptions
  private historySubscription?: Subscription;
  private statsSubscription?: Subscription;

  constructor(private remediationService: RemediationService) {}

  ngOnInit(): void {
    this.loadPolicy();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  /**
   * Load initial data
   */
  loadPolicy(): void {
    this.remediationService.getPolicy().subscribe({
      next: (response) => {
        if (response.success && response.policy) {
          this.policy = response.policy;
        }
      },
      error: (err) => console.error('Error loading policy:', err)
    });
  }

  /**
   * Start auto-refresh for history and stats
   */
  startAutoRefresh(): void {
    this.loading = true;

    // Auto-refresh history every 10 seconds
    this.historySubscription = this.remediationService.getHistoryLive(100).subscribe({
      next: (response) => {
        if (response.success) {
          this.actions = response.actions || [];
          this.loading = false;
          this.error = null;
        }
      },
      error: (err) => {
        this.error = 'Failed to load remediation history';
        this.loading = false;
        console.error('Error:', err);
      }
    });

    // Auto-refresh stats every 10 seconds
    this.statsSubscription = this.remediationService.getStatsLive().subscribe({
      next: (response) => {
        if (response.success && response.stats) {
          this.stats = response.stats;
        }
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    this.historySubscription?.unsubscribe();
    this.statsSubscription?.unsubscribe();
  }

  /**
   * Toggle auto-refresh
   */
  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  /**
   * Manually refresh data
   */
  refresh(): void {
    this.loading = true;
    this.remediationService.getHistory(100).subscribe({
      next: (response) => {
        if (response.success) {
          this.actions = response.actions || [];
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to refresh';
        this.loading = false;
      }
    });
  }

  /**
   * Trigger manual scan
   */
  triggerScan(): void {
    this.remediationService.triggerScan().subscribe({
      next: (response) => {
        if (response.success) {
          alert('✅ Manual scan triggered successfully!');
          setTimeout(() => this.refresh(), 2000);
        }
      },
      error: (err) => alert('❌ Failed to trigger scan: ' + err.message)
    });
  }

  /**
   * Toggle auto-remediation on/off
   */
  toggleRemediation(): void {
    const newState = !this.policy.enabled;
    this.remediationService.toggleRemediation(newState).subscribe({
      next: (response) => {
        if (response.success) {
          this.policy.enabled = newState;
          alert(newState ? '✅ Auto-remediation enabled' : '⏸️ Auto-remediation disabled');
        }
      },
      error: (err) => alert('❌ Failed to toggle: ' + err.message)
    });
  }

  /**
   * Update policy
   */
  savePolicy(): void {
    this.remediationService.updatePolicy(this.policy).subscribe({
      next: (response) => {
        if (response.success) {
          alert('✅ Policy updated successfully!');
        }
      },
      error: (err) => alert('❌ Failed to update policy: ' + err.message)
    });
  }

  /**
   * View action details
   */
  viewDetails(action: RemediationAction): void {
    this.selectedAction = action;
  }

  closeDetails(): void {
    this.selectedAction = null;
  }

  /**
   * Get filtered and searched actions
   */
  get filteredActions(): RemediationAction[] {
    let filtered = this.actions;

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === this.filterStatus);
    }

    // Filter by issue type
    if (this.filterIssue !== 'all') {
      filtered = filtered.filter(a => a.issue === this.filterIssue);
    }

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.podName.toLowerCase().includes(term) ||
        a.namespace.toLowerCase().includes(term) ||
        a.issue.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  /**
   * Get unique issue types for filter dropdown
   */
  get issueTypes(): string[] {
    const types = new Set(this.actions.map(a => a.issue));
    return Array.from(types);
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      case 'SKIPPED': return 'badge-warning';
      case 'IN_PROGRESS': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  /**
   * Get issue badge class
   */
  getIssueClass(issue: string): string {
    switch (issue) {
      case 'CrashLoopBackOff': return 'badge-danger';
      case 'ImagePullBackOff': return 'badge-warning';
      case 'OOMKilled': return 'badge-danger';
      case 'HighRestartCount': return 'badge-warning';
      case 'Failed': return 'badge-secondary';
      case 'PendingTooLong': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  /**
   * Calculate success rate
   */
  get successRate(): number {
    if (this.stats.totalActions === 0) return 0;
    return Math.round((this.stats.successfulActions / this.stats.totalActions) * 100);
  }
}