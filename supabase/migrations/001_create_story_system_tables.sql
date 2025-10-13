-- Interactive Polynesian Story System Database Schema
-- This migration creates all necessary tables for the story system

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('legend', 'mythology', 'history', 'folklore', 'creation', 'adventure')),
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER NOT NULL, -- in minutes
    cultural_region TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'tahitian',
    cover_image_url TEXT,
    author_id UUID,
    is_published BOOLEAN DEFAULT false,
    cultural_authenticity_score INTEGER DEFAULT 0 CHECK (cultural_authenticity_score >= 0 AND cultural_authenticity_score <= 100),
    total_passages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_passages table for branching narratives
CREATE TABLE IF NOT EXISTS story_passages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    passage_number INTEGER NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    audio_url TEXT,
    image_url TEXT,
    is_starting_passage BOOLEAN DEFAULT false,
    is_ending_passage BOOLEAN DEFAULT false,
    cultural_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, passage_number)
);

-- Create story_choices table for branching decisions
CREATE TABLE IF NOT EXISTS story_choices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_passage_id UUID NOT NULL REFERENCES story_passages(id) ON DELETE CASCADE,
    to_passage_id UUID NOT NULL REFERENCES story_passages(id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    choice_description TEXT,
    cultural_significance TEXT,
    choice_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cultural_annotations table
CREATE TABLE IF NOT EXISTS cultural_annotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    passage_id UUID REFERENCES story_passages(id) ON DELETE CASCADE,
    annotation_type TEXT NOT NULL CHECK (annotation_type IN ('cultural_context', 'historical_fact', 'language_note', 'tradition', 'symbol', 'location')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    highlighted_text TEXT,
    position_start INTEGER,
    position_end INTEGER,
    media_url TEXT,
    external_links JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_story_progress table
CREATE TABLE IF NOT EXISTS user_story_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    current_passage_id UUID REFERENCES story_passages(id),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    is_completed BOOLEAN DEFAULT false,
    cultural_knowledge_gained INTEGER DEFAULT 0,
    choices_made JSONB DEFAULT '[]',
    annotations_viewed JSONB DEFAULT '[]',
    time_spent INTEGER DEFAULT 0, -- in minutes
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- Create story_discussions table for community engagement
CREATE TABLE IF NOT EXISTS story_discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES story_discussions(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    discussion_type TEXT NOT NULL CHECK (discussion_type IN ('question', 'insight', 'cultural_note', 'interpretation', 'general')),
    is_pinned BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_ratings table
CREATE TABLE IF NOT EXISTS story_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    cultural_accuracy_rating INTEGER CHECK (cultural_accuracy_rating >= 1 AND cultural_accuracy_rating <= 5),
    educational_value_rating INTEGER CHECK (educational_value_rating >= 1 AND educational_value_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- Create story_bookmarks table
CREATE TABLE IF NOT EXISTS story_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    passage_id UUID REFERENCES story_passages(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, story_id, passage_id)
);

-- Create cultural_knowledge_points table
CREATE TABLE IF NOT EXISTS cultural_knowledge_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    annotation_id UUID NOT NULL REFERENCES cultural_annotations(id) ON DELETE CASCADE,
    points_earned INTEGER DEFAULT 1,
    knowledge_category TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, annotation_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_difficulty ON stories(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_cultural_region ON stories(cultural_region);
CREATE INDEX IF NOT EXISTS idx_story_passages_story_id ON story_passages(story_id);
CREATE INDEX IF NOT EXISTS idx_story_passages_number ON story_passages(story_id, passage_number);
CREATE INDEX IF NOT EXISTS idx_story_choices_from_passage ON story_choices(from_passage_id);
CREATE INDEX IF NOT EXISTS idx_cultural_annotations_story ON cultural_annotations(story_id);
CREATE INDEX IF NOT EXISTS idx_cultural_annotations_passage ON cultural_annotations(passage_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_story_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_story_id ON user_story_progress(story_id);
CREATE INDEX IF NOT EXISTS idx_story_discussions_story_id ON story_discussions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_discussions_user_id ON story_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_discussions_parent ON story_discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_story_ratings_story_id ON story_ratings(story_id);
CREATE INDEX IF NOT EXISTS idx_story_bookmarks_user_id ON story_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_user ON cultural_knowledge_points(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_knowledge_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stories (public read for published stories)
CREATE POLICY "Published stories are viewable by everyone" ON stories
    FOR SELECT USING (is_published = true);

CREATE POLICY "Authors can view their own stories" ON stories
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can update their own stories" ON stories
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create stories" ON stories
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Create RLS policies for story_passages
CREATE POLICY "Story passages are viewable if story is accessible" ON story_passages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = story_passages.story_id 
            AND (stories.is_published = true OR stories.author_id = auth.uid())
        )
    );

CREATE POLICY "Authors can manage their story passages" ON story_passages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = story_passages.story_id 
            AND stories.author_id = auth.uid()
        )
    );

-- Create RLS policies for story_choices
CREATE POLICY "Story choices are viewable if story is accessible" ON story_choices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM story_passages sp
            JOIN stories s ON s.id = sp.story_id
            WHERE sp.id = story_choices.from_passage_id 
            AND (s.is_published = true OR s.author_id = auth.uid())
        )
    );

-- Create RLS policies for cultural_annotations
CREATE POLICY "Cultural annotations are viewable if story is accessible" ON cultural_annotations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = cultural_annotations.story_id 
            AND (stories.is_published = true OR stories.author_id = auth.uid())
        )
    );

-- Create RLS policies for user_story_progress
CREATE POLICY "Users can view their own progress" ON user_story_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_story_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" ON user_story_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for story_discussions
CREATE POLICY "Story discussions are viewable if story is accessible" ON story_discussions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = story_discussions.story_id 
            AND (stories.is_published = true OR stories.author_id = auth.uid())
        )
    );

CREATE POLICY "Authenticated users can create discussions" ON story_discussions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussions" ON story_discussions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for story_ratings
CREATE POLICY "Story ratings are viewable if story is accessible" ON story_ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = story_ratings.story_id 
            AND stories.is_published = true
        )
    );

CREATE POLICY "Users can manage their own ratings" ON story_ratings
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for story_bookmarks
CREATE POLICY "Users can manage their own bookmarks" ON story_bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for cultural_knowledge_points
CREATE POLICY "Users can view their own knowledge points" ON cultural_knowledge_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can award knowledge points" ON cultural_knowledge_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_passages_updated_at BEFORE UPDATE ON story_passages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_annotations_updated_at BEFORE UPDATE ON cultural_annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_story_progress_updated_at BEFORE UPDATE ON user_story_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_discussions_updated_at BEFORE UPDATE ON story_discussions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_ratings_updated_at BEFORE UPDATE ON story_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();