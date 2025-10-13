# Deployment Guide

This guide covers deployment strategies, environment setup, and maintenance procedures for TahitiSpeak across different environments.

## Table of Contents

- [Overview](#overview)
- [Environment Setup](#environment-setup)
- [Deployment Strategies](#deployment-strategies)
- [Platform-Specific Guides](#platform-specific-guides)
- [Database Deployment](#database-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Configuration](#security-configuration)
- [Performance Optimization](#performance-optimization)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Overview

TahitiSpeak supports multiple deployment strategies:

- **Vercel** (Recommended): Serverless deployment with automatic scaling
- **Docker**: Containerized deployment for any cloud provider
- **Traditional VPS**: Manual deployment on virtual private servers
- **Kubernetes**: Orchestrated deployment for enterprise environments

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │────│   (Express.js)  │────│   (PostgreSQL)  │
│   Vercel        │    │   Vercel        │    │   Supabase      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   External      │
                    │   Services      │
                    │   (OpenAI, etc) │
                    └─────────────────┘
```

## Environment Setup

### Environment Variables

Create environment files for each deployment environment:

#### Production (.env.production)
```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tahitispeak.com
NEXT_PUBLIC_API_URL=https://api.tahitispeak.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/tahitispeak_prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://tahitispeak.com

# External APIs
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tahitispeak.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id

# Security
CORS_ORIGIN=https://tahitispeak.com
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=3600000

# Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-west-2
AWS_S3_BUCKET=tahitispeak-assets
```

#### Staging (.env.staging)
```env
# Application
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.tahitispeak.com
NEXT_PUBLIC_API_URL=https://staging-api.tahitispeak.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/tahitispeak_staging
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-anon-key

# ... other staging-specific variables
```

### Security Considerations

- Use strong, unique secrets for each environment
- Rotate secrets regularly
- Store secrets in secure vaults (AWS Secrets Manager, etc.)
- Never commit secrets to version control
- Use environment-specific service accounts

## Deployment Strategies

### 1. Blue-Green Deployment

Deploy to a parallel environment and switch traffic:

```bash
# Deploy to green environment
npm run deploy:green

# Run health checks
npm run health-check:green

# Switch traffic to green
npm run switch-traffic:green

# Monitor for issues
npm run monitor:production

# Rollback if needed
npm run rollback:blue
```

### 2. Rolling Deployment

Gradually replace instances:

```bash
# Deploy with rolling strategy
kubectl set image deployment/tahitispeak-api api=tahitispeak:v2.0.0
kubectl rollout status deployment/tahitispeak-api

# Monitor rollout
kubectl get pods -w
```

### 3. Canary Deployment

Deploy to a subset of users:

```bash
# Deploy canary version (10% traffic)
npm run deploy:canary --traffic=10

# Monitor metrics
npm run monitor:canary

# Increase traffic gradually
npm run deploy:canary --traffic=50
npm run deploy:canary --traffic=100
```

## Platform-Specific Guides

### Vercel Deployment (Recommended)

#### Prerequisites
- Vercel account
- GitHub repository connected
- Environment variables configured

#### Deployment Steps

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Configure project:**
   ```bash
   vercel
   ```

4. **Set environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_APP_URL production
   vercel env add DATABASE_URL production
   # ... add all required variables
   ```

5. **Deploy:**
   ```bash
   # Deploy to preview
   vercel

   # Deploy to production
   vercel --prod
   ```

#### Vercel Configuration (vercel.json)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Multi-stage build
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tahitispeak
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Deployment Commands

```bash
# Build and deploy
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Scale services
docker-compose up -d --scale app=3

# Update application
docker-compose pull
docker-compose up -d
```

### Kubernetes Deployment

#### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tahitispeak-app
  labels:
    app: tahitispeak
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tahitispeak
  template:
    metadata:
      labels:
        app: tahitispeak
    spec:
      containers:
      - name: app
        image: tahitispeak:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: tahitispeak-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: tahitispeak-service
spec:
  selector:
    app: tahitispeak
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Database Deployment

### Supabase Setup

1. **Create Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note the URL and API keys

2. **Run migrations:**
   ```bash
   npx supabase db push
   ```

3. **Set up Row Level Security:**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
   ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own data" ON users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own data" ON users
     FOR UPDATE USING (auth.uid() = id);
   ```

### PostgreSQL Setup

1. **Create database:**
   ```sql
   CREATE DATABASE tahitispeak_production;
   CREATE USER tahitispeak_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE tahitispeak_production TO tahitispeak_user;
   ```

2. **Run migrations:**
   ```bash
   npm run migrate:production
   ```

3. **Seed initial data:**
   ```bash
   npm run seed:production
   ```

## Monitoring and Logging

### Health Checks

Create health check endpoints:

```typescript
// api/health.js
export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  };

  res.status(200).json(health);
}

// api/ready.js
export default async function handler(req, res) {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check external services
    await fetch(process.env.OPENAI_API_URL);
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      error: error.message 
    });
  }
}
```

### Logging Configuration

```typescript
// lib/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'tahitispeak',
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### Monitoring Setup

```bash
# Install monitoring tools
npm install @sentry/nextjs @sentry/node

# Configure Sentry
echo "SENTRY_DSN=your-sentry-dsn" >> .env.production
```

## Security Configuration

### SSL/TLS Setup

1. **Obtain SSL certificate:**
   ```bash
   # Using Let's Encrypt
   certbot certonly --webroot -w /var/www/html -d tahitispeak.com
   ```

2. **Configure Nginx:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name tahitispeak.com;

       ssl_certificate /etc/letsencrypt/live/tahitispeak.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/tahitispeak.com/privkey.pem;

       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
       ssl_prefer_server_ciphers off;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## Performance Optimization

### CDN Configuration

```javascript
// Configure CDN for static assets
const CDN_URL = process.env.CDN_URL || '';

module.exports = {
  assetPrefix: CDN_URL,
  images: {
    domains: ['cdn.tahitispeak.com'],
    loader: 'custom',
    loaderFile: './lib/imageLoader.js'
  }
};
```

### Caching Strategy

```typescript
// lib/cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  async get(key: string) {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, ttl = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async del(key: string) {
    await redis.del(key);
  }
};
```

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="tahitispeak_production"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/tahitispeak_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/tahitispeak_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/tahitispeak_$DATE.sql.gz s3://tahitispeak-backups/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "tahitispeak_*.sql.gz" -mtime +30 -delete
```

### Automated Backup Schedule

```yaml
# k8s-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump $DATABASE_URL | gzip > /backup/tahitispeak_$(date +%Y%m%d_%H%M%S).sql.gz
              aws s3 cp /backup/tahitispeak_*.sql.gz s3://tahitispeak-backups/
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: tahitispeak-secrets
                  key: database-url
          restartPolicy: OnFailure
```

## Troubleshooting

### Common Issues

1. **Application won't start:**
   ```bash
   # Check logs
   docker logs tahitispeak-app
   
   # Check environment variables
   printenv | grep TAHITI
   
   # Verify database connection
   npm run db:check
   ```

2. **High memory usage:**
   ```bash
   # Monitor memory
   docker stats tahitispeak-app
   
   # Check for memory leaks
   npm run profile:memory
   ```

3. **Slow response times:**
   ```bash
   # Check database performance
   npm run db:analyze
   
   # Monitor API endpoints
   npm run monitor:api
   ```

### Rollback Procedures

```bash
# Vercel rollback
vercel rollback

# Docker rollback
docker-compose down
docker-compose up -d --scale app=0
docker tag tahitispeak:previous tahitispeak:latest
docker-compose up -d

# Kubernetes rollback
kubectl rollout undo deployment/tahitispeak-app
kubectl rollout status deployment/tahitispeak-app
```

### Emergency Procedures

1. **Service outage:**
   - Enable maintenance mode
   - Investigate root cause
   - Implement fix or rollback
   - Communicate with users

2. **Data corruption:**
   - Stop write operations
   - Restore from backup
   - Verify data integrity
   - Resume operations

3. **Security incident:**
   - Isolate affected systems
   - Rotate compromised credentials
   - Patch vulnerabilities
   - Conduct security audit

## Support

For deployment support:
- **Documentation**: [docs.tahitispeak.com/deployment](https://docs.tahitispeak.com/deployment)
- **Email**: devops@tahitispeak.com
- **Discord**: [TahitiSpeak DevOps](https://discord.gg/tahitispeak-devops)
- **Emergency**: +1-555-TAHITI-1 (24/7 support)