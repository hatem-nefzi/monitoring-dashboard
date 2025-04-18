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
                    # Force new deployment
                    kubectl --kubeconfig=$KUBECONFIG_FILE \
                    patch deployment monitoring-dashboard \
                    -p '{"spec":{"template":{"metadata":{"annotations":{"date":"'$(date +%s)'"}}}}'
                    
                    kubectl --kubeconfig=$KUBECONFIG_FILE \
                    rollout status deployment/monitoring-dashboard --timeout=300s
                '''
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
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
        }
    }
