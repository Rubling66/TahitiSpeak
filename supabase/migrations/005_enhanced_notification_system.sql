-- Enhanced Notification System Migration
-- Extends the existing notification system with templates, preferences, and device management

-- Create notification templates table
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'push', 'email', 'in_app'
    subject VARCHAR(255),
    title VARCHAR(255),
    body TEXT NOT NULL,
    html_body TEXT,
    variables JSONB DEFAULT '[]'::jsonb, -- Template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced user notification preferences table
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    lesson_reminders BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    social_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    weekly_progress BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification history table (enhanced version)
CREATE TABLE notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    template_id UUID REFERENCES notification_templates(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb, -- Additional notification data
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    external_id VARCHAR(255), -- FCM message ID, SendGrid message ID, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device tokens table for push notifications
CREATE TABLE user_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) NOT NULL, -- 'web', 'ios', 'android'
    device_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Create notification analytics table
CREATE TABLE notification_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES notification_templates(id),
    user_id UUID,
    type VARCHAR(50) NOT NULL,
    event VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'failed'
    platform VARCHAR(20),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification campaigns table
CREATE TABLE notification_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES notification_templates(id),
    target_criteria JSONB DEFAULT '{}'::jsonb, -- User targeting criteria
    schedule_type VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'scheduled', 'recurring'
    scheduled_for TIMESTAMP WITH TIME ZONE,
    recurring_pattern VARCHAR(100), -- cron-like pattern for recurring campaigns
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject, title, body, variables) VALUES
('lesson_reminder', 'push', NULL, 'Time for your Tahitian lesson!', 'Don''t break your streak! Complete today''s lesson to continue your journey.', '["user_name", "streak_count"]'::jsonb),
('lesson_completed', 'push', NULL, 'Great job!', 'You completed {lesson_name}! Keep up the excellent work.', '["lesson_name", "xp_earned"]'::jsonb),
('achievement_unlocked', 'push', NULL, 'Achievement Unlocked!', 'Congratulations! You''ve earned the "{achievement_name}" achievement.', '["achievement_name", "achievement_description"]'::jsonb),
('subscription_welcome', 'email', 'Welcome to Premium!', NULL, 'Thank you for upgrading to Premium! You now have access to all features.', '["user_name", "plan_name"]'::jsonb),
('payment_failed', 'email', 'Payment Issue', NULL, 'We couldn''t process your payment. Please update your payment method.', '["user_name", "amount"]'::jsonb),
('story_discussion', 'in_app', NULL, 'New Discussion', 'Someone replied to your comment on {story_name}', '["story_name", "commenter_name"]'::jsonb),
('weekly_progress', 'email', 'Your Weekly Progress', NULL, 'Here''s your learning progress for this week: {lessons_completed} lessons completed!', '["user_name", "lessons_completed", "streak_count", "xp_earned"]'::jsonb),
('streak_milestone', 'push', NULL, 'Streak Milestone!', 'Amazing! You''ve maintained a {streak_count}-day learning streak!', '["streak_count"]'::jsonb),
('cultural_event', 'in_app', NULL, 'Cultural Event', 'Join us for {event_name} - learn about Tahitian culture!', '["event_name", "event_date", "event_description"]'::jsonb),
('password_reset', 'email', 'Reset Your Password', NULL, 'Click the link below to reset your password. This link expires in 1 hour.', '["user_name", "reset_link"]'::jsonb);

-- Create indexes for performance
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_status ON notification_history(status);
CREATE INDEX idx_notification_history_created_at ON notification_history(created_at DESC);
CREATE INDEX idx_device_tokens_user_id ON user_device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON user_device_tokens(is_active);
CREATE INDEX idx_notification_analytics_template_id ON notification_analytics(template_id);
CREATE INDEX idx_notification_analytics_event ON notification_analytics(event);
CREATE INDEX idx_notification_analytics_created_at ON notification_analytics(created_at DESC);
CREATE INDEX idx_notification_campaigns_status ON notification_campaigns(status);
CREATE INDEX idx_notification_campaigns_scheduled_for ON notification_campaigns(scheduled_for);

-- Add updated_at triggers
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_campaigns_updated_at BEFORE UPDATE ON notification_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Notification templates are readable by authenticated users
CREATE POLICY "Notification templates are viewable by authenticated users" ON notification_templates FOR SELECT TO authenticated USING (is_active = true);

-- Users can only manage their own notification preferences
CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only see their own notification history
CREATE POLICY "Users can view own notification history" ON notification_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notification history" ON notification_history FOR UPDATE USING (user_id = auth.uid());

-- Users can only manage their own device tokens
CREATE POLICY "Users can view own device tokens" ON user_device_tokens FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own device tokens" ON user_device_tokens FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own device tokens" ON user_device_tokens FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own device tokens" ON user_device_tokens FOR DELETE USING (user_id = auth.uid());

-- Notification analytics are viewable by authenticated users (for their own data)
CREATE POLICY "Users can view own notification analytics" ON notification_analytics FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Notification campaigns are managed by admins only
CREATE POLICY "Admins can manage notification campaigns" ON notification_campaigns FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_user_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notification preferences for new users
-- Note: This assumes auth.users table exists, adjust if using different auth system
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_notification_preferences();

-- Create function to track notification events
CREATE OR REPLACE FUNCTION track_notification_event(
    p_template_id UUID,
    p_user_id UUID,
    p_type VARCHAR(50),
    p_event VARCHAR(50),
    p_platform VARCHAR(20) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    INSERT INTO notification_analytics (template_id, user_id, type, event, platform, metadata)
    VALUES (p_template_id, p_user_id, p_type, p_event, p_platform, p_metadata)
    RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user notification preferences with defaults
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS TABLE (
    push_enabled BOOLEAN,
    email_enabled BOOLEAN,
    in_app_enabled BOOLEAN,
    lesson_reminders BOOLEAN,
    achievement_notifications BOOLEAN,
    social_notifications BOOLEAN,
    marketing_emails BOOLEAN,
    weekly_progress BOOLEAN,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(unp.push_enabled, true),
        COALESCE(unp.email_enabled, true),
        COALESCE(unp.in_app_enabled, true),
        COALESCE(unp.lesson_reminders, true),
        COALESCE(unp.achievement_notifications, true),
        COALESCE(unp.social_notifications, true),
        COALESCE(unp.marketing_emails, false),
        COALESCE(unp.weekly_progress, true),
        unp.quiet_hours_start,
        unp.quiet_hours_end,
        COALESCE(unp.timezone, 'UTC')
    FROM user_notification_preferences unp
    WHERE unp.user_id = p_user_id;
    
    -- If no preferences found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT true, true, true, true, true, true, false, true, NULL::TIME, NULL::TIME, 'UTC'::VARCHAR(50);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;