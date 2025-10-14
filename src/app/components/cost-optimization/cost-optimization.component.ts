// src/app/components/cost-optimization/cost-optimization.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CostService, ClusterCostSummary, CostAnalysis, CostRecommendation, ResourceCost } from '../../services/cost/cost.service';
import { KubernetesService } from '../../services/kubernetes.service';

@Component({
  selector: 'app-cost-optimization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cost-optimization.component.html',
  styleUrls: ['./cost-optimization.component.scss']
})
export class CostOptimizationComponent implements OnInit {
  // State
  loading = true;
  error: string | null = null;
  selectedView: 'overview' | 'namespace' = 'overview';
  selectedNamespace: string | null = null;
  
  // Data
  clusterSummary: ClusterCostSummary | null = null;
  namespaceAnalysis: CostAnalysis | null = null;
  namespaces: string[] = [];
  
  // Filters
  statusFilter: 'all' | 'efficient' | 'over-provisioned' | 'under-provisioned' = 'all';
  priorityFilter: 'all' | 'critical' | 'high' | 'medium' | 'low' = 'all';
  searchTerm = '';

  // Toast notification state
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private costService: CostService,
    private k8sService: KubernetesService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = null;

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
        this.loadNamespaceAnalysis(this.selectedNamespace);
      } else {
        // Load cluster summary for overview
        this.costService.getClusterCostSummary().subscribe({
          next: (response) => {
            if (response.success) {
              this.clusterSummary = response.summary;
            }
            this.loading = false;
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
    }
  }

  private loadNamespaceAnalysis(namespace: string): void {
    this.costService.getNamespaceCostAnalysis(namespace).subscribe({
      next: (response) => {
        if (response.success) {
          this.namespaceAnalysis = response.analysis;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load namespace analysis: ' + err.message;
        this.loading = false;
      }
    });
  }

  selectNamespace(namespace: string): void {
    this.selectedNamespace = namespace;
    this.selectedView = 'namespace';
    this.loading = true;

    this.loadNamespaceAnalysis(namespace);
  }

  backToOverview(): void {
    this.selectedView = 'overview';
    this.selectedNamespace = null;
    this.namespaceAnalysis = null;
  }

  // Getters for filtered data
  get filteredPodCosts(): ResourceCost[] {
    if (!this.namespaceAnalysis?.podCosts) return [];
    
    return this.namespaceAnalysis.podCosts.filter(pod => {
      const matchesStatus = this.statusFilter === 'all' || pod.status === this.statusFilter;
      const matchesSearch = !this.searchTerm || 
        pod.podName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pod.deploymentName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }

  get filteredRecommendations(): CostRecommendation[] {
    if (!this.namespaceAnalysis?.recommendations) return [];
    
    const filtered = this.namespaceAnalysis.recommendations.filter(rec => {
      const matchesPriority = this.priorityFilter === 'all' || rec.priority === this.priorityFilter;
      const matchesSearch = !this.searchTerm || 
        rec.podName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        rec.reason.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesPriority && matchesSearch;
    });

    // Debug logging
    if (filtered.length > 0) {
      console.log('📊 Sample recommendation:', filtered[0]);
    }
    
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

  formatCost(cost: number): string {
    return cost.toFixed(2);
  }

  formatPercent(value: number): string {
    return value.toFixed(1);
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

  /**
   * Extract deployment name from pod name
   * Pattern: deployment-name-replicaset-hash-pod-hash
   */
  private extractDeploymentName(podName: string): string {
    if (!podName) return 'unknown';
    
    // Remove pod hash (last segment after -)
    const parts = podName.split('-');
    if (parts.length < 3) return podName;
    
    // Remove last 2 segments (replicaset hash and pod hash)
    return parts.slice(0, -2).join('-');
  }

  /**
   * Extract resource value from formatted string
   * Example: "CPU: 0.010 cores (10m)" -> "10m"
   */
  private extractResourceValue(configString: string): string {
    // Try to extract value in parentheses first (e.g., "10m" or "256Mi")
    const match = configString.match(/\(([^)]+)\)/);
    if (match) {
      return match[1];
    }
    
    // Fallback: extract number and unit
    const valueMatch = configString.match(/(\d+\.?\d*)\s*(m|Mi|Gi|cores?|GB?)/i);
    if (valueMatch) {
      const value = parseFloat(valueMatch[1]);
      const unit = valueMatch[2].toLowerCase();
      
      // Convert to k8s format
      if (unit === 'cores' || unit === 'core') {
        return value < 1 ? `${Math.round(value * 1000)}m` : `${value}`;
      } else if (unit === 'gb' || unit === 'g') {
        return `${Math.round(value * 1024)}Mi`;
      }
      return `${value}${unit}`;
    }
    
    return '100m'; // Fallback
  }

  /**
   * Generate kubectl command for a recommendation
   */
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

  /**
   * Generate kubectl command for both CPU and memory (if applicable)
   */
  generateFullKubectlCommand(podName: string): string {
    if (!this.namespaceAnalysis) return '';
    
    const deployment = this.extractDeploymentName(podName);
    const namespace = this.selectedNamespace || 'default';
    
    // Find all recommendations for this pod
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

  /**
   * Generate YAML patch for a recommendation
   */
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

  /**
   * Generate full YAML for all recommendations for a pod
   */
  generateFullYaml(podName: string): string {
    if (!this.namespaceAnalysis) return '';
    
    const deployment = this.extractDeploymentName(podName);
    const namespace = this.selectedNamespace || 'default';
    
    // Find all recommendations for this pod
    const podRecs = this.namespaceAnalysis.recommendations.filter(r => r.podName === podName);
    
    if (podRecs.length === 0) return '';
    
    const resources: { [key: string]: string } = {};
    
    podRecs.forEach(rec => {
      const value = this.extractResourceValue(rec.recommendedConfig);
      if (rec.type.includes('cpu')) {
        resources['cpu'] = value;
      } else if (rec.type.includes('memory')) {
        resources['memory'] = value;
      }
    });
    
    const resourceLines = Object.entries(resources)
      .map(([key, value]) => `            ${key}: "${value}"`)
      .join('\n');
    
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
${resourceLines}`;
  }

  /**
   * Copy text to clipboard and show toast notification
   */
  async copyToClipboard(text: string, label: string = 'Command'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showToastNotification(`${label} copied to clipboard!`, 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      this.showToastNotification('Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Show toast notification
   */
  private showToastNotification(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  /**
   * Download text as file
   */
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

  /**
   * Generate bulk commands for all recommendations
   */
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

  /**
   * Calculate total savings from filtered recommendations
   */
  getTotalSavings(): number {
    if (!this.filteredRecommendations) return 0;
    
    const processedPods = new Set<string>();
    let total = 0;
    
    this.filteredRecommendations.forEach(rec => {
      if (!processedPods.has(rec.podName)) {
        // Sum all savings for this pod
        const podSavings = this.namespaceAnalysis?.recommendations
          .filter(r => r.podName === rec.podName)
          .reduce((sum, r) => sum + r.potentialSavings, 0) || 0;
        
        total += podSavings;
        processedPods.add(rec.podName);
      }
    });
    
    return total;
  }
}