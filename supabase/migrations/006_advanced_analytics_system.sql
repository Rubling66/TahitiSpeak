-- Advanced Analytics System Migration
-- Creates comprehensive analytics and reporting infrastructure

-- Create user analytics events table
CREATE TABLE user_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    page_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning analytics table
CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    lesson_id UUID,
    story_id UUID,
    activity_type VARCHAR(100) NOT NULL, -- 'lesson_start', 'lesson_complete', 'story_read', 'quiz_attempt', etc.
    performance_score DECIMAL(5,2), -- 0-100 score
    time_spent INTEGER, -- seconds
    completion_rate DECIMAL(5,2), -- 0-100 percentage
    difficulty_level VARCHAR(20),
    mistakes_count INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user behavior patterns table
CREATE TABLE user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    pattern_type VARCHAR(100) NOT NULL, -- 'learning_streak', 'preferred_time', 'content_preference', etc.
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(5,2), -- 0-100 confidence in pattern
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pattern_type)
);

-- Create content analytics table
CREATE TABLE content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL, -- 'lesson', 'story', 'quiz', etc.
    content_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL, -- 'views', 'completions', 'avg_score', 'time_spent', etc.
    metric_value DECIMAL(15,2) NOT NULL,
    aggregation_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_type, content_id, metric_type, aggregation_period, period_start)
);

-- Create A/B testing experiments table
CREATE TABLE ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    traffic_allocation DECIMAL(5,2) DEFAULT 50.00, -- percentage of users in experiment
    variants JSONB NOT NULL, -- experiment variants configuration
    success_metrics JSONB NOT NULL, -- metrics to track for success
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create A/B test assignments table
CREATE TABLE ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    variant VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(experiment_id, user_id)
);

-- Create A/B test results table
CREATE TABLE ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    variant VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user cohorts table
CREATE TABLE user_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL, -- cohort definition criteria
    is_dynamic BOOLEAN DEFAULT true, -- whether cohort membership updates automatically
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user cohort memberships table
CREATE TABLE user_cohort_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES user_cohorts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(cohort_id, user_id, joined_at)
);

-- Create retention analytics table
CREATE TABLE retention_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_period DATE NOT NULL, -- when users first signed up
    period_number INTEGER NOT NULL, -- days/weeks/months since signup
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    total_users INTEGER NOT NULL,
    retained_users INTEGER NOT NULL,
    retention_rate DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cohort_period, period_number, period_type)
);

-- Create performance metrics table
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    tags JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom reports table
CREATE TABLE custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    query_config JSONB NOT NULL, -- report configuration
    visualization_config JSONB, -- chart/table configuration
    schedule JSONB, -- automated report schedule
    is_public BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report executions table
CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
    executed_by UUID,
    execution_time DECIMAL(10,3), -- seconds
    result_data JSONB,
    status VARCHAR(50) DEFAULT 'success', -- 'success', 'failed', 'timeout'
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_analytics_events_user_id ON user_analytics_events(user_id);
CREATE INDEX idx_user_analytics_events_event_type ON user_analytics_events(event_type);
CREATE INDEX idx_user_analytics_events_timestamp ON user_analytics_events(timestamp DESC);
CREATE INDEX idx_learning_analytics_user_id ON learning_analytics(user_id);
CREATE INDEX idx_learning_analytics_activity_type ON learning_analytics(activity_type);
CREATE INDEX idx_learning_analytics_created_at ON learning_analytics(created_at DESC);
CREATE INDEX idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX idx_content_analytics_content ON content_analytics(content_type, content_id);
CREATE INDEX idx_content_analytics_period ON content_analytics(aggregation_period, period_start);
CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_test_assignments_experiment_user ON ab_test_assignments(experiment_id, user_id);
CREATE INDEX idx_ab_test_results_experiment ON ab_test_results(experiment_id);
CREATE INDEX idx_retention_analytics_cohort ON retention_analytics(cohort_period, period_type);
CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_recorded_at ON performance_metrics(recorded_at DESC);

-- Add updated_at triggers
CREATE TRIGGER update_ab_experiments_updated_at BEFORE UPDATE ON ab_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_cohorts_updated_at BEFORE UPDATE ON user_cohorts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cohort_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own analytics data
CREATE POLICY "Users can view own analytics events" ON user_analytics_events FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can view own learning analytics" ON learning_analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view own behavior patterns" ON user_behavior_patterns FOR SELECT USING (user_id = auth.uid());

-- Content analytics are viewable by authenticated users
CREATE POLICY "Authenticated users can view content analytics" ON content_analytics FOR SELECT TO authenticated USING (true);

-- A/B testing is managed by admins
CREATE POLICY "Admins can manage AB experiments" ON ab_experiments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Users can view their own A/B test assignments
CREATE POLICY "Users can view own AB test assignments" ON ab_test_assignments FOR SELECT USING (user_id = auth.uid());

