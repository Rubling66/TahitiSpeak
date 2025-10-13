# Email Service Implementation

This document provides a comprehensive overview of the email service implementation for the TahitiSpeak application.

## Overview

The email service is a complete, production-ready system that handles:
- Email template management
- Automated email workflows
- Queue-based email processing
- Email analytics and tracking
- User preference management
- Multi-provider support (SendGrid, Resend)

## Architecture

### Core Components

1. **EmailService** (`src/services/EmailService.ts`)
   - Main service class for email operations
   - Template management and compilation
   - Email sending and scheduling
   - Analytics and event tracking

2. **EmailProviders** (`src/services/email/EmailProviders.ts`)
   - Provider-agnostic email sending
   - SendGrid and Resend implementations
   - Failover and load balancing
   - Mock provider for testing

3. **EmailAutomation** (`src/services/email/EmailAutomation.ts`)
   - Automated email workflows
   - Event-driven email triggers
   - Batch processing for scheduled emails
   - Rule-based email automation

4. **EmailQueueProcessor** (`src/services/email/EmailQueueProcessor.ts`)
   - Background queue processing
   - Retry logic with exponential backoff
   - Concurrent job processing
   - Queue monitoring and statistics

5. **EmailTemplates** (`src/services/email/EmailTemplates.ts`)
   - Predefined email templates
   - Template validation and preview
   - Dynamic template compilation

## Database Schema

The email system uses the following Supabase tables:

### email_templates
- `id`: UUID primary key
- `name`: Unique template name
- `subject`: Email subject line
- `html_content`: HTML email content
- `text_content`: Plain text content
- `variables`: Array of template variables
- `category`: Template category
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

### email_queue
- `id`: UUID primary key
- `template_name`: Reference to template
- `recipient`: Email address
- `template_data`: JSON template data
- `status`: pending, processing, sent, failed, scheduled
- `priority`: low, normal, high, urgent
- `scheduled_for`: Scheduled send time
- `attempts`: Retry attempts
- `message_id`: Provider message ID
- `error_message`: Error details
- `user_id`: Associated user
- `created_at`, `updated_at`: Timestamps

### email_preferences
- `id`: UUID primary key
- `user_id`: User reference
- `welcome_emails`: Boolean preference
- `lesson_reminders`: Boolean preference
- `progress_updates`: Boolean preference
- `achievement_notifications`: Boolean preference
- `weekly_digest`: Boolean preference
- `marketing_emails`: Boolean preference
- `frequency`: immediate, daily, weekly, never
- `timezone`: User timezone
- `preferred_time`: Preferred send time
- `is_unsubscribed`: Global unsubscribe
- `unsubscribe_token`: Unique token
- `created_at`, `updated_at`: Timestamps

### email_events
- `id`: UUID primary key
- `event_type`: sent, delivered, opened, clicked, bounced, failed
- `email_id`: Reference to queued email
- `user_id`: Associated user
- `timestamp`: Event timestamp
- `metadata`: Additional event data

### email_logs
- `id`: UUID primary key
- `template_name`: Template used
- `recipient`: Email address
- `status`: Email status
- `sent_at`: Send timestamp
- `delivered_at`: Delivery timestamp
- `opened_at`: Open timestamp
- `clicked_at`: Click timestamp
- `user_id`: Associated user
- `message_id`: Provider message ID
- `metadata`: Additional data

### email_analytics_cache
- `id`: UUID primary key
- `metric_name`: Analytics metric
- `metric_value`: Metric value
- `time_period`: Time period
- `calculated_at`: Calculation timestamp
- `expires_at`: Cache expiration

## API Endpoints

### Email Sending
- `POST /api/email/send` - Send single email
- `POST /api/email/send/bulk` - Send bulk emails

### Template Management
- `GET /api/email/templates` - List templates
- `GET /api/email/templates/:name` - Get template
- `POST /api/email/templates` - Create template
- `PUT /api/email/templates/:name` - Update template
- `DELETE /api/email/templates/:name` - Delete template

### Queue Management
- `GET /api/email/queue` - List queued emails
- `POST /api/email/queue/:id/retry` - Retry failed email
- `DELETE /api/email/queue/:id` - Delete queued email

### User Preferences
- `GET /api/email/preferences` - Get user preferences
- `PUT /api/email/preferences` - Update preferences
- `POST /api/email/preferences/unsubscribe` - Unsubscribe user
- `POST /api/email/preferences/resubscribe` - Resubscribe user

### Analytics
- `GET /api/email/analytics` - Get email analytics
- `POST /api/email/analytics/track` - Track email event

### Webhooks
- `POST /api/email/webhooks/sendgrid` - SendGrid webhook
- `POST /api/email/webhooks/resend` - Resend webhook

### Queue Operations
- `GET /api/queue/stats` - Queue statistics
- `POST /api/queue/retry` - Retry failed emails
- `POST /api/queue/clear` - Clear old emails
- `GET /api/queue/status` - Queue processor status
- `POST /api/queue/pause` - Pause queue processing
- `POST /api/queue/resume` - Resume queue processing

### Automation
- `GET /api/automation/rules` - List automation rules
- `POST /api/automation/rules/:id/toggle` - Toggle rule
- `GET /api/automation/stats` - Automation statistics
- `POST /api/automation/tasks/daily-reminders` - Process daily reminders
- `POST /api/automation/tasks/weekly-digests` - Process weekly digests

## React Components

### EmailPreferences
- User email preference management
- Toggle preferences by category
- Frequency and timing settings
- Unsubscribe/resubscribe functionality

### EmailTemplateManager
- Template CRUD operations
- Template preview with sample data
- Template validation
- Export/import functionality

### EmailAnalyticsDashboard
- Email performance metrics
- Engagement trends visualization
- Template performance comparison
- User engagement distribution

### EmailQueueManager
- Queue monitoring and management
- Bulk operations (retry, delete)
- Search and filtering
- Queue statistics

### EmailDashboard
- Main email management interface
- Tabbed navigation between components
- Quick actions for common tasks
- Overview statistics

## React Hooks

### useEmail
- Core email functionality
- Template management
- Email sending and scheduling
- Analytics data loading

### useEmailPreferences
- User preference management
- Preference loading and updating
- Unsubscribe/resubscribe actions

### useEmailAutomation
- Automated email sending
- Predefined email workflows
- Dynamic template data generation

## Configuration

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Providers
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=TahitiSpeak

RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=TahitiSpeak

# Email Service
EMAIL_PROVIDER=sendgrid
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_QUEUE_MAX_RETRIES=3
EMAIL_QUEUE_RETRY_DELAY_MS=60000
EMAIL_QUEUE_PROCESSING_INTERVAL_MS=30000
EMAIL_QUEUE_MAX_CONCURRENT_JOBS=5

# Application
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3001
SUPPORT_EMAIL=support@yourdomain.com
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase and email provider credentials

3. **Apply Database Migration**
   ```bash
   # Apply the email system migration
   supabase db push
   ```

4. **Start Services**
   ```bash
   # Start both frontend and API
   npm run dev:full
   
   # Or start separately
   npm run dev        # Frontend only
   npm run dev:api    # API only
   ```

5. **Initialize Templates**
   ```bash
   # Initialize default email templates
   curl -X POST http://localhost:3001/api/email/templates/initialize \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Email Templates

The system includes predefined templates:

### Welcome Email
- Sent when users register
- Includes login link and support contact
- Variables: `userName`, `userEmail`, `loginUrl`, `supportEmail`

### Lesson Reminder
- Daily reminders for active learners
- Includes streak information and next lesson
- Variables: `userName`, `streakDays`, `nextLessonTitle`, `nextLessonUrl`, `continueUrl`

### Achievement Unlocked
- Sent when users earn achievements
- Includes achievement details and user stats
- Variables: `userName`, `achievementName`, `achievementDescription`, `achievementIcon`, `pointsEarned`, `totalPoints`, `totalAchievements`, `streakDays`, `profileUrl`

### Progress Update
- Weekly progress summaries
- Includes learning statistics and goals
- Variables: `userName`, `weeklyStats`, `lessonsCompleted`, `timeSpent`, `streakDays`, `pointsEarned`, `nextGoals`, `dashboardUrl`

### Weekly Digest
- Weekly community highlights and recommendations
- Includes community stats and upcoming features
- Variables: `userName`, `weeklyHighlights`, `communityStats`, `recommendedLessons`, `upcomingFeatures`, `unsubscribeUrl`

### Password Reset
- Secure password reset emails
- Includes reset link with expiration
- Variables: `userName`, `resetUrl`, `expiresIn`, `supportEmail`

## Automation Workflows

### User Registration
- Triggers welcome email immediately
- Respects user preferences
- High priority delivery

### Lesson Completion
- Tracks progress milestones
- Sends progress updates every 5 lessons
- Normal priority delivery

### Achievement Unlocked
- 5-minute delay to batch multiple achievements
- Includes comprehensive user stats
- Normal priority delivery

### Daily Reminders
- Batch processed for all eligible users
- Respects user timezone and preferred time
- Checks for active streaks

### Weekly Digests
- Batch processed weekly
- Generates personalized content
- Includes unsubscribe link

## Monitoring and Analytics

### Queue Statistics
- Pending, processing, sent, failed counts
- Average processing time
- Success rate percentage
- Historical trends

### Email Analytics
- Delivery rates
- Open rates
- Click rates
- Bounce rates
- Unsubscribe rates

### Template Performance
- Performance by template
- Engagement metrics
- A/B testing support

### User Engagement
- Engagement distribution
- Preference trends
- Unsubscribe analysis

## Security Features

### Authentication
- JWT-based API authentication
- User-specific data access
- Admin-only operations

### Rate Limiting
- IP-based rate limiting
- Configurable limits
- Webhook protection

### Data Protection
- Encrypted sensitive data
- Secure token generation
- GDPR compliance features

### Webhook Security
- Signature verification
- Provider-specific validation
- Error handling and logging

## Testing

### Unit Tests
```bash
npm run test:unit
```

### API Tests
```bash
npm run test:api
```

### Integration Tests
```bash
npm run test:integration
```

### Mock Provider
The system includes a mock email provider for testing:
- Simulates email sending
- Tracks sent emails
- Configurable success/failure rates

## Deployment

### Production Setup
1. Set production environment variables
2. Configure email provider webhooks
3. Set up monitoring and alerting
4. Configure backup and recovery

### Scaling Considerations
- Queue processor can be scaled horizontally
- Database connection pooling
- Redis for distributed caching
- Load balancing for API endpoints

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check provider API keys
   - Verify queue processor is running
   - Check email preferences

2. **High bounce rates**
   - Validate email addresses
   - Check sender reputation
   - Review email content

3. **Queue backing up**
   - Increase concurrent jobs
   - Check provider rate limits
   - Monitor error rates

### Debugging

1. **Enable debug logging**
   ```env
   NODE_ENV=development
   DEBUG=email:*
   ```

2. **Check queue status**
   ```bash
   curl http://localhost:3001/api/queue/status
   ```

3. **Monitor queue stats**
   ```bash
   curl http://localhost:3001/api/queue/stats
   ```

## Future Enhancements

- A/B testing framework
- Advanced segmentation
- Email campaign builder
- Real-time notifications
- Machine learning optimization
- Advanced analytics dashboard

## Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Contact support team
- Submit GitHub issues