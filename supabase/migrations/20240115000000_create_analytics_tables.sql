-- Analytics and Reporting System Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analytics Events Table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    user_agent TEXT,
    ip_address INET,
    country VARCHAR(2),
    city VARCHAR(100),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- User Sessions Table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Analytics Table
CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID,
    exercise_id UUID,
    activity_type VARCHAR(50) NOT NULL, -- 'lesson_start', 'lesson_complete', 'exercise_attempt', etc.
    result JSONB DEFAULT '{}', -- score, time_taken, attempts, etc.
    difficulty_level VARCHAR(20),
    time_spent_seconds INTEGER,
    success_rate DECIMAL(5,2),
    mistakes_count INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Behavior Patterns Table
CREATE TABLE user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50) NOT NULL, -- 'study_time', 'difficulty_preference', 'learning_path', etc.
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL, -- 'daily_active_users', 'lesson_completion_rate', etc.
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    dimensions JSONB DEFAULT '{}', -- additional categorization data
    date_recorded DATE NOT NULL,
    hour_recorded INTEGER, -- 0-23 for hourly metrics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Test Results Table
CREATE TABLE ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(100) NOT NULL,
    variant VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversion_event VARCHAR(100),
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2),
    metadata JSONB DEFAULT '{}',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_at TIMESTAMP WITH TIME ZONE
);

-- User Engagement Scores Table
CREATE TABLE user_engagement_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    engagement_score DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    factors JSONB NOT NULL, -- breakdown of score factors
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Content Analytics Table
CREATE TABLE content_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL, -- 'lesson', 'exercise', 'story', etc.
    content_id UUID NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'views', 'completions', 'time_spent', etc.
    metric_value DECIMAL(15,4) NOT NULL,
    user_segment VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', etc.
    date_recorded DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Analytics Cache Table
CREATE TABLE analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(200) NOT NULL UNIQUE,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_start ON user_sessions(session_start);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

CREATE INDEX idx_learning_analytics_user_id ON learning_analytics(user_id);
CREATE INDEX idx_learning_analytics_lesson_id ON learning_analytics(lesson_id);
CREATE INDEX idx_learning_analytics_activity_type ON learning_analytics(activity_type);
CREATE INDEX idx_learning_analytics_created_at ON learning_analytics(created_at);

CREATE INDEX idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX idx_user_behavior_patterns_pattern_type ON user_behavior_patterns(pattern_type);

CREATE INDEX idx_performance_metrics_metric_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_date_recorded ON performance_metrics(date_recorded);

CREATE INDEX idx_ab_test_results_test_name ON ab_test_results(test_name);
CREATE INDEX idx_ab_test_results_user_id ON ab_test_results(user_id);

CREATE INDEX idx_user_engagement_scores_user_id ON user_engagement_scores(user_id);
CREATE INDEX idx_user_engagement_scores_calculated_at ON user_engagement_scores(calculated_at);

CREATE INDEX idx_content_analytics_content_type ON content_analytics(content_type);
CREATE INDEX idx_content_analytics_content_id ON content_analytics(content_id);
CREATE INDEX idx_content_analytics_date_recorded ON content_analytics(date_recorded);

CREATE INDEX idx_analytics_cache_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- Create composite indexes for common queries
CREATE INDEX idx_analytics_events_user_date ON analytics_events(user_id, created_at);
CREATE INDEX idx_learning_analytics_user_lesson ON learning_analytics(user_id, lesson_id);
CREATE INDEX idx_performance_metrics_type_date ON performance_metrics(metric_type, date_recorded);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Analytics Events Policies
CREATE POLICY "Users can view their own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all analytics events" ON analytics_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert analytics events" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Sessions Policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage their sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Learning Analytics Policies
CREATE POLICY "Users can view their own learning analytics" ON learning_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all learning analytics" ON learning_analytics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert learning analytics" ON learning_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Behavior Patterns Policies
CREATE POLICY "Users can view their own behavior patterns" ON user_behavior_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all behavior patterns" ON user_behavior_patterns
    FOR ALL USING (auth.role() = 'service_role');

-- Performance Metrics Policies (admin only)
CREATE POLICY "Service role can manage performance metrics" ON performance_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- A/B Test Results Policies
CREATE POLICY "Users can view their own A/B test results" ON ab_test_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all A/B test results" ON ab_test_results
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert A/B test results" ON ab_test_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Engagement Scores Policies
CREATE POLICY "Users can view their own engagement scores" ON user_engagement_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all engagement scores" ON user_engagement_scores
    FOR ALL USING (auth.role() = 'service_role');

-- Content Analytics Policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view content analytics" ON content_analytics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage content analytics" ON content_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Analytics Cache Policies (service role only)
CREATE POLICY "Service role can manage analytics cache" ON analytics_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON analytics_events TO anon, authenticated;
GRANT INSERT ON analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON learning_analytics TO authenticated;
GRANT SELECT ON user_behavior_patterns TO authenticated;
GRANT SELECT ON ab_test_results TO authenticated;
GRANT INSERT ON ab_test_results TO authenticated;
GRANT SELECT ON user_engagement_scores TO authenticated;
GRANT SELECT ON content_analytics TO authenticated;

-- Functions for analytics calculations

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_session_count INTEGER;
    v_avg_session_duration DECIMAL;
    v_lesson_completions INTEGER;
    v_total_events INTEGER;
BEGIN
    -- Get session metrics
    SELECT COUNT(*), AVG(duration_seconds)
    INTO v_session_count, v_avg_session_duration
    FROM user_sessions
    WHERE user_id = p_user_id
    AND session_start BETWEEN p_start_date AND p_end_date;

    -- Get learning metrics
    SELECT COUNT(*)
    INTO v_lesson_completions
    FROM learning_analytics
    WHERE user_id = p_user_id
    AND activity_type = 'lesson_complete'
    AND created_at BETWEEN p_start_date AND p_end_date;

    -- Get total events
    SELECT COUNT(*)
    INTO v_total_events
    FROM analytics_events
    WHERE user_id = p_user_id
    AND created_at BETWEEN p_start_date AND p_end_date;

    -- Calculate engagement score (0-100)
    v_score := LEAST(100, 
        (v_session_count * 10) + 
        (COALESCE(v_avg_session_duration, 0) / 60 * 2) + 
        (v_lesson_completions * 15) + 
        (v_total_events * 0.5)
    );

    RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update analytics cache
CREATE OR REPLACE FUNCTION update_analytics_cache(
    p_cache_key VARCHAR(200),
    p_cache_data JSONB,
    p_ttl_seconds INTEGER DEFAULT 3600
) RETURNS VOID AS $$
BEGIN
    INSERT INTO analytics_cache (cache_key, cache_data, expires_at)
    VALUES (p_cache_key, p_cache_data, NOW() + (p_ttl_seconds || ' seconds')::INTERVAL)
    ON CONFLICT (cache_key)
    DO UPDATE SET
        cache_data = EXCLUDED.cache_data,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get analytics cache
CREATE OR REPLACE FUNCTION get_analytics_cache(p_cache_key VARCHAR(200))
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT cache_data INTO v_result
    FROM analytics_cache
    WHERE cache_key = p_cache_key
    AND expires_at > NOW();

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_cache WHERE expires_at <= NOW();
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update session duration
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_duration
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_duration();

-- Create a trigger to update last_activity on sessions
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_sessions
    SET last_activity = NOW(),
        events_count = events_count + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();