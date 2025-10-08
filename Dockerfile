# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --output-path=/app/dist --configuration=production

# Stage 2: Serve
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Switch to root temporarily to remove files.
USER root
RUN rm /etc/nginx/conf.d/default.conf
USER nginx  # Switch back to non-root user

# Copy our files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/

EXPOSE 8080