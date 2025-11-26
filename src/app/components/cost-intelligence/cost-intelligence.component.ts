// src/app/components/cost-intelligence/cost-intelligence.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval, takeUntil, switchMap, catchError, of } from 'rxjs';
import { 
  CostService, 
  CostIntelligenceData, 
  CostAnomaly, 
  CostForecast,
  CostAnalysis,
  SavingsData 
} from '../../services/cost/cost.service';

interface NamespaceOption {
  value: string;
  label: string;
}

interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

@Component({
  selector: 'app-cost-intelligence',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cost-intelligence.component.html',
  styleUrls: ['./cost-intelligence.component.css']
})
export class CostIntelligenceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State Management
  selectedNamespace: string = '';
  namespaces: NamespaceOption[] = [];
  loading = false;
  autoRefresh = false;
  refreshInterval = 60000; // 60 seconds
  lastUpdated: Date | null = null;

  // Data
  intelligenceData: CostIntelligenceData | null = null;
  clusterAnomalies: CostAnomaly[] = [];
  alerts: AlertMessage[] = [];

  // View Controls
  activeTab: 'overview' | 'forecast' | 'anomalies' | 'savings' = 'overview';
  showDemoControls = false;

  // Statistics
  stats = {
    healthScore: 0,
    criticalAnomalies: 0,
    totalAnomalies: 0,
    forecastTrend: 'STABLE' as 'INCREASING' | 'DECREASING' | 'STABLE',
    riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH'
  };

  constructor(private costService: CostService) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.loadNamespaces();
    this.loadClusterAnomalies();
  }

  private loadNamespaces(): void {
    this.costService.getClusterCostSummary().subscribe({
      next: (response) => {
        if (response.success) {
          this.namespaces = Object.keys(response.summary.costByNamespace)
            .filter(ns => !ns.startsWith('kube-'))
            .map(ns => ({ value: ns, label: ns }));
          
          if (this.namespaces.length > 0 && !this.selectedNamespace) {
            this.selectedNamespace = this.namespaces[0].value;
            this.loadIntelligenceData();
          }
        }
      },
      error: (err) => this.showAlert('error', 'Failed to load namespaces')
    });
  }

  loadIntelligenceData(): void {
    if (!this.selectedNamespace) return;

    this.loading = true;
    this.costService.getCostIntelligence(this.selectedNamespace)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.intelligenceData = response.intelligence;
            this.updateStats();
            this.lastUpdated = new Date();
            this.showAlert('success', 'Intelligence data loaded successfully');
          }
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.showAlert('error', `Failed to load intelligence: ${err.message}`);
        }
      });
  }

  loadClusterAnomalies(): void {
    this.costService.getAllAnomalies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.clusterAnomalies = response.anomalies;
          }
        },
        error: (err) => console.error('Failed to load cluster anomalies:', err)
      });
  }

  private updateStats(): void {
    if (!this.intelligenceData) return;

    const { forecast, anomalies, healthScore } = this.intelligenceData;
    
    this.stats.healthScore = healthScore;
    this.stats.totalAnomalies = anomalies.length;
    this.stats.criticalAnomalies = anomalies.filter(
      a => a.severity === 'CRITICAL' || a.severity === 'HIGH'
    ).length;
    this.stats.forecastTrend = forecast.trend;
    this.stats.riskLevel = forecast.riskLevel;
  }

  onNamespaceChange(): void {
    this.loadIntelligenceData();
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    
    if (this.autoRefresh) {
      interval(this.refreshInterval)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => {
            if (this.autoRefresh) {
              return this.costService.getCostIntelligence(this.selectedNamespace);
            }
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            if (response?.success) {
              this.intelligenceData = response.intelligence;
              this.updateStats();
              this.lastUpdated = new Date();
            }
          }
        });
      
      this.showAlert('info', 'Auto-refresh enabled');
    } else {
      this.showAlert('info', 'Auto-refresh disabled');
    }
  }

  refresh(): void {
    this.loadIntelligenceData();
    this.loadClusterAnomalies();
  }

  // Demo Controls
  simulateAnomaly(type: 'SPIKE' | 'DROP' | 'DRIFT'): void {
    if (!this.selectedNamespace) return;

    this.costService.simulateAnomaly(this.selectedNamespace, type)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showAlert('success', `${type} anomaly simulated`);
            setTimeout(() => this.loadIntelligenceData(), 1000);
          }
        },
        error: (err) => this.showAlert('error', 'Failed to simulate anomaly')
      });
  }

  createSnapshot(): void {
    if (!this.selectedNamespace) return;

    this.costService.createSnapshot(this.selectedNamespace)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showAlert('success', 'Snapshot created successfully');
            setTimeout(() => this.loadIntelligenceData(), 1000);
          }
        },
        error: (err) => this.showAlert('error', 'Failed to create snapshot')
      });
  }

  // Alert Management
  private showAlert(type: AlertMessage['type'], message: string): void {
    const alert: AlertMessage = {
      type,
      message,
      timestamp: Date.now()
    };
    
    this.alerts.unshift(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.dismissAlert(alert);
    }, 5000);
  }

  dismissAlert(alert: AlertMessage): void {
    const index = this.alerts.indexOf(alert);
    if (index > -1) {
      this.alerts.splice(index, 1);
    }
  }

  // Utility Methods
  getHealthScoreClass(score: number): string {
    if (score >= 80) return 'health-excellent';
    if (score >= 60) return 'health-good';
    if (score >= 40) return 'health-fair';
    return 'health-poor';
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity.toLowerCase()}`;
  }

  getRiskLevelClass(risk: string): string {
    return `risk-${risk.toLowerCase()}`;
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'INCREASING': return '📈';
      case 'DECREASING': return '📉';
      default: return '➡️';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatPercent(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString();
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}