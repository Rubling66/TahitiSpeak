import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { emailQueueProcessor } from '../src/services/email/EmailQueueProcessor';
import { emailAutomation } from '../src/services/email/EmailAutomation';
import { initializeEmailTemplates } from '../src/services/email/EmailTemplates';
import emailRoutes from './routes/email';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/email', emailRoutes);

// Email automation webhook endpoints
app.post('/api/webhooks/user-registered', async (req, res) => {
  try {
    const { user } = req.body;
    await emailAutomation.sendWelcomeEmail(user);
    res.json({ success: true });
  } catch (error) {
    console.error('User registration webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

app.post('/api/webhooks/achievement-unlocked', async (req, res) => {
  try {
    const { user, achievement } = req.body;
    await emailAutomation.sendAchievementNotification(user, achievement);
    res.json({ success: true });
  } catch (error) {
    console.error('Achievement webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

app.post('/api/webhooks/lesson-completed', async (req, res) => {
  try {
    const { user, lesson, progress } = req.body;
    
    // Send progress update if it's a milestone
    if (progress.lessonsCompleted % 5 === 0) {
      await emailAutomation.sendProgressUpdate(user, progress);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Lesson completion webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Queue management endpoints
app.get('/api/queue/stats', async (req, res) => {
  try {
    const stats = await emailQueueProcessor.getQueueStats();
    res.json({ stats });
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

app.post('/api/queue/retry', async (req, res) => {
  try {
    const { emailIds } = req.body;
    const retried = await emailQueueProcessor.retryFailedEmails(emailIds);
    res.json({ success: true, retried });
  } catch (error) {
    console.error('Queue retry error:', error);
    res.status(500).json({ error: 'Failed to retry emails' });
  }
});

app.post('/api/queue/clear', async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.body;
    const cleared = await emailQueueProcessor.clearOldEmails(olderThanDays);
    res.json({ success: true, cleared });
  } catch (error) {
    console.error('Queue clear error:', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

app.get('/api/queue/status', (req, res) => {
  const status = emailQueueProcessor.getStatus();
  res.json({ status });
});

app.post('/api/queue/pause', async (req, res) => {
  try {
    await emailQueueProcessor.pauseQueue();
    res.json({ success: true, message: 'Queue paused' });
  } catch (error) {
    console.error('Queue pause error:', error);
    res.status(500).json({ error: 'Failed to pause queue' });
  }
});

app.post('/api/queue/resume', async (req, res) => {
  try {
    await emailQueueProcessor.resumeQueue();
    res.json({ success: true, message: 'Queue resumed' });
  } catch (error) {
    console.error('Queue resume error:', error);
    res.status(500).json({ error: 'Failed to resume queue' });
  }
});

// Automation management endpoints
app.get('/api/automation/rules', (req, res) => {
  try {
    const rules = emailAutomation.getActiveRules();
    res.json({ rules });
  } catch (error) {
    console.error('Get automation rules error:', error);
    res.status(500).json({ error: 'Failed to get automation rules' });
  }
});

app.post('/api/automation/rules/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    emailAutomation.updateRuleStatus(id, isActive);
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle automation rule error:', error);
    res.status(500).json({ error: 'Failed to toggle automation rule' });
  }
});

app.get('/api/automation/stats', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const stats = await emailAutomation.getAutomationStats(timeRange as string);
    res.json({ stats });
  } catch (error) {
    console.error('Get automation stats error:', error);
    res.status(500).json({ error: 'Failed to get automation stats' });
  }
});

// Scheduled tasks endpoints
app.post('/api/automation/tasks/daily-reminders', async (req, res) => {
  try {
    await emailAutomation.processDailyReminders();
    res.json({ success: true, message: 'Daily reminders processed' });
  } catch (error) {
    console.error('Daily reminders error:', error);
    res.status(500).json({ error: 'Failed to process daily reminders' });
  }
});

app.post('/api/automation/tasks/weekly-digests', async (req, res) => {
  try {
    await emailAutomation.processWeeklyDigests();
    res.json({ success: true, message: 'Weekly digests processed' });
  } catch (error) {
    console.error('Weekly digests error:', error);
    res.status(500).json({ error: 'Failed to process weekly digests' });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  try {
    await emailQueueProcessor.stop();
    console.log('Email queue processor stopped');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  try {
    await emailQueueProcessor.stop();
    console.log('Email queue processor stopped');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Initialize services
async function initializeServices() {
  try {
    console.log('Initializing email services...');
    
    // Initialize email templates
    await initializeEmailTemplates();
    console.log('Email templates initialized');
    
    // Start email queue processor
    await emailQueueProcessor.start();
    console.log('Email queue processor started');
    
    console.log('All email services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email services:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`Email service API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;