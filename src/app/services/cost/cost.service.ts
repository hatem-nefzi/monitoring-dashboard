// src/app/services/cost.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap } from 'rxjs';

export interface ResourceCost {
  podName: string;
  deploymentName: string;
  cpuRequest: number;
  cpuUsage: number;
  memoryRequest: number;
  memoryUsage: number;
  hourlyCost: number;
  monthlyCost: number;
  wastedCost: number;
  status: 'efficient' | 'over-provisioned' | 'under-provisioned';
}

export interface CostRecommendation {
  podName: string;
  type: string;
  currentConfig: string;
  recommendedConfig: string;
  potentialSavings: number;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface CostAnalysis {
  namespace: string;
  totalPods: number;
  hourlyCost: number;
  monthlyCost: number;
  totalCpuCores: number;
  totalMemoryGb: number;
  efficiencyScore: number;
  podCosts: ResourceCost[];
  recommendations: CostRecommendation[];
}

export interface ClusterCostSummary {
  totalMonthlyCost: number;
  totalWastedCost: number;
  potentialSavings: number;
  totalPods: number;
  efficientPods: number;
  overProvisionedPods: number;
  averageEfficiencyScore: number;
  costByNamespace: { [key: string]: number };
  mostExpensiveNamespace: string;
  leastEfficientNamespace: string;
}

export interface CostConfig {
  cpuCostPerHour: number;
  memoryCostPerHourPerGb: number;
  storageCostPerMonthPerGb: number;
  currency: string;
  note: string;
}

export interface CostSnapshot {
  id: string;
  namespace: string;
  timestamp: string;
  totalMonthlyCost: number;
  hourlyCost: number;
  efficiencyScore: number;
  totalPods: number;
  efficientPods: number;
  overProvisionedPods: number;
  underProvisionedPods: number;
  totalCpuCores: number;
  totalMemoryGb: number;
  wastedCost: number;
  potentialSavings: number;
}

export interface SavingsData {
  hasData: boolean;
  baselineCost?: number;
  currentCost?: number;
  savedMonthly?: number;
  savedAnnually?: number;
  percentReduction?: number;
  baselineTimestamp?: string;
  currentTimestamp?: string;
  baselineEfficiency?: number;
  currentEfficiency?: number;
  efficiencyImprovement?: number;
  daysTracked?: number;
  message?: string;
}

export interface CostForecast {
  namespace: string;
  currentMonthlyCost: number;
  predictedMonthlyCost: number;
  predictedWeeklyCost: number;
  daysAhead: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  confidence: number;
  changePercent: number;
  snapshotsUsed: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

export interface CostAnomaly {
  namespace: string;
  timestamp: string;
  type: 'SPIKE' | 'DROP' | 'DRIFT' | 'UNUSUAL_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentValue: number;
  expectedValue: number;
  deviation: number;
  description: string;
  recommendation: string;
  confidence: number;
}

export interface CostIntelligenceData {
  currentAnalysis: CostAnalysis;
  forecast: CostForecast;
  anomalies: CostAnomaly[];
  savings: SavingsData;
  healthScore: number;
}

export interface TrendData {
  direction: 'UP' | 'DOWN' | 'STABLE';
  percentChange: number;
  avgCost: number;
  projectedNextMonth: number;
  volatility: number;
}


@Injectable({
  providedIn: 'root'
})
export class CostService {
  private apiUrl = '/api/cost';

  constructor(private http: HttpClient) { }

  // ===== UPDATED: Add refresh parameter =====
  getNamespaceCostAnalysis(namespace: string, refresh: boolean = false): Observable<{ success: boolean; namespace: string; analysis: CostAnalysis; cached?: boolean; responseTimeMs?: number }> {
    const url = `${this.apiUrl}/analysis/${namespace}${refresh ? '?refreshCache=true' : ''}`;
    return this.http.get<any>(url);
}

