// src/app/components/cost-optimization/cost-optimization.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CostService, ClusterCostSummary, CostAnalysis, CostRecommendation, ResourceCost, CostSnapshot, SavingsData } from '../../services/cost/cost.service';
import { KubernetesService } from '../../services/kubernetes.service';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-cost-optimization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cost-optimization.component.html',
  styleUrls: ['./cost-optimization.component.scss']
})
export class CostOptimizationComponent implements OnInit, AfterViewInit {
  @ViewChild('costChart') costChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('efficiencyChart') efficiencyChartCanvas?: ElementRef<HTMLCanvasElement>;
  Math = Math;
  

  // State
  loading = true;
  error: string | null = null;
  selectedView: 'overview' | 'namespace' | 'timeline' = 'overview';
  selectedNamespace: string | null = null;
  
  // Data
  clusterSummary: ClusterCostSummary | null = null;
  namespaceAnalysis: CostAnalysis | null = null;
  namespaces: string[] = [];
  
  // Timeline data
  costHistory: CostSnapshot[] = [];
  // for pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  hasNext = false;
  hasPrevious = false;
  loadingHistory = false;
  savingsData: SavingsData | null = null;
  timelineDays = 30;
  costChart: Chart | null = null;
  efficiencyChart: Chart | null = null;
  
  // Filters
  statusFilter: 'all' | 'efficient' | 'over-provisioned' | 'under-provisioned' = 'all';
  priorityFilter: 'all' | 'critical' | 'high' | 'medium' | 'low' = 'all';
  searchTerm = '';

  // Toast notification state
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';

  // Clipboard API availability
  private clipboardAvailable = false;

  constructor(
    private costService: CostService,
    private k8sService: KubernetesService
  ) {
    // Check if clipboard API is available
    this.clipboardAvailable = !!(navigator.clipboard && navigator.clipboard.writeText);
  }

