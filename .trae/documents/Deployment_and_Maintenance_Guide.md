# Deployment and Maintenance Guide
## TahitiSpeak - Production Deployment and Long-term Maintenance

## 📋 Overview

This comprehensive guide covers the deployment, monitoring, and long-term maintenance of the TahitiSpeak French Tahitian Language Learning Platform. It ensures reliable production operations and sustainable platform growth.

## 🚀 Production Deployment

### Prerequisites

- [x] GitHub repository properly configured
- [x] Vercel account with team access
- [x] Supabase project set up
- [x] Domain name configured
- [x] SSL certificates ready
- [x] Environment variables documented
- [x] Database migrations tested

### Deployment Platforms

#### Primary: Vercel (Recommended)

**Advantages:**
- Seamless Next.js integration
- Automatic deployments from Git
- Global CDN and edge functions
- Built-in analytics and monitoring
- Zero-configuration SSL

**Setup Process:**

1. **Connect Repository to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables:**
   ```env
   # Production Environment Variables
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=https://tahitispeak.com
   NEXT_PUBLIC_ENVIRONMENT=production
   
   # AI Services
   GOOGLE_AI_API_KEY=your_google_ai_key
   FIREBASE_PROJECT_ID=your_firebase_project
   
   # Email Services
   SENDGRID_API_KEY=your_sendgrid_key
   RESEND_API_KEY=your_resend_key
   
   # Analytics
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   VERCEL_ANALYTICS_ID=your_vercel_analytics_id
   
   # Security
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://tahitispeak.com
   ```

3. **Configure Build Settings:**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm ci",
     "devCommand": "npm run dev",
     "framework": "nextjs"
   }
   ```

#### Alternative: Netlify

**Setup Process:**
1. Connect GitHub repository
2. Configure build settings:
   - Build command: `npm run build && npm run export`
   - Publish directory: `out`
3. Set environment variables
4. Configure redirects and headers

#### Self-Hosted: Docker

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  tahitispeak:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
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
      - tahitispeak
    restart: unless-stopped
```

### Database Setup

#### Supabase Production Configuration

1. **Database Migrations:**
   ```sql
   -- Run all migration files in order
   \i supabase/migrations/20241210_initial_schema.sql
   \i supabase/migrations/20241210_notification_system.sql
   \i supabase/migrations/20241210_analytics_system.sql
   \i supabase/migrations/20241210_offline_system.sql
   ```

2. **Row Level Security (RLS) Policies:**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
   
   -- Create comprehensive policies
   CREATE POLICY "Users can view own data" ON users
     FOR SELECT USING (auth.uid() = id);
   
   CREATE POLICY "Public courses are viewable" ON courses
     FOR SELECT USING (is_published = true);
   ```

3. **Database Optimization:**
   ```sql
   -- Create performance indexes
   CREATE INDEX CONCURRENTLY idx_user_progress_user_lesson 
     ON user_progress(user_id, lesson_id);
   
   CREATE INDEX CONCURRENTLY idx_notification_history_user_unread 
     ON notification_history(user_id, read_at) WHERE read_at IS NULL;
   
   -- Analyze tables for query optimization
   ANALYZE users;
   ANALYZE courses;
   ANALYZE lessons;
   ANALYZE user_progress;
   ```

### CDN and Performance

#### Cloudflare Configuration

1. **DNS Settings:**
   ```
   Type: A
   Name: @
   Content: 76.76.19.61 (Vercel IP)
   Proxy: Enabled
   
   Type: CNAME
   Name: www
   Content: tahitispeak.com
   Proxy: Enabled
   ```

2. **Performance Rules:**
   ```javascript
   // Cache static assets
   Cache Level: Standard
   Browser Cache TTL: 1 year
   Edge Cache TTL: 1 month
   
   // Compress content
   Compression: Gzip + Brotli
   Minification: HTML, CSS, JS
   ```

3. **Security Headers:**
   ```
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   Referrer-Policy: strict-origin-when-cross-origin
   Permissions-Policy: camera=(), microphone=(), geolocation=()
   ```

## 📊 Monitoring and Analytics

### Application Performance Monitoring

#### Vercel Analytics
```javascript
// pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

#### Google Analytics 4
```javascript
// lib/analytics.ts
import { GoogleAnalytics } from '@next/third-parties/google';

export function GA() {
  return <GoogleAnalytics gaId="G-XXXXXXXXXX" />;
}
```

