pipeline {
    agent {
        kubernetes {
            label 'jenkins-agent'
            yaml '''
                apiVersion: v1
                kind: Pod
                spec:
                  containers:
                  - name: node
                    image: node:18-alpine
                    command: ["cat"]
                    tty: true
                  - name: docker
                    image: docker:dind
                    securityContext:
                      privileged: true
                  - name: kubectl
                    image: bitnami/kubectl:latest
                    command: ["cat"]
                    tty: true
                '''
        }
    }
    environment {
        // Use build number for unique image tags
        DOCKER_IMAGE = "hatemnefzi/monitoring-ui:${env.BUILD_NUMBER}"
        KUBE_DEPLOYMENT = "monitoring-dashboard"
    }
    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    extensions: [],
                    userRemoteConfigs: [[
                        url: 'git@github.com:hatem-nefzi/monitoring-dashboard.git',
                        credentialsId: 'SSH'
                    ]]
                ])
            }
        }
        
        stage('Install Dependencies') {
            steps {
                container('node') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Build') {
            steps {
                container('node') {
                    sh 'npm run build -- --output-path=./dist --configuration=production'
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                container('docker') {
                    script {
                        // Create builder instance
                        sh 'docker buildx create --use --name jenkins-builder'
                        // Build with cache
                        sh """
                            docker buildx build \
                            --platform linux/amd64 \
                            -t ${DOCKER_IMAGE} \
                            --load .
                        """
                        // Cleanup
                        sh 'docker buildx rm jenkins-builder'
                    }
                }
            }
        }
        
        stage('Docker Push') {
            steps {
                container('docker') {
                    withDockerRegistry([credentialsId: 'docker-hub-credentials', url: 'https://index.docker.io/v1/']) {
                        sh """
                            docker push ${DOCKER_IMAGE}
                        """
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                container('kubectl') {
                    withCredentials([file(credentialsId: 'kubeconfig1', variable: 'KUBECONFIG_FILE')]) {
                        script {
                            // Update deployment with new image
                            sh """
                                kubectl --kubeconfig=${KUBE_CONFIG_FILE} \
                                    set image deployment/${KUBE_DEPLOYMENT} \
                                    monitoring-dashboard=${DOCKER_IMAGE} \
                                    --record
                                
                                # Wait for rollout
                                kubectl --kubeconfig=${KUBE_CONFIG_FILE} \
                                    rollout status deployment/${KUBE_DEPLOYMENT} \
                                    --timeout=300s
                                
                                # Verify pods
                                kubectl --kubeconfig=${KUBE_CONFIG_FILE} \
                                    get pods -l app=${KUBE_DEPLOYMENT}
                            """
                        }
                    }
                }
            }
        }
    }
    post {
        always {
            cleanWs()
        }
        success {
            echo "Successfully deployed ${DOCKER_IMAGE}"
        }
        failure {
            echo "Pipeline failed - check logs for details"
        }
    }
}