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
                '''
        }
    }
    environment {
        
        DOCKER_IMAGE  = "hatemnefzi/monitoring-ui:latest"
    }
    stages {
        // Stages will go here
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
                container('maven') {
                    sh '''
                        docker buildx create --use
                        docker buildx build --pull --no-cache -t $DOCKER_IMAGE --load .
                        docker buildx prune -af
                    '''
                }
            }
        }
        stage('Docker Push') {
            steps {
                container('maven') {
                    withDockerRegistry([credentialsId: 'docker-hub-credentials', url: 'https://index.docker.io/v1/']) {
                        sh '''
                            echo "PATH: $PATH"
                            echo "Docker version:"
                            docker --version
                            echo "Docker images:"
                            docker images
                            echo "Pushing Docker image: $DOCKER_IMAGE"
                            docker push $DOCKER_IMAGE
                        '''
                    }
                }
            }
        }

        stage('Deploy') {
    steps {
        container('kubectl') {
            withCredentials([file(credentialsId: 'kubeconfig1', variable: 'KUBECONFIG_FILE')]) {
                sh '''
                    # Ensure KUBECONFIG file exists
                    if [ ! -f "$KUBECONFIG_FILE" ]; then
                        echo "ERROR: Kubeconfig file not found at $KUBECONFIG_FILE"
                        exit 1
                    fi

                    echo "Using KUBECONFIG at: $KUBECONFIG_FILE"

                    # Update deployment image
                    kubectl --kubeconfig=$KUBECONFIG_FILE \
                        set image deployment/monitoting-dashboard \
                        monitoting-ui=$DOCKER_IMAGE
                    
                    # Wait for rollout to complete
                    kubectl --kubeconfig=$KUBECONFIG_FILE \
                        rollout status deployment/monitoting-dashboard --timeout=300s
                    
                    # Verify pods are ready
                    kubectl --kubeconfig=$KUBECONFIG_FILE \
                        wait --for=condition=ready pod \
                        -l app=monitoting-dashboard --timeout=120s
                '''
            }
        }
    }
}
        }
        
        post {
        always {
            container('docker') {
            sh 'docker logout'
            }
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
        }
    }