#### Custom Analytics Dashboard
```typescript
// components/admin/AnalyticsDashboard.tsx
interface AnalyticsMetrics {
  activeUsers: number;
  lessonCompletions: number;
  averageSessionDuration: number;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>();
  
  useEffect(() => {
    fetchAnalytics().then(setMetrics);
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Active Users"
        value={metrics?.activeUsers}
        trend="+12%"
      />
      <MetricCard
        title="Lesson Completions"
        value={metrics?.lessonCompletions}
        trend="+8%"
      />
      {/* Additional metrics */}
    </div>
  );
}
```

### Error Tracking

#### Sentry Integration
```javascript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError') {
        return null;
      }
    }
    return event;
  },
});
```

#### Custom Error Boundary
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to monitoring service
    Sentry.captureException(error, { contexts: { errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### Health Checks

#### API Health Endpoint
```typescript
// pages/api/health.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    // Check external services
    const aiServiceHealth = await checkAIService();
    const emailServiceHealth = await checkEmailService();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        ai: aiServiceHealth ? 'healthy' : 'degraded',
        email: emailServiceHealth ? 'healthy' : 'degraded',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

#### Uptime Monitoring
```javascript
// scripts/uptime-monitor.js
const https = require('https');

function checkUptime() {
  const options = {
    hostname: 'tahitispeak.com',
    port: 443,
    path: '/api/health',
    method: 'GET',
    timeout: 10000,
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Service is healthy');
    } else {
      console.log(`❌ Service returned ${res.statusCode}`);
      // Send alert
    }
  });

  req.on('error', (error) => {
    console.log(`❌ Service is down: ${error.message}`);
    // Send alert
  });

  req.end();
}

// Check every 5 minutes
setInterval(checkUptime, 5 * 60 * 1000);
```

## 🔧 Maintenance Procedures

### Regular Maintenance Tasks

#### Daily Tasks
- [ ] Monitor error rates and performance metrics
- [ ] Check system health endpoints
- [ ] Review user feedback and support tickets
- [ ] Monitor database performance
- [ ] Check backup completion status

#### Weekly Tasks
- [ ] Review and update dependencies
- [ ] Analyze user engagement metrics
- [ ] Review and respond to community issues
- [ ] Update content and cultural materials
- [ ] Performance optimization review

#### Monthly Tasks
- [ ] Security audit and vulnerability assessment
- [ ] Database maintenance and optimization
- [ ] Backup and disaster recovery testing
- [ ] User feedback analysis and feature planning
- [ ] Infrastructure cost optimization

### Automated Maintenance

#### Dependency Updates
```yaml
# .github/workflows/dependency-updates.yml
name: Dependency Updates

on:
  schedule:
    - cron: '0 2 * * 1' # Every Monday at 2 AM

jobs:
  update-dependencies:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Update dependencies
      run: |
        npm update
        npm audit fix
        
    - name: Run tests
      run: npm test
      
    - name: Create PR
      uses: peter-evans/create-pull-request@v5
      with:
        title: 'chore: update dependencies'
        body: 'Automated dependency updates'
        branch: 'chore/dependency-updates'
```

#### Database Maintenance
```sql
-- Weekly database maintenance script
-- Vacuum and analyze tables
VACUUM ANALYZE users;
VACUUM ANALYZE courses;
VACUUM ANALYZE lessons;
VACUUM ANALYZE user_progress;

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;

-- Reindex if needed
REINDEX INDEX CONCURRENTLY idx_user_progress_user_lesson;
```

### Backup and Recovery

#### Automated Backups
```bash
#!/bin/bash
# backup-script.sh

# Database backup
pg_dump $DATABASE_URL > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Upload to cloud storage
aws s3 cp backup_*.sql s3://tahitispeak-backups/database/

# File storage backup
supabase storage download --recursive public uploads/
tar -czf "files_$(date +%Y%m%d_%H%M%S).tar.gz" uploads/
aws s3 cp files_*.tar.gz s3://tahitispeak-backups/files/

# Cleanup old backups (keep 30 days)
find . -name "backup_*.sql" -mtime +30 -delete
find . -name "files_*.tar.gz" -mtime +30 -delete
```

#### Disaster Recovery Plan

1. **Recovery Time Objective (RTO):** 4 hours
2. **Recovery Point Objective (RPO):** 1 hour

**Recovery Steps:**
1. Assess the scope of the incident
2. Activate incident response team
3. Restore from latest backup
4. Verify data integrity
5. Update DNS if needed
6. Communicate with users
7. Conduct post-incident review

### Security Maintenance

#### Security Scanning
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 3 * * *' # Daily at 3 AM

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        
    - name: Run npm audit
      run: npm audit --audit-level moderate
      
    - name: Check for secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
```

#### SSL Certificate Monitoring
```javascript
// scripts/ssl-monitor.js
const https = require('https');
const tls = require('tls');

function checkSSL(hostname) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(443, hostname, () => {
      const cert = socket.getPeerCertificate();
      const daysUntilExpiry = Math.floor(
        (new Date(cert.valid_to) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      socket.end();
      
      if (daysUntilExpiry < 30) {
        console.log(`⚠️ SSL certificate expires in ${daysUntilExpiry} days`);
        // Send alert
      } else {
        console.log(`✅ SSL certificate valid for ${daysUntilExpiry} days`);
      }
      
      resolve(daysUntilExpiry);
    });
    
    socket.on('error', reject);
  });
}

checkSSL('tahitispeak.com');
```

## 📈 Scaling Considerations

### Performance Optimization

#### Database Scaling
- Implement read replicas for heavy read workloads
- Use connection pooling (PgBouncer)
- Implement database sharding for user data
- Cache frequently accessed data with Redis

#### Application Scaling
- Implement horizontal scaling with load balancers
- Use edge functions for geographically distributed users
- Implement CDN for static assets
- Optimize bundle sizes and implement code splitting

#### Monitoring Scaling Metrics
```typescript
// lib/scaling-metrics.ts
interface ScalingMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  databaseConnections: number;
}

export async function collectScalingMetrics(): Promise<ScalingMetrics> {
  // Collect metrics from various sources
  const metrics = await Promise.all([
    getResponseTimeMetrics(),
    getThroughputMetrics(),
    getErrorRateMetrics(),
    getResourceUsageMetrics(),
  ]);
  
  return {
    responseTime: metrics[0],
    throughput: metrics[1],
    errorRate: metrics[2],
    cpuUsage: metrics[3].cpu,
    memoryUsage: metrics[3].memory,
    databaseConnections: await getDatabaseConnectionCount(),
  };
}
```

## 🎯 Success Metrics and KPIs

### Technical Metrics
- **Uptime:** > 99.9%
- **Response Time:** < 200ms (95th percentile)
- **Error Rate:** < 0.1%
- **Build Time:** < 5 minutes
- **Test Coverage:** > 85%

### Business Metrics
- **User Retention:** > 70% (7-day), > 40% (30-day)
- **Lesson Completion Rate:** > 60%
- **Daily Active Users:** Growth target
- **Customer Satisfaction:** > 4.5/5
- **Support Response Time:** < 2 hours

### Cultural Impact Metrics
- **Cultural Content Engagement:** Track story views and discussions
- **Community Participation:** Forum posts and language exchange sessions
- **Native Speaker Involvement:** Contributions and feedback
- **Language Preservation:** Content creation and sharing

## 📞 Support and Escalation

### Support Tiers

#### Tier 1: Community Support
- GitHub Issues and Discussions
- Community forum moderation
- Documentation and FAQ updates

#### Tier 2: Technical Support
- Bug investigation and fixes
- Performance optimization
- Feature development

#### Tier 3: Critical Issues
- Security incidents
- Data loss or corruption
- Service outages

### Escalation Procedures

1. **Incident Detection:** Automated monitoring or user reports
2. **Initial Assessment:** Determine severity and impact
3. **Team Notification:** Alert appropriate team members
4. **Investigation:** Identify root cause
5. **Resolution:** Implement fix and verify
6. **Communication:** Update users and stakeholders
7. **Post-Mortem:** Document lessons learned

### Contact Information

- **Emergency:** emergency@tahitispeak.com
- **Technical Support:** support@tahitispeak.com
- **Security Issues:** security@tahitispeak.com
- **Community:** community@tahitispeak.com

This comprehensive deployment and maintenance guide ensures the TahitiSpeak platform operates reliably in production while maintaining high performance, security, and user satisfaction standards.