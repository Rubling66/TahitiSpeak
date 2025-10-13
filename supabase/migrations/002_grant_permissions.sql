-- Grant permissions for Interactive Polynesian Story System tables

-- Grant permissions to anon role (for public read access)
GRANT SELECT ON stories TO anon;
GRANT SELECT ON story_passages TO anon;
GRANT SELECT ON story_choices TO anon;
GRANT SELECT ON cultural_annotations TO anon;
GRANT SELECT ON story_discussions TO anon;
GRANT SELECT ON story_ratings TO anon;

-- Grant permissions to authenticated role (for full access)
GRANT ALL PRIVILEGES ON stories TO authenticated;
GRANT ALL PRIVILEGES ON story_passages TO authenticated;
GRANT ALL PRIVILEGES ON story_choices TO authenticated;
GRANT ALL PRIVILEGES ON cultural_annotations TO authenticated;
GRANT ALL PRIVILEGES ON user_story_progress TO authenticated;
GRANT ALL PRIVILEGES ON story_discussions TO authenticated;
GRANT ALL PRIVILEGES ON story_ratings TO authenticated;
GRANT ALL PRIVILEGES ON story_bookmarks TO authenticated;
GRANT ALL PRIVILEGES ON cultural_knowledge_points TO authenticated;