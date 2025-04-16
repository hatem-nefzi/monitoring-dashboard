import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private apiUrl = 'http://localhost:9090/api/kubernetes';

  constructor(private http: HttpClient) { }

  getPods(): Observable<KubernetesResponse<PodInfo[]>> {
    return this.http.get<KubernetesResponse<PodInfo[]>>(`${this.apiUrl}/pods`);
  }

  getPodNames(): Observable<KubernetesResponse<string[]>> {
    return this.http.get<KubernetesResponse<string[]>>(`${this.apiUrl}/pod-names`);
  }

  getDeployments(): Observable<KubernetesResponse<DeploymentInfo[]>> {
    return this.http.get<KubernetesResponse<DeploymentInfo[]>>(`${this.apiUrl}/deployments`);
  }

  getPipelineStatus(): Observable<KubernetesResponse<PipelineStatus[]>> {
    return this.http.get<KubernetesResponse<PipelineStatus[]>>(`${this.apiUrl}/pipelines`);
  }
  // Add to your KubernetesService
getNamespaces(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/namespaces`);
  }

  //methods for getting logs and details
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
}