  // ===== UPDATED: Add refresh parameter =====.
  getClusterCostSummary(refresh: boolean = false): Observable<{ success: boolean; summary: ClusterCostSummary; cached?: boolean; responseTimeMs?: number }> {
    const url = `${this.apiUrl}/summary${refresh ? '?refreshCache=true' : ''}`;
    return this.http.get<any>(url);
  }

  getRecommendations(namespace?: string): Observable<any> {
    const url = namespace 
      ? `${this.apiUrl}/recommendations?namespace=${namespace}`
      : `${this.apiUrl}/recommendations`;
    return this.http.get<any>(url);
  }

  getCostConfig(): Observable<{ success: boolean; config: CostConfig }> {
    return this.http.get<any>(`${this.apiUrl}/config`);
  }

  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`);
  }

  // ===== Cost History Endpoints =====

  getCostHistory(namespace: string, days: number = 30): Observable<{ success: boolean; history: CostSnapshot[] }> {
    return this.http.get<any>(`${this.apiUrl}/history/${namespace}?days=${days}`);
  }

  getSavings(namespace: string): Observable<{ success: boolean; savings: SavingsData }> {
    return this.http.get<any>(`${this.apiUrl}/savings/${namespace}`);
  }

  getCostTrend(namespace: string, days: number = 30): Observable<{ success: boolean; trend: any }> {
    return this.http.get<any>(`${this.apiUrl}/trend/${namespace}?days=${days}`);
  }

  createSnapshot(namespace: string): Observable<{ success: boolean; snapshot: CostSnapshot }> {
    return this.http.post<any>(`${this.apiUrl}/snapshot/${namespace}`, {}).pipe(
      tap(response => {
        console.log(' Snapshot API Response:', response);
      }),
      catchError(error => {
        console.error(' Snapshot API Error:', error);
        throw error;
      })
    );
  }

  getClusterCostHistory(days: number = 30): Observable<{ success: boolean; history: any }> {
    return this.http.get<any>(`${this.apiUrl}/history/cluster?days=${days}`);
  }

  // ===== NEW: Cache Management Endpoints =====
  
  /**
   * Manually clear cache for a specific namespace
   */
  invalidateNamespaceCache(namespace: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/cache/invalidate/${namespace}`, {});
  }

  /**
   * Clear all caches (cluster-wide)
   */
  clearAllCaches(): Observable<{ success: boolean; message: string; namespacesCleared?: number }> {
    return this.http.post<any>(`${this.apiUrl}/cache/clear`, {});
  }

  // cost forecast method
  getCostForecast(namespace: string ,days: number = 30): Observable<{ success: boolean ; forecast: CostForecast  }> {
    return this.http.get<any>(`${this.apiUrl}/forecast/${namespace}?days=${days}`);
  }

  getClusterCostForecast(days: number = 30): Observable<{ success: boolean; forecasts: any; summary: any }> {
  return this.http.get<any>(`${this.apiUrl}/forecast/cluster?days=${days}`);
}

// Anomaly Detection
getNamespaceAnomalies(namespace: string): Observable<{ success: boolean; anomalies: CostAnomaly[]; count: number }> {
  return this.http.get<any>(`${this.apiUrl}/anomalies/${namespace}`);
}

getAllAnomalies(): Observable<{ success: boolean; anomalies: CostAnomaly[]; totalCount: number; criticalCount: number }> {
  return this.http.get<any>(`${this.apiUrl}/anomalies`);
}

simulateAnomaly(namespace: string, type: string = 'SPIKE'): Observable<{ success: boolean; anomaly: CostAnomaly }> {
  return this.http.post<any>(`${this.apiUrl}/anomalies/simulate?namespace=${namespace}&type=${type}`, {});
}

// Cost Intelligence Dashboard
getCostIntelligence(namespace: string): Observable<{ success: boolean; intelligence: CostIntelligenceData }> {
  return this.http.get<any>(`${this.apiUrl}/intelligence/${namespace}`);
} 

}