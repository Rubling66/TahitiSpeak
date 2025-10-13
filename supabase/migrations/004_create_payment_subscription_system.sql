-- Payment & Subscription System Migration
-- Creates tables for subscriptions, payments, and related functionality

-- Create subscription plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    features JSONB DEFAULT '[]'::jsonb,
    max_stories INTEGER,
    max_ai_interactions INTEGER,
    offline_access BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    cultural_content_access BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'inactive', -- active, inactive, canceled, past_due, trialing
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment history table
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES user_subscriptions(id),
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- succeeded, failed, pending, canceled
    payment_method VARCHAR(50), -- card, bank_transfer, etc.
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage tracking table
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES user_subscriptions(id),
    resource_type VARCHAR(50) NOT NULL, -- stories, ai_interactions, offline_downloads
    resource_id UUID,
    usage_count INTEGER DEFAULT 1,
    usage_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook events table for Stripe
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT false,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create notification preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT false,
    payment_reminders BOOLEAN DEFAULT true,
    feature_updates BOOLEAN DEFAULT true,
    cultural_events BOOLEAN DEFAULT true,
    learning_reminders BOOLEAN DEFAULT true,
    fcm_token VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- payment, subscription, feature, cultural, learning
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    sent_via JSONB DEFAULT '{}'::jsonb, -- {email: true, push: false, sms: false}
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offline data table
CREATE TABLE offline_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- story, lesson, cultural_content
    resource_id UUID NOT NULL,
    data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, data_type, resource_id)
);

-- Create sync queue table
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, update, delete
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    data JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_stories, max_ai_interactions, offline_access, priority_support, cultural_content_access) VALUES
('Free', 'Basic access to Tahitian learning', 0.00, 0.00, '["Basic stories", "Limited AI interactions", "Community access"]'::jsonb, 5, 10, false, false, false),
('Premium', 'Enhanced learning experience', 9.99, 99.99, '["Unlimited stories", "Advanced AI tutor", "Offline access", "Cultural insights"]'::jsonb, -1, 100, true, false, true),
('Pro', 'Complete Tahitian immersion', 19.99, 199.99, '["Everything in Premium", "Priority support", "Exclusive content", "Advanced analytics"]'::jsonb, -1, -1, true, true, true);

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_date ON usage_tracking(usage_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_offline_data_user_id ON offline_data(user_id);
CREATE INDEX idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON payment_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offline_data_updated_at BEFORE UPDATE ON offline_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Subscription plans are readable by everyone
CREATE POLICY "Subscription plans are viewable by everyone" ON subscription_plans FOR SELECT USING (is_active = true);

-- Users can only see their own subscription data
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR UPDATE USING (user_id = auth.uid());

-- Users can only see their own payment history
CREATE POLICY "Users can view own payment history" ON payment_history FOR SELECT USING (user_id = auth.uid());

-- Users can only see their own usage tracking
CREATE POLICY "Users can view own usage tracking" ON usage_tracking FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service can insert usage tracking" ON usage_tracking FOR INSERT WITH CHECK (true);

-- Webhook events are service-only
CREATE POLICY "Service can manage webhook events" ON webhook_events FOR ALL USING (true);

-- Users can manage their own notification preferences
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences FOR ALL USING (user_id = auth.uid());

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Users can manage their own offline data
CREATE POLICY "Users can manage own offline data" ON offline_data FOR ALL USING (user_id = auth.uid());

-- Users can view their own sync queue
CREATE POLICY "Users can view own sync queue" ON sync_queue FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service can manage sync queue" ON sync_queue FOR ALL USING (true);