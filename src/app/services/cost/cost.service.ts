// src/app/services/cost.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class CostService {
  private apiUrl = '/api/cost';

  constructor(private http: HttpClient) { }

  getNamespaceCostAnalysis(namespace: string): Observable<{ success: boolean; namespace: string; analysis: CostAnalysis }> {
    return this.http.get<any>(`${this.apiUrl}/analysis/${namespace}`);
  }

  getClusterCostSummary(): Observable<{ success: boolean; summary: ClusterCostSummary }> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
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
}