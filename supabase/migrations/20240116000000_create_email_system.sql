-- Email System Database Schema
-- This migration creates the complete email service infrastructure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Email Templates Table
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    template_variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Email Logs Table
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    template_name VARCHAR(100) REFERENCES email_templates(name),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    template_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    bounce_reason TEXT,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Preferences Table
CREATE TABLE email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id),
    welcome_emails BOOLEAN DEFAULT true,
    lesson_reminders BOOLEAN DEFAULT true,
    progress_updates BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    frequency VARCHAR(20) DEFAULT 'immediate',
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_time TIME DEFAULT '09:00:00',
    unsubscribe_token VARCHAR(255) UNIQUE,
    is_unsubscribed BOOLEAN DEFAULT false,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Queue Table
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    template_name VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    template_data JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 5,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Events Table
CREATE TABLE email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_log_id UUID REFERENCES email_logs(id),
    event_type VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    link_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Analytics Cache Table
CREATE TABLE email_analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_templates_name ON email_templates(name);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_template_name ON email_logs(template_name);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_provider_message_id ON email_logs(provider_message_id);

CREATE INDEX idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX idx_email_preferences_unsubscribe_token ON email_preferences(unsubscribe_token);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX idx_email_queue_priority ON email_queue(priority);
CREATE INDEX idx_email_queue_user_id ON email_queue(user_id);

CREATE INDEX idx_email_events_email_log_id ON email_events(email_log_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_timestamp ON email_events(timestamp);

CREATE INDEX idx_email_analytics_cache_key ON email_analytics_cache(cache_key);
CREATE INDEX idx_email_analytics_cache_expires ON email_analytics_cache(expires_at);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics_cache ENABLE ROW LEVEL SECURITY;

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

-- Email Analytics Cache Policies
CREATE POLICY "Service role can manage analytics cache" ON email_analytics_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Functions

-- Generate unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create email preferences for new users
CREATE OR REPLACE FUNCTION create_email_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO email_preferences (user_id, unsubscribe_token)
    VALUES (NEW.id, generate_unsubscribe_token());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update email log status
CREATE OR REPLACE FUNCTION update_email_log_status(
    log_id UUID,
    new_status VARCHAR(20),
    event_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    UPDATE email_logs 
    SET 
        status = new_status,
        updated_at = NOW(),
        sent_at = CASE WHEN new_status = 'sent' THEN NOW() ELSE sent_at END,
        delivered_at = CASE WHEN new_status = 'delivered' THEN NOW() ELSE delivered_at END,
        opened_at = CASE WHEN new_status = 'opened' THEN NOW() ELSE opened_at END,
        clicked_at = CASE WHEN new_status = 'clicked' THEN NOW() ELSE clicked_at END,
        bounced_at = CASE WHEN new_status = 'bounced' THEN NOW() ELSE bounced_at END,
        bounce_reason = CASE WHEN new_status = 'bounced' THEN event_data->>'reason' ELSE bounce_reason END,
        error_message = CASE WHEN new_status = 'failed' THEN event_data->>'error' ELSE error_message END
    WHERE id = log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get email analytics
CREATE OR REPLACE FUNCTION get_email_analytics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    template_filter VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH email_stats AS (
        SELECT 
            COUNT(*) as total_sent,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
            COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened,
            COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked,
            COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM email_logs 
        WHERE created_at BETWEEN start_date AND end_date
        AND (template_filter IS NULL OR template_name = template_filter)
    )
    SELECT jsonb_build_object(
        'totalSent', total_sent,
        'delivered', delivered,
        'opened', opened,
        'clicked', clicked,
        'bounced', bounced,
        'failed', failed,
        'deliveryRate', CASE WHEN total_sent > 0 THEN ROUND((delivered::DECIMAL / total_sent) * 100, 2) ELSE 0 END,
        'openRate', CASE WHEN delivered > 0 THEN ROUND((opened::DECIMAL / delivered) * 100, 2) ELSE 0 END,
        'clickRate', CASE WHEN opened > 0 THEN ROUND((clicked::DECIMAL / opened) * 100, 2) ELSE 0 END,
        'bounceRate', CASE WHEN total_sent > 0 THEN ROUND((bounced::DECIMAL / total_sent) * 100, 2) ELSE 0 END
    ) INTO result
    FROM email_stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean expired analytics cache
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM email_analytics_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process email queue
CREATE OR REPLACE FUNCTION process_email_queue_batch(batch_size INTEGER DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
    processed_count INTEGER := 0;
    queue_item RECORD;
BEGIN
    FOR queue_item IN 
        SELECT * FROM email_queue 
        WHERE status = 'pending' 
        AND scheduled_at <= NOW()
        ORDER BY priority DESC, created_at ASC
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Update status to processing
        UPDATE email_queue 
        SET status = 'processing', updated_at = NOW()
        WHERE id = queue_item.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object('processed', processed_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers

-- Create email preferences for new users
CREATE TRIGGER create_email_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_email_preferences_for_user();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at
    BEFORE UPDATE ON email_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON email_templates TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON email_preferences TO authenticated;
GRANT SELECT ON email_logs TO authenticated;

-- Grant all privileges to service role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;