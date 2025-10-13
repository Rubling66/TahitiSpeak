-- Create notification system tables

-- Notification Templates Table
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

-- User Notification Preferences Table
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

-- Notification History Table
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

-- Device Tokens Table
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

-- Create indexes for better performance
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_status ON notification_history(status);
CREATE INDEX idx_notification_history_created_at ON notification_history(created_at DESC);
CREATE INDEX idx_device_tokens_user_id ON user_device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON user_device_tokens(is_active);
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject, title, body, variables) VALUES
('lesson_reminder', 'push', NULL, 'Time for your Tahitian lesson!', 'Don''t break your streak! Complete today''s lesson to continue your journey.', '["user_name", "streak_count"]'),
('lesson_completed', 'push', NULL, 'Great job!', 'You completed {lesson_name}! Keep up the excellent work.', '["lesson_name", "xp_earned"]'),
('streak_milestone', 'push', NULL, 'Amazing streak!', 'Congratulations! You''ve reached a {streak_count}-day streak! Keep it up!', '["user_name", "streak_count"]'),
('achievement_unlocked', 'push', NULL, 'Achievement Unlocked!', 'You''ve earned the "{achievement_name}" achievement! Well done!', '["achievement_name", "achievement_description"]'),
('weekly_progress', 'email', 'Your Weekly Progress Report', NULL, 'Here''s your weekly learning summary for Tahitian. You''ve made great progress!', '["user_name", "lessons_completed", "time_spent", "streak_count"]'),
('subscription_welcome', 'email', 'Welcome to Premium!', NULL, 'Thank you for upgrading to Premium! You now have access to all features.', '["user_name", "plan_name"]'),
('payment_failed', 'email', 'Payment Issue', NULL, 'We couldn''t process your payment. Please update your payment method.', '["user_name", "amount"]'),
('story_discussion', 'in_app', NULL, 'New Discussion', 'Someone replied to your comment on {story_name}', '["story_name", "commenter_name"]'),
('feature_announcement', 'in_app', NULL, 'New Feature Available!', 'Check out our latest feature: {feature_name}. Start exploring now!', '["feature_name", "feature_description"]'),
('cultural_event', 'push', NULL, 'Cultural Celebration!', 'Today is {event_name}! Learn about this important Tahitian celebration.', '["event_name", "event_description"]');

-- Enable Row Level Security (RLS)
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_templates (public read, admin write)
CREATE POLICY "notification_templates_select" ON notification_templates
    FOR SELECT USING (true);

CREATE POLICY "notification_templates_admin" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- RLS Policies for user_notification_preferences (users can manage their own)
CREATE POLICY "user_notification_preferences_select" ON user_notification_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_notification_preferences_insert" ON user_notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_notification_preferences_update" ON user_notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for notification_history (users can see their own)
CREATE POLICY "notification_history_select" ON notification_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notification_history_insert" ON notification_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_history_update" ON notification_history
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for user_device_tokens (users can manage their own)
CREATE POLICY "user_device_tokens_select" ON user_device_tokens
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_device_tokens_insert" ON user_device_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_device_tokens_update" ON user_device_tokens
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_device_tokens_delete" ON user_device_tokens
    FOR DELETE USING (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT ON notification_templates TO authenticated;
GRANT ALL ON user_notification_preferences TO authenticated;
GRANT ALL ON notification_history TO authenticated;
GRANT ALL ON user_device_tokens TO authenticated;

-- Grant permissions to anon users for public templates
GRANT SELECT ON notification_templates TO anon;

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_user_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notification preferences
CREATE TRIGGER on_auth_user_created_notification_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_notification_preferences();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();