  //for caching
  forceRefreshing = false;  // Track force refresh state

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Charts will be created when timeline data loads
  }

  async loadData(forceRefreshing: boolean=false): Promise<void> {
    this.loading = true;
    this.error = null;

    if (forceRefreshing) {
      this.forceRefreshing = true;
      this.showToastNotification('Force refreshing data...', 'success');
    }



    try {
      // Load namespaces
      this.k8sService.getNamespaces().subscribe({
        next: (ns) => {
          this.namespaces = ns.filter(n => !n.startsWith('kube-'));
        },
        error: (err) => console.error('Failed to load namespaces:', err)
      });

      // If we're in namespace view, reload that namespace
      if (this.selectedView === 'namespace' && this.selectedNamespace) {
        this.loadNamespaceAnalysis(this.selectedNamespace, forceRefreshing);// the bug that was causing each namespace to rewrite cache even with simple refresh 
      } else if (this.selectedView === 'timeline' && this.selectedNamespace) {
        this.loadTimelineData(this.selectedNamespace);
      } else {
        // Load cluster summary for overview
        this.costService.getClusterCostSummary(forceRefreshing).subscribe({
          next: (response) => {
            if (response.success) {
              this.clusterSummary = response.summary;
            if (forceRefreshing) {
                const msg = response.cached 
                  ? '⚠️ Warning: Still using cached data'  // Shouldn't happen
                  : `✅ Fresh data loaded (${response.responseTimeMs}ms)`;
                this.showToastNotification(msg, 'success');
              }
            }
            this.loading = false;
            this.forceRefreshing = false;
          },
          error: (err) => {
            this.error = 'Failed to load cost data: ' + err.message;
            this.loading = false;
          }
        });
      }
    } catch (err: any) {
      this.error = 'Failed to load cost data: ' + err.message;
      this.loading = false;
      this.forceRefreshing = false;
    }
  }

  private loadNamespaceAnalysis(namespace: string, forceRefresh: boolean = false): void {
  this.loading = true;
  
  this.costService.getNamespaceCostAnalysis(namespace, forceRefresh).subscribe({
    next: (response) => {
      if (response.success) {
        this.namespaceAnalysis = response.analysis;
        
        // ✅ FIX: Correct logic
        if (forceRefresh) {
          const msg = response.cached 
            ? '⚠️ Warning: Still using cached data'  // Shouldn't happen
            : `✅ Fresh data loaded (${response.responseTimeMs}ms)`;
          this.showToastNotification(msg, response.cached ? 'warning' : 'success');
        }
      }
      this.loading = false;
      this.forceRefreshing = false;
    },
    error: (err) => {
      this.error = 'Failed to load namespace analysis: ' + err.message;
      this.loading = false;
      this.forceRefreshing = false;
      this.showToastNotification('❌ Failed to refresh data', 'error');
    }
  });
}

  selectNamespace(namespace: string, forceRefreshing: boolean = false): void {
  this.selectedNamespace = namespace;
  this.selectedView = 'namespace';
  this.loading = true;
  this.loadNamespaceAnalysis(namespace, forceRefreshing);
}
  forceRefresh(): void {
    if (this.forceRefreshing) return; // Prevent double-click
    this.loadData(true);
  }
  
  refresh(): void {
  if (this.loading) return;
  this.loadData(false);  // Use cache
}


  viewTimeline(namespace: string): void {
    this.selectedNamespace = namespace;
    this.selectedView = 'timeline';
    this.loading = true;
    this.loadTimelineData(namespace);
  }

  loadTimelineData(namespace: string): void {
  this.loadingHistory = true;
  
  // Load paginated cost history
  this.costService.getCostHistoryPaginated(namespace, this.currentPage, this.pageSize, this.timelineDays).subscribe({
    next: (response) => {
      if (response.success) {
        this.costHistory = response.data || [];
        
        // Update pagination state
        const pagination = response.pagination;
        this.currentPage = pagination.currentPage;
        this.totalPages = pagination.totalPages;
        this.totalElements = pagination.totalElements;
        this.hasNext = pagination.hasNext;
        this.hasPrevious = pagination.hasPrevious;
        
        // Load savings data
        this.costService.getSavings(namespace).subscribe({
          next: (savingsResponse) => {
            if (savingsResponse.success) {
              this.savingsData = savingsResponse.savings;
            }
            
            // Load current analysis
            this.loadNamespaceAnalysis(namespace, false);
            
            // Create charts
            setTimeout(() => {
              this.createCharts();
              this.loading = false;
              this.loadingHistory = false;
            }, 200);
          },
          error: (err) => {
            console.error('Failed to load savings:', err);
            this.loading = false;
            this.loadingHistory = false;
          }
        });
      } else {
        this.loading = false;
        this.loadingHistory = false;
      }
    },
    error: (err) => {
      this.error = 'Failed to load timeline data: ' + err.message;
      this.loading = false;
      this.loadingHistory = false;
    }
  });
}

  createSnapshot(): void {
    if (!this.selectedNamespace) return;
    
    this.showToastNotification('Creating snapshot...', 'success');
    
    this.costService.createSnapshot(this.selectedNamespace).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToastNotification('Snapshot created successfully!', 'success');
          // Reload timeline data
          this.loadTimelineData(this.selectedNamespace!);
        }
      },
      error: (err) => {
        this.showToastNotification('Failed to create snapshot', 'error');
        console.error('Snapshot error:', err);
      }
    });
  }

  private createCharts(): void {
    if (!this.costHistory || this.costHistory.length === 0) {
      console.log('No history data to chart');
      return;
    }
    
    // Destroy existing charts
    if (this.costChart) {
      this.costChart.destroy();
      this.costChart = null;
    }
    if (this.efficiencyChart) {
      this.efficiencyChart.destroy();
      this.efficiencyChart = null;
    }

    // Sort and prepare data
    const sortedHistory = [...this.costHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Intelligently sample data for better performance with many points
    const sampledData = this.sampleDataPoints(sortedHistory, 25);
    
    // Format labels based on data density
    const labels = sampledData.map(s => this.formatChartLabel(s.timestamp, sortedHistory.length));

    // Cost Timeline Chart
    if (this.costChartCanvas && this.costChartCanvas.nativeElement) {
      const ctx = this.costChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.costChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Monthly Cost',
              data: sampledData.map(s => s.totalMonthlyCost),
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointRadius: 0,  // Hide points for cleaner look
              pointHoverRadius: 5,
              pointBackgroundColor: '#667eea',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointHoverBackgroundColor: '#667eea',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#667eea',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                  title: (items: any) => {
                    const idx = items[0].dataIndex;
                    return this.formatDateTime(sampledData[idx].timestamp);
                  },
                  label: (context: any) => {
                    const value = context.parsed.y;
                    return `Cost: ${value !== null ? value.toFixed(2) : 'N/A'}/month`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 10,
                  color: '#6b7280',
                  font: {
                    size: 11
                  }
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  color: '#6b7280',
                  font: {
                    size: 11
                  },
                  callback: (value: any) => '$' + Number(value).toFixed(0)
                }
              }
            }
          }
        });
      }
    }

    // Efficiency Timeline Chart
    if (this.efficiencyChartCanvas && this.efficiencyChartCanvas.nativeElement) {
      const ctx = this.efficiencyChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.efficiencyChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Efficiency Score',
              data: sampledData.map(s => s.efficiencyScore),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointRadius: sampledData.length > 30 ? 0 : 3,
              pointHoverRadius: 6,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointHoverBackgroundColor: '#10b981',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#10b981',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                  title: (items: any) => {
                    const idx = items[0].dataIndex;
                    return this.formatDateTime(sampledData[idx].timestamp);
                  },
                  label: (context: any) => {
                    const value = context.parsed.y;
                    return `Efficiency: ${value !== null ? value.toFixed(1) : 'N/A'}%`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 10,
                  color: '#6b7280',
                  font: {
                    size: 11
                  }
                }
              },
              y: {
                beginAtZero: true,
                max: 100,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  color: '#6b7280',
                  font: {
                    size: 11
                  },
                  stepSize: 20,
                  callback: (value: any) => value + '%'
                }
              }
            }
          }
        });
      }
    }
  }

  private sampleDataPoints(data: CostSnapshot[], maxPoints: number): CostSnapshot[] {
    if (data.length <= maxPoints) {
      return data;
    }

    // Always keep first and last points
    const sampled: CostSnapshot[] = [data[0]];
    const step = (data.length - 1) / (maxPoints - 1);
    
    for (let i = 1; i < maxPoints - 1; i++) {
      const index = Math.round(i * step);
      sampled.push(data[index]);
    }
    
    sampled.push(data[data.length - 1]);
    return sampled;
  }

  private formatChartLabel(timestamp: string, totalPoints: number): string {
    const date = new Date(timestamp);
    
    // For many points, use more compact format
    if (totalPoints > 30) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (totalPoints > 14) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
  }

  backToOverview(): void {
    this.selectedView = 'overview';
    this.selectedNamespace = null;
    this.namespaceAnalysis = null;
    this.costHistory = [];
    this.savingsData = null;
    
    // Destroy charts
    if (this.costChart) {
      this.costChart.destroy();
      this.costChart = null;
    }
    if (this.efficiencyChart) {
      this.efficiencyChart.destroy();
      this.efficiencyChart = null;
    }
    
    this.loadData();
  }

  // Getters for filtered data
  get filteredPodCosts(): ResourceCost[] {
    if (!this.namespaceAnalysis?.podCosts || !Array.isArray(this.namespaceAnalysis.podCosts)) {
      return [];
    }
    
    return this.namespaceAnalysis.podCosts.filter(pod => {
      const matchesStatus = this.statusFilter === 'all' || pod.status === this.statusFilter;
      const matchesSearch = !this.searchTerm || 
        pod.podName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pod.deploymentName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }

  get filteredRecommendations(): CostRecommendation[] {
    if (!this.namespaceAnalysis?.recommendations || !Array.isArray(this.namespaceAnalysis.recommendations)) {
      return [];
    }
    
    const filtered = this.namespaceAnalysis.recommendations.filter(rec => {
      const matchesPriority = this.priorityFilter === 'all' || rec.priority === this.priorityFilter;
      const matchesSearch = !this.searchTerm || 
        rec.podName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        rec.reason.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesPriority && matchesSearch;
    });
    
    return filtered;
  }

  get topNamespacesByCost(): Array<{namespace: string, cost: number}> {
    if (!this.clusterSummary?.costByNamespace) return [];
    
    return Object.entries(this.clusterSummary.costByNamespace)
      .map(([namespace, cost]) => ({ namespace, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  }

  // Utility methods
  getStatusLabel(status: string): string {
    switch (status) {
      case 'efficient': return 'Efficient ✓';
      case 'over-provisioned': return 'Over-provisioned';
      case 'under-provisioned': return 'Under-provisioned ⚠️';
      case 'mixed': return 'Mixed Resources ⚡';
      default: return status;
    }
  }

  getUnderProvisionedCount(): number {
    if (!this.clusterSummary) return 0;
    
    const total = this.clusterSummary.totalPods;
    const efficient = this.clusterSummary.efficientPods;
    const over = this.clusterSummary.overProvisionedPods;
    
    return Math.max(0, total - efficient - over);
  }

  getEfficiencyColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'efficient': return '#10b981';
      case 'over-provisioned': return '#f59e0b';
      case 'under-provisioned': return '#ef4444';
      case 'mixed': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📊';
      case 'low': return 'ℹ️';
      default: return '📌';
    }
  }

  formatCost(cost: number | undefined | null): string {
    if (cost === undefined || cost === null || isNaN(cost)) {
        return '0.00';
    }
    return cost.toFixed(2);
}

  formatPercent(value: number): string {
    return value.toFixed(1);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatResource(value: number, unit: 'cpu' | 'memory'): string {
    if (unit === 'cpu') {
      return value < 1 ? `${(value * 1000).toFixed(0)}m` : `${value.toFixed(2)} cores`;
    } else {
      return value < 1 ? `${(value * 1024).toFixed(0)}Mi` : `${value.toFixed(2)}Gi`;
    }
  }

  getUsagePercent(usage: number, request: number): number {
    return request > 0 ? (usage / request) * 100 : 0;
  }

  getUsageBarColor(usage: number, request: number): string {
    const percent = this.getUsagePercent(usage, request);
    
    if (percent > 85) {
      return '#ef4444';
    } else if (percent < 50) {
      return '#f59e0b';
    } else {
      return '#10b981';
    }
  }

  // ==================== KUBECTL COMMAND GENERATION ====================
  
  private extractDeploymentName(podName: string): string {
    if (!podName) return 'unknown';
    const parts = podName.split('-');
    if (parts.length < 3) return podName;
    return parts.slice(0, -2).join('-');
  }

  private extractResourceValue(configString: string): string {
    const match = configString.match(/\(([^)]+)\)/);
    if (match) {
      return match[1];
    }
    
    const valueMatch = configString.match(/(\d+\.?\d*)\s*(m|Mi|Gi|cores?|GB?)/i);
    if (valueMatch) {
      const value = parseFloat(valueMatch[1]);
      const unit = valueMatch[2].toLowerCase();
      
      if (unit === 'cores' || unit === 'core') {
        return value < 1 ? `${Math.round(value * 1000)}m` : `${value}`;
      } else if (unit === 'gb' || unit === 'g') {
        return `${Math.round(value * 1024)}Mi`;
      }
      return `${value}${unit}`;
    }
    
    return '100m';
  }

  generateKubectlCommand(rec: CostRecommendation): string {
    const deployment = this.extractDeploymentName(rec.podName);
    const namespace = this.selectedNamespace || 'default';
    const resourceValue = this.extractResourceValue(rec.recommendedConfig);
    
    let resourceType = 'cpu';
    if (rec.type.includes('memory')) {
      resourceType = 'memory';
    }
    
    return `kubectl set resources deployment ${deployment} -n ${namespace} --requests=${resourceType}=${resourceValue}`;
  }

  generateFullKubectlCommand(podName: string): string {
    if (!this.namespaceAnalysis) return '';
    
    const deployment = this.extractDeploymentName(podName);
    const namespace = this.selectedNamespace || 'default';
    const podRecs = this.namespaceAnalysis.recommendations.filter(r => r.podName === podName);
    
    if (podRecs.length === 0) return '';
    
    const resources: string[] = [];
    
    podRecs.forEach(rec => {
      const value = this.extractResourceValue(rec.recommendedConfig);
      if (rec.type.includes('cpu')) {
        resources.push(`cpu=${value}`);
      } else if (rec.type.includes('memory')) {
        resources.push(`memory=${value}`);
      }
    });
    
    if (resources.length === 0) return '';
    
    return `kubectl set resources deployment ${deployment} -n ${namespace} --requests=${resources.join(',')}`;
  }

  generateYamlPatch(rec: CostRecommendation): string {
    const deployment = this.extractDeploymentName(rec.podName);
    const namespace = this.selectedNamespace || 'default';
    const resourceValue = this.extractResourceValue(rec.recommendedConfig);
    
    let resourceType = 'cpu';
    if (rec.type.includes('memory')) {
      resourceType = 'memory';
    }
    
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${deployment}
  namespace: ${namespace}
spec:
  template:
    spec:
      containers:
      - name: ${deployment}
        resources:
          requests:
            ${resourceType}: "${resourceValue}"`;
  }

  async copyToClipboard(text: string, label: string = 'Command'): Promise<void> {
    try {
      if (this.clipboardAvailable) {
        await navigator.clipboard.writeText(text);
        this.showToastNotification(`${label} copied to clipboard!`, 'success');
      } else {
        // Fallback for insecure contexts..
        this.fallbackCopyToClipboard(text);
        this.showToastNotification(`${label} copied to clipboard!`, 'success');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      this.showToastNotification('Failed to copy to clipboard', 'error');
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
    } catch (err) {
      console.error('Fallback copy failed:', err);
      textArea.remove();
      throw err;
    }
  }

  private showToastNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  downloadAsFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.showToastNotification(`${filename} downloaded!`, 'success');
  }

  generateBulkCommands(): string {
    if (!this.namespaceAnalysis?.recommendations) return '';
    
    const commands: string[] = [];
    const processedPods = new Set<string>();
    
    this.filteredRecommendations.forEach(rec => {
      if (!processedPods.has(rec.podName)) {
        const cmd = this.generateFullKubectlCommand(rec.podName);
        if (cmd) {
          commands.push(cmd);
          processedPods.add(rec.podName);
        }
      }
    });
    
    return commands.join('\n\n');
  }

  getTotalSavings(): number {
    if (!this.filteredRecommendations || this.filteredRecommendations.length === 0) {
      return 0;
    }
    
    const processedPods = new Set<string>();
    let total = 0;
    
    this.filteredRecommendations.forEach(rec => {
      if (!processedPods.has(rec.podName)) {
        const podSavings = this.namespaceAnalysis?.recommendations
          .filter(r => r.podName === rec.podName)
          .reduce((sum, r) => sum + r.potentialSavings, 0) || 0;
        
        total += podSavings;
        processedPods.add(rec.podName);
      }
    });
    
    return total;
  }
  // for pagination
  nextPage(): void {
  if (this.hasNext && !this.loadingHistory) {
    this.currentPage++;
    this.loadTimelineData(this.selectedNamespace!);
  }
}

previousPage(): void {
  if (this.hasPrevious && !this.loadingHistory) {
    this.currentPage--;
    this.loadTimelineData(this.selectedNamespace!);
  }
}

goToPage(page: number): void {
  if (page >= 0 && page < this.totalPages && !this.loadingHistory) {
    this.currentPage = page;
    this.loadTimelineData(this.selectedNamespace!);
  }
}

getPageNumbers(): number[] {
  const maxVisible = 5;
  const pages: number[] = [];
  
  let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(this.totalPages - 1, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(0, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
}

onPageSizeChange(): void {
  this.currentPage = 0;
  this.loadTimelineData(this.selectedNamespace!);
}
}