-- Cohorts are managed by admins
CREATE POLICY "Admins can manage cohorts" ON user_cohorts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Performance metrics are viewable by admins
CREATE POLICY "Admins can view performance metrics" ON performance_metrics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Custom reports are viewable by creators and admins
CREATE POLICY "Users can view own reports" ON custom_reports FOR SELECT USING (
    created_by = auth.uid() OR 
    is_public = true OR
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Create function to track user events
CREATE OR REPLACE FUNCTION track_user_event(
    p_user_id UUID,
    p_session_id VARCHAR(255),
    p_event_type VARCHAR(100),
    p_event_name VARCHAR(200),
    p_properties JSONB DEFAULT '{}'::jsonb,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO user_analytics_events (
        user_id, session_id, event_type, event_name, properties,
        user_agent, ip_address, referrer, page_url
    )
    VALUES (
        p_user_id, p_session_id, p_event_type, p_event_name, p_properties,
        p_user_agent, p_ip_address, p_referrer, p_page_url
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track learning activity
CREATE OR REPLACE FUNCTION track_learning_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(100),
    p_lesson_id UUID DEFAULT NULL,
    p_story_id UUID DEFAULT NULL,
    p_performance_score DECIMAL(5,2) DEFAULT NULL,
    p_time_spent INTEGER DEFAULT NULL,
    p_completion_rate DECIMAL(5,2) DEFAULT NULL,
    p_difficulty_level VARCHAR(20) DEFAULT NULL,
    p_mistakes_count INTEGER DEFAULT 0,
    p_hints_used INTEGER DEFAULT 0,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    INSERT INTO learning_analytics (
        user_id, lesson_id, story_id, activity_type, performance_score,
        time_spent, completion_rate, difficulty_level, mistakes_count,
        hints_used, metadata
    )
    VALUES (
        p_user_id, p_lesson_id, p_story_id, p_activity_type, p_performance_score,
        p_time_spent, p_completion_rate, p_difficulty_level, p_mistakes_count,
        p_hints_used, p_metadata
    )
    RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update content analytics
CREATE OR REPLACE FUNCTION update_content_analytics(
    p_content_type VARCHAR(50),
    p_content_id UUID,
    p_metric_type VARCHAR(100),
    p_metric_value DECIMAL(15,2),
    p_aggregation_period VARCHAR(20) DEFAULT 'daily'
)
RETURNS VOID AS $$
DECLARE
    period_start_date DATE;
    period_end_date DATE;
BEGIN
    -- Calculate period dates based on aggregation period
    CASE p_aggregation_period
        WHEN 'daily' THEN
            period_start_date := CURRENT_DATE;
            period_end_date := CURRENT_DATE;
        WHEN 'weekly' THEN
            period_start_date := DATE_TRUNC('week', CURRENT_DATE)::DATE;
            period_end_date := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
        WHEN 'monthly' THEN
            period_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
            period_end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END CASE;
    
    -- Insert or update the metric
    INSERT INTO content_analytics (
        content_type, content_id, metric_type, metric_value,
        aggregation_period, period_start, period_end
    )
    VALUES (
        p_content_type, p_content_id, p_metric_type, p_metric_value,
        p_aggregation_period, period_start_date, period_end_date
    )
    ON CONFLICT (content_type, content_id, metric_type, aggregation_period, period_start)
    DO UPDATE SET
        metric_value = content_analytics.metric_value + p_metric_value,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate retention rates
CREATE OR REPLACE FUNCTION calculate_retention_rates(
    p_period_type VARCHAR(20) DEFAULT 'weekly'
)
RETURNS VOID AS $$
DECLARE
    cohort_record RECORD;
    period_interval INTERVAL;
    max_periods INTEGER;
BEGIN
    -- Set interval and max periods based on period type
    CASE p_period_type
        WHEN 'daily' THEN
            period_interval := INTERVAL '1 day';
            max_periods := 30; -- 30 days
        WHEN 'weekly' THEN
            period_interval := INTERVAL '1 week';
            max_periods := 12; -- 12 weeks
        WHEN 'monthly' THEN
            period_interval := INTERVAL '1 month';
            max_periods := 12; -- 12 months
    END CASE;
    
    -- Calculate retention for each cohort period
    FOR cohort_record IN 
        SELECT DATE_TRUNC(p_period_type, created_at)::DATE as cohort_date,
               COUNT(*) as total_users
        FROM auth.users
        WHERE created_at >= CURRENT_DATE - (max_periods * period_interval)
        GROUP BY DATE_TRUNC(p_period_type, created_at)::DATE
    LOOP
        -- Calculate retention for each period
        FOR period_num IN 1..max_periods LOOP
            INSERT INTO retention_analytics (
                cohort_period, period_number, period_type,
                total_users, retained_users, retention_rate
            )
            SELECT 
                cohort_record.cohort_date,
                period_num,
                p_period_type,
                cohort_record.total_users,
                COUNT(DISTINCT ua.user_id) as retained_users,
                (COUNT(DISTINCT ua.user_id)::DECIMAL / cohort_record.total_users * 100) as retention_rate
            FROM auth.users u
            LEFT JOIN user_analytics_events ua ON u.id = ua.user_id
                AND ua.timestamp >= cohort_record.cohort_date + (period_num * period_interval)
                AND ua.timestamp < cohort_record.cohort_date + ((period_num + 1) * period_interval)
            WHERE DATE_TRUNC(p_period_type, u.created_at)::DATE = cohort_record.cohort_date
            ON CONFLICT (cohort_period, period_number, period_type)
            DO UPDATE SET
                retained_users = EXCLUDED.retained_users,
                retention_rate = EXCLUDED.retention_rate,
                created_at = NOW();
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;