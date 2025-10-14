import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith } from 'rxjs';

export interface RemediationAction {
  id: string;
  podName: string;
  namespace: string;
  issue: string;
  action: string;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  timestamp: string;
  reason: string;
  metadata?: { [key: string]: string };
  error?: string;
}

export interface RemediationPolicy {
  enabled: boolean;
  autoRestartCrashingPods: boolean;
  maxRestartAttempts: number;
  autoDeleteFailedPods: boolean;
  autoScaleOnHighCPU: boolean;
  cpuThresholdPercent: number;
  notifyOnAction: boolean;
}

export interface RemediationStats {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  policyEnabled: boolean;
  trackedPods: number;
}

@Injectable({
  providedIn: 'root'
})
export class RemediationService {
  private apiUrl = '/api/remediation';

  constructor(private http: HttpClient) {}

  /**
   * Get remediation history
   */
  getHistory(limit: number = 50): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/history?limit=${limit}`);
  }

  /**
   * Get remediation history with auto-refresh every 10 seconds
   */
  getHistoryLive(limit: number = 50): Observable<any> {
    return interval(10000).pipe(
      startWith(0),
      switchMap(() => this.getHistory(limit))
    );
  }

  /**
   * Get statistics
   */
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  /**
   * Get statistics with auto-refresh
   */
  getStatsLive(): Observable<any> {
    return interval(10000).pipe(
      startWith(0),
      switchMap(() => this.getStats())
    );
  }

  /**
   * Get current policy
   */
  getPolicy(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/policy`);
  }

  /**
   * Update policy
   */
  updatePolicy(policy: RemediationPolicy): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/policy`, policy);
  }

  /**
   * Toggle auto-remediation on/off
   */
  toggleRemediation(enabled: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/toggle?enabled=${enabled}`, {});
  }

  /**
   * Manually trigger a scan
   */
  triggerScan(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/trigger`, {});
  }

  /**
   * Health check
   */
  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`);
  }
}