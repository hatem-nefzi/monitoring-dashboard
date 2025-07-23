import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import {
  PodInfo,
  DeploymentInfo,
  PipelineStatus,
  KubernetesResponse
} from '../models/kubernetes.model';

@Injectable({
  providedIn: 'root'
})
export class KubernetesService {
  // Changed from localhost:9090 to relative path
  // This will route through the ingress to your backend
  private apiUrl = '/api/kubernetes';

  constructor(private http: HttpClient) { }

  getPods(): Observable<KubernetesResponse<PodInfo[]>> {
    return this.http.get<KubernetesResponse<PodInfo[]>>(`${this.apiUrl}/pods`);
  }

  getPodNames(): Observable<KubernetesResponse<string[]>> {
    return this.http.get<KubernetesResponse<string[]>>(`${this.apiUrl}/pod-names`);
  }

  getPipelineStatus(): Observable<KubernetesResponse<PipelineStatus[]>> {
    return this.http.get<KubernetesResponse<PipelineStatus[]>>(`${this.apiUrl}/pipelines`);
  }

  getNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/namespaces`);
  }

  // Methods for getting logs and details
  getPodLogs(podName: string, namespace: string, containerName?: string, tailLines?: number): Observable<string> {
    let url = `${this.apiUrl}/namespaces/${namespace}/pods/${podName}/logs`;
    
    // Add query parameters if provided
    const params: any = {};
    if (containerName) {
      params.container = containerName;
    }
    if (tailLines) {
      params.tailLines = tailLines.toString();
    }
    
    return this.http.get(url, {
      params,
      responseType: 'text'
    });
  }

  getPodDetails(podName: string, namespace: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/namespaces/${namespace}/pods/${podName}`);
  }

  // Added for deployments and services and ingress
  getDeployments(namespace?: string): Observable<any> {
    let params = new HttpParams();
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.apiUrl}/deployments`, { params });
  }

  getServices(namespace?: string): Observable<any> {
    let params = new HttpParams();
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.apiUrl}/services`, { params });
  }

  getIngresses(namespace?: string): Observable<any> {
    let params = new HttpParams();
    if (namespace) {
      params = params.set('namespace', namespace);
    }
    return this.http.get(`${this.apiUrl}/ingresses`, { params });
  }
}