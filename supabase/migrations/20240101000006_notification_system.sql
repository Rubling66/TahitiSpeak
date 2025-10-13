-- Notification System Database Schema
-- This migration creates all tables and functions needed for the notification system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('push', 'email', 'in_app')),
    subject VARCHAR(255),
    title VARCHAR(255),
    body TEXT NOT NULL,
    html_body TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Notification History Table
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('push', 'email', 'in_app')),
    title VARCHAR(255),
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device Tokens Table
CREATE TABLE IF NOT EXISTS user_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    device_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Security Events Table (for tracking notification security events)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    url TEXT,
    method VARCHAR(10),
    reason TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON notification_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(type);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON user_device_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON user_device_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject, title, body, variables) VALUES
('lesson_reminder', 'push', NULL, 'Time for your Tahitian lesson!', 'Don''t break your streak! Complete today''s lesson to continue your journey.', '["user_name", "streak_count"]'),
('lesson_completed', 'push', NULL, 'Great job!', 'You completed {lesson_name}! Keep up the excellent work.', '["lesson_name", "xp_earned"]'),
('achievement_unlocked', 'push', NULL, 'Achievement Unlocked!', 'Congratulations! You''ve earned the {achievement_name} achievement.', '["achievement_name", "description"]'),
('weekly_progress', 'push', NULL, 'Weekly Progress Report', 'This week you completed {lessons_count} lessons and earned {xp_earned} XP!', '["lessons_count", "xp_earned", "streak_count"]'),
('subscription_welcome', 'email', 'Welcome to Premium!', NULL, 'Thank you for upgrading to Premium! You now have access to all features.', '["user_name", "plan_name"]'),
('payment_failed', 'email', 'Payment Issue - Action Required', NULL, 'We couldn''t process your payment. Please update your payment method to continue your premium access.', '["user_name", "amount", "next_retry_date"]'),
('password_reset', 'email', 'Reset Your Password', NULL, 'Click the link below to reset your password. This link expires in 1 hour.', '["user_name", "reset_link"]'),
('email_verification', 'email', 'Verify Your Email Address', NULL, 'Please verify your email address to complete your account setup.', '["user_name", "verification_link"]'),
('story_discussion', 'in_app', NULL, 'New Discussion', 'Someone replied to your comment on {story_name}', '["story_name", "commenter_name"]'),
('friend_request', 'in_app', NULL, 'Friend Request', '{sender_name} sent you a friend request!', '["sender_name"]'),
('lesson_streak_milestone', 'in_app', NULL, 'Streak Milestone!', 'Amazing! You''ve maintained your learning streak for {streak_count} days!', '["streak_count"]')
ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user notification preferences with defaults
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
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
        COALESCE(unp.user_id, p_user_id) as user_id,
        COALESCE(unp.push_enabled, true) as push_enabled,
        COALESCE(unp.email_enabled, true) as email_enabled,
        COALESCE(unp.in_app_enabled, true) as in_app_enabled,
        COALESCE(unp.lesson_reminders, true) as lesson_reminders,
        COALESCE(unp.achievement_notifications, true) as achievement_notifications,
        COALESCE(unp.social_notifications, true) as social_notifications,
        COALESCE(unp.marketing_emails, false) as marketing_emails,
        COALESCE(unp.weekly_progress, true) as weekly_progress,
        unp.quiet_hours_start,
        unp.quiet_hours_end,
        COALESCE(unp.timezone, 'UTC') as timezone
    FROM user_notification_preferences unp
    RIGHT JOIN auth.users u ON u.id = p_user_id
    WHERE unp.user_id = p_user_id OR unp.user_id IS NULL
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track notification events
CREATE OR REPLACE FUNCTION track_notification_event(
    p_notification_id UUID,
    p_event_type VARCHAR(50),
    p_external_id VARCHAR(255) DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    CASE p_event_type
        WHEN 'sent' THEN
            UPDATE notification_history 
            SET status = 'sent', sent_at = NOW(), external_id = p_external_id
            WHERE id = p_notification_id;
        WHEN 'delivered' THEN
            UPDATE notification_history 
            SET status = 'delivered', delivered_at = NOW()
            WHERE id = p_notification_id;
        WHEN 'failed' THEN
            UPDATE notification_history 
            SET status = 'failed', error_message = p_error_message
            WHERE id = p_notification_id;
        WHEN 'read' THEN
            UPDATE notification_history 
            SET status = 'read', read_at = NOW()
            WHERE id = p_notification_id AND status != 'read';
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notification_history
        WHERE user_id = p_user_id 
        AND type = 'in_app' 
        AND status != 'read'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is in quiet hours
CREATE OR REPLACE FUNCTION is_user_in_quiet_hours(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_prefs RECORD;
    current_time_in_tz TIME;
BEGIN
    SELECT * INTO user_prefs FROM get_user_notification_preferences(p_user_id);
    
    IF user_prefs.quiet_hours_start IS NULL OR user_prefs.quiet_hours_end IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Convert current time to user's timezone
    current_time_in_tz := (NOW() AT TIME ZONE user_prefs.timezone)::TIME;
    
    -- Check if current time is within quiet hours
    IF user_prefs.quiet_hours_start <= user_prefs.quiet_hours_end THEN
        -- Same day quiet hours (e.g., 22:00 to 06:00 next day)
        RETURN current_time_in_tz >= user_prefs.quiet_hours_start 
               AND current_time_in_tz <= user_prefs.quiet_hours_end;
    ELSE
        -- Overnight quiet hours (e.g., 22:00 to 06:00 next day)
        RETURN current_time_in_tz >= user_prefs.quiet_hours_start 
               OR current_time_in_tz <= user_prefs.quiet_hours_end;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Notification templates - readable by all authenticated users, writable by admins only
CREATE POLICY "notification_templates_read" ON notification_templates
    FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "notification_templates_admin_all" ON notification_templates
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- User notification preferences - users can only access their own
CREATE POLICY "user_notification_preferences_own" ON user_notification_preferences
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- Notification history - users can only access their own
CREATE POLICY "notification_history_own" ON notification_history
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- Device tokens - users can only access their own
CREATE POLICY "user_device_tokens_own" ON user_device_tokens
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- Security events - admin only
CREATE POLICY "security_events_admin_only" ON security_events
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON notification_templates TO anon;
GRANT ALL PRIVILEGES ON notification_templates TO authenticated;
GRANT ALL PRIVILEGES ON user_notification_preferences TO authenticated;
GRANT ALL PRIVILEGES ON notification_history TO authenticated;
GRANT ALL PRIVILEGES ON user_device_tokens TO authenticated;
GRANT ALL PRIVILEGES ON security_events TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;