export interface ContainerInfo {
  name: string;
  image: string;
  ready: boolean;
  restartCount: number;
  state: string;
}

export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  nodeName: string;
  nodeIP: string;
  containers: ContainerInfo[];
  metrics: {
    cpu?: string;
    memory?: string;
    error?: string;
  };
}

export interface DeploymentInfo {
  name: string;
  namespace: string;
  replicas: number;
  availableReplicas: number;
  labels: { [key: string]: string };
}

export interface PipelineStatus {
  pipelineName: string;
  status: string;
  lastRunTime: string;
  duration: string;
  triggeredBy: string;
  commitId: string;
  branch: string;
  buildUrl: string;
}

export interface KubernetesResponse<T> {
  pods: never[];
  success: boolean;
  data?: T;
  error?: string;
}


//added for ingress and services

export interface ServiceInfo {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  ports: ServicePort[];
  labels: { [key: string]: string };
  creationTimestamp?: string;
}

export interface ServicePort {
  name?: string;
  protocol: string;
  port: number;
  targetPort: number | string;
  nodePort?: number;
}

export interface IngressInfo {
  name: string;
  namespace: string;
  hosts: string[];
  paths: string[];
  annotations: { [key: string]: string };
  creationTimestamp?: string;
}