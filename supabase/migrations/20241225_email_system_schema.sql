-- Email System Database Schema
-- This migration creates all necessary tables for the email service system

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    template_variables JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    template_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    provider VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),
    template_data JSONB DEFAULT '{}',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    bounce_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Preferences Table
CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    welcome_emails BOOLEAN NOT NULL DEFAULT true,
    lesson_reminders BOOLEAN NOT NULL DEFAULT true,
    progress_updates BOOLEAN NOT NULL DEFAULT true,
    achievement_notifications BOOLEAN NOT NULL DEFAULT true,
    weekly_digest BOOLEAN NOT NULL DEFAULT true,
    marketing_emails BOOLEAN NOT NULL DEFAULT false,
    frequency VARCHAR(20) NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    preferred_time TIME NOT NULL DEFAULT '09:00:00',
    unsubscribe_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    template_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    template_data JSONB NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Events Table (for tracking opens, clicks, etc.)
CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_log_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    link_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Analytics Summary Table (for performance)
CREATE TABLE IF NOT EXISTS email_analytics_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    template_name VARCHAR(255),
    total_sent INTEGER NOT NULL DEFAULT 0,
    total_delivered INTEGER NOT NULL DEFAULT 0,
    total_opened INTEGER NOT NULL DEFAULT 0,
    total_clicked INTEGER NOT NULL DEFAULT 0,
    total_bounced INTEGER NOT NULL DEFAULT 0,
    total_failed INTEGER NOT NULL DEFAULT 0,
    unique_opens INTEGER NOT NULL DEFAULT 0,
    unique_clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, template_name)
);

-- Unsubscribe Log Table
CREATE TABLE IF NOT EXISTS unsubscribe_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL,
    unsubscribe_token VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_name ON email_logs(template_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_token ON email_preferences(unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_template_name ON email_queue(template_name);

CREATE INDEX IF NOT EXISTS idx_email_events_email_log_id ON email_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON email_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_email_analytics_date ON email_analytics_summary(date);
CREATE INDEX IF NOT EXISTS idx_email_analytics_template ON email_analytics_summary(template_name);

CREATE INDEX IF NOT EXISTS idx_unsubscribe_log_user_id ON unsubscribe_log(user_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_log_token ON unsubscribe_log(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_log_created_at ON unsubscribe_log(created_at);

-- Create Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_analytics_summary_updated_at BEFORE UPDATE ON email_analytics_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribe_log ENABLE ROW LEVEL SECURITY;

-- Email Templates Policies
CREATE POLICY "Email templates are viewable by authenticated users" ON email_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Email templates are manageable by service role" ON email_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Email Logs Policies
CREATE POLICY "Users can view their own email logs" ON email_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all email logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Email Preferences Policies
CREATE POLICY "Users can view their own email preferences" ON email_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" ON email_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences" ON email_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all email preferences" ON email_preferences
    FOR ALL USING (auth.role() = 'service_role');

-- Email Queue Policies
CREATE POLICY "Service role can manage email queue" ON email_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Email Events Policies
CREATE POLICY "Service role can manage email events" ON email_events
    FOR ALL USING (auth.role() = 'service_role');

-- Email Analytics Policies
CREATE POLICY "Authenticated users can view email analytics" ON email_analytics_summary
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage email analytics" ON email_analytics_summary
    FOR ALL USING (auth.role() = 'service_role');

-- Unsubscribe Log Policies
CREATE POLICY "Service role can manage unsubscribe log" ON unsubscribe_log
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON email_templates TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON email_preferences TO authenticated;
GRANT SELECT ON email_logs TO authenticated;
GRANT SELECT ON email_analytics_summary TO authenticated;

-- Grant full access to service role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Insert default email templates
INSERT INTO email_templates (name, subject, category, html_content, template_variables) VALUES
(
    'welcome_email',
    'Welcome to TahitiSpeak! 🌺 Start your Tahitian journey',
    'onboarding',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TahitiSpeak</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <header style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🌺 Ia ora na, {{userName}}!</h1>
        <p style="color: #e0f7fa; margin: 10px 0 0 0; font-size: 16px;">Welcome to TahitiSpeak</p>
    </header>
    
    <main style="padding: 30px 20px; background: #f8fafc; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">We''re thrilled to have you join our community of Tahitian language learners!</p>
        
        <div style="background: white; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; color: #0ea5e9;">🚀 Ready to start your journey?</h3>
            <p style="margin: 0;">Your personalized learning path is waiting for you. Begin with our interactive lessons and immerse yourself in the beautiful Tahitian culture.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Start Learning Now</a>
        </div>
        
        <div style="background: #e0f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #006064;">💡 Quick Tips for Success:</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Practice daily for just 10-15 minutes</li>
                <li>Use the audio features to perfect your pronunciation</li>
                <li>Engage with cultural stories to deepen your understanding</li>
                <li>Track your progress and celebrate achievements</li>
            </ul>
        </div>
        
        <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">
            Need help? Reply to this email or visit our <a href="{{supportUrl}}" style="color: #0ea5e9;">support center</a>.
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                You''re receiving this email because you signed up for TahitiSpeak.<br>
                <a href="{{unsubscribeUrl}}" style="color: #94a3b8;">Unsubscribe</a> | 
                <a href="{{preferencesUrl}}" style="color: #94a3b8;">Email Preferences</a>
            </p>
        </div>
    </main>
</body>
</html>',
    '{"userName": "string", "dashboardUrl": "string", "supportUrl": "string", "unsubscribeUrl": "string", "preferencesUrl": "string"}'::jsonb
),
(
    'lesson_reminder',
    'Don''t forget your Tahitian lesson today! 🌺',
    'engagement',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lesson Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <header style="background: #0ea5e9; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Time for your Tahitian lesson!</h1>
    </header>
    
    <main style="padding: 30px 20px; background: #f8fafc; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hi {{userName}},</p>
        
        <p>Your daily Tahitian lesson is waiting for you! You''re doing great with your learning streak of {{streakDays}} days.</p>
        
        <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0;">📚 Next Lesson: {{nextLessonTitle}}</h3>
            <p style="margin: 0; color: #64748b;">{{nextLessonDescription}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{lessonUrl}}" style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Continue Learning</a>
        </div>
        
        <p style="font-size: 14px; color: #64748b; text-align: center;">
            💡 Tip: Consistent daily practice is the key to language mastery!
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                <a href="{{unsubscribeUrl}}" style="color: #94a3b8;">Unsubscribe</a> | 
                <a href="{{preferencesUrl}}" style="color: #94a3b8;">Email Preferences</a>
            </p>
        </div>
    </main>
</body>
</html>',
    '{"userName": "string", "streakDays": "number", "nextLessonTitle": "string", "nextLessonDescription": "string", "lessonUrl": "string", "unsubscribeUrl": "string", "preferencesUrl": "string"}'::jsonb
),
(
    'achievement_unlocked',
    '🏆 Achievement Unlocked: {{achievementName}}',
    'gamification',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Achievement Unlocked</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <header style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏆 Achievement Unlocked!</h1>
    </header>
    
    <main style="padding: 30px 20px; text-align: center; background: #f8fafc; border-radius: 0 0 8px 8px;">
        <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 15px;">{{achievementIcon}}</div>
            <h2 style="color: #d97706; margin: 0 0 10px 0;">{{achievementName}}</h2>
            <p style="color: #92400e; margin: 0;">{{achievementDescription}}</p>
        </div>
        
        <p>Congratulations, {{userName}}! You''ve earned {{achievementPoints}} points.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0;">📊 Your Progress</h3>
            <p style="margin: 5px 0;">Total Points: {{totalPoints}}</p>
            <p style="margin: 5px 0;">Achievements Unlocked: {{totalAchievements}}</p>
            <p style="margin: 5px 0;">Learning Streak: {{streakDays}} days</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{profileUrl}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View All Achievements</a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                <a href="{{unsubscribeUrl}}" style="color: #94a3b8;">Unsubscribe</a> | 
                <a href="{{preferencesUrl}}" style="color: #94a3b8;">Email Preferences</a>
            </p>
        </div>
    </main>
</body>
</html>',
    '{"userName": "string", "achievementName": "string", "achievementDescription": "string", "achievementIcon": "string", "achievementPoints": "number", "totalPoints": "number", "totalAchievements": "number", "streakDays": "number", "profileUrl": "string", "unsubscribeUrl": "string", "preferencesUrl": "string"}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Create function to generate unsubscribe tokens
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create email preferences for new users
CREATE OR REPLACE FUNCTION create_email_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO email_preferences (user_id, unsubscribe_token)
    VALUES (NEW.id, generate_unsubscribe_token())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create email preferences for new users
CREATE TRIGGER create_email_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_email_preferences_for_user();