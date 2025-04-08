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
    }
}