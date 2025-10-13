-- Notification System Database Schema
-- This migration creates all tables needed for the notification system

-- 1. Notification Templates Table
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'push', 'email', 'in_app'
    subject VARCHAR(255),
    title VARCHAR(255),
    body TEXT NOT NULL,
    html_body TEXT,
    variables JSONB, -- Template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Notification Preferences Table
CREATE TABLE user_notification_preferences (
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

-- 3. Notification History Table
CREATE TABLE notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    body TEXT,
    data JSONB, -- Additional notification data
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    external_id VARCHAR(255), -- FCM message ID, SendGrid message ID, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Device Tokens Table
CREATE TABLE user_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) NOT NULL, -- 'web', 'ios', 'android'
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- 5. Notification Queue Table (for scheduled notifications)
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    variables JSONB,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed', 'cancelled'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_status ON notification_history(status);
CREATE INDEX idx_notification_history_created_at ON notification_history(created_at DESC);
CREATE INDEX idx_notification_history_type ON notification_history(type);

CREATE INDEX idx_device_tokens_user_id ON user_device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON user_device_tokens(is_active);
CREATE INDEX idx_device_tokens_platform ON user_device_tokens(platform);

CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject, title, body, variables) VALUES
('lesson_reminder', 'push', NULL, 'Time for your Tahitian lesson!', 'Don''t break your streak! Complete today''s lesson to continue your journey.', '["user_name", "streak_count"]'),
('lesson_completed', 'push', NULL, 'Great job!', 'You completed {lesson_name}! Keep up the excellent work.', '["lesson_name", "xp_earned"]'),
('achievement_unlocked', 'push', NULL, 'Achievement Unlocked!', 'Congratulations! You''ve earned the "{achievement_name}" achievement.', '["achievement_name", "achievement_description"]'),
('streak_milestone', 'push', NULL, 'Amazing streak!', 'Wow! You''ve maintained a {streak_count}-day learning streak. Keep it up!', '["streak_count"]'),
('weekly_progress', 'email', 'Your Weekly Progress Report', NULL, 'Here''s your learning progress for this week. You completed {lessons_completed} lessons and earned {xp_earned} XP!', '["user_name", "lessons_completed", "xp_earned", "streak_count"]'),
('subscription_welcome', 'email', 'Welcome to Premium!', NULL, 'Thank you for upgrading to Premium! You now have access to all features including offline lessons and advanced analytics.', '["user_name", "plan_name"]'),
('payment_failed', 'email', 'Payment Issue', NULL, 'We couldn''t process your payment for your {plan_name} subscription. Please update your payment method to continue enjoying premium features.', '["user_name", "plan_name", "amount"]'),
('story_discussion', 'in_app', NULL, 'New Discussion', 'Someone replied to your comment on "{story_name}". Check out what {commenter_name} said!', '["story_name", "commenter_name"]'),
('live_session_reminder', 'push', NULL, 'Live Session Starting Soon!', 'Your Tahitian conversation practice session starts in 15 minutes. Join now!', '["session_name", "start_time"]'),
('content_update', 'in_app', NULL, 'New Content Available!', 'We''ve added new {content_type} about {topic}. Check it out now!', '["content_type", "topic"]');

-- Enable Row Level Security (RLS)
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_templates (public read, admin write)
CREATE POLICY "notification_templates_select" ON notification_templates
    FOR SELECT USING (true);

CREATE POLICY "notification_templates_admin" ON notification_templates
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for user_notification_preferences (users can manage their own)
CREATE POLICY "user_notification_preferences_select" ON user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_notification_preferences_insert" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_notification_preferences_update" ON user_notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for notification_history (users can see their own)
CREATE POLICY "notification_history_select" ON notification_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_history_insert" ON notification_history
    FOR INSERT WITH CHECK (true); -- Service can insert for any user

CREATE POLICY "notification_history_update" ON notification_history
    FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service');

-- RLS Policies for user_device_tokens (users can manage their own)
CREATE POLICY "user_device_tokens_select" ON user_device_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_device_tokens_insert" ON user_device_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_device_tokens_update" ON user_device_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_device_tokens_delete" ON user_device_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_queue (service access)
CREATE POLICY "notification_queue_service" ON notification_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'service');

-- Grant permissions to authenticated users
GRANT SELECT ON notification_templates TO authenticated;
GRANT ALL ON user_notification_preferences TO authenticated;
GRANT SELECT, UPDATE ON notification_history TO authenticated;
GRANT ALL ON user_device_tokens TO authenticated;

-- Grant permissions to anon users (for public templates)
GRANT SELECT ON notification_templates TO anon;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notification_history
        WHERE user_id = user_uuid
        AND status IN ('sent', 'delivered')
        AND read_at IS NULL
        AND type = 'in_app'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_notifications_as_read(user_uuid UUID, notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notification_history
    SET read_at = NOW(),
        status = 'read'
    WHERE user_id = user_uuid
    AND id = ANY(notification_ids)
    AND read_at IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();