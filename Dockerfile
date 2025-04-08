# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --output-path=/app/dist --configuration=production

# Stage 2: Serve
FROM nginxinc/nginx-unprivileged:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/

EXPOSE 8080