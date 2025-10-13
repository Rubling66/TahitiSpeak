# Analytics API

The Analytics API provides comprehensive learning analytics, progress tracking, and performance insights for the TahitiSpeak platform.

## Endpoints

### Get Learning Analytics

```http
GET /api/analytics/learning
```

Retrieve comprehensive learning analytics for the authenticated user.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `month` | Time period (`day`, `week`, `month`, `quarter`, `year`, `all_time`) |
| `timezone` | string | `UTC` | Timezone for date calculations |
| `granularity` | string | `day` | Data granularity (`hour`, `day`, `week`) |
| `metrics` | string | `all` | Specific metrics (`progress`, `engagement`, `performance`) |

#### Response

```json
{
  "period": "month",
  "timezone": "Pacific/Tahiti",
  "summary": {
    "total_study_time": 1800,
    "lessons_completed": 24,
    "average_session_duration": 28.5,
    "streak_days": 15,
    "points_earned": 2400,
    "level_progression": 0.35,
    "pronunciation_accuracy": 0.78,
    "vocabulary_retention": 0.82,
    "cultural_engagement": 0.65
  },
  "daily_breakdown": [
    {
      "date": "2024-01-20",
      "study_time": 45,
      "lessons_completed": 2,
      "points_earned": 200,
      "pronunciation_accuracy": 0.85,
      "vocabulary_learned": 8,
      "cultural_stories_read": 1,
      "community_interactions": 3,
      "peak_focus_time": "14:30"
    },
    {
      "date": "2024-01-19",
      "study_time": 30,
      "lessons_completed": 1,
      "points_earned": 150,
      "pronunciation_accuracy": 0.72,
      "vocabulary_learned": 5,
      "cultural_stories_read": 0,
      "community_interactions": 1,
      "peak_focus_time": "19:15"
    }
  ],
  "category_performance": {
    "vocabulary": {
      "accuracy": 0.85,
      "retention": 0.78,
      "time_spent": 720,
      "words_learned": 45,
      "difficulty_progression": 0.6
    },
    "pronunciation": {
      "accuracy": 0.78,
      "improvement_rate": 0.12,
      "time_spent": 540,
      "attempts": 156,
      "perfect_pronunciations": 89
    },
    "grammar": {
      "accuracy": 0.72,
      "concepts_mastered": 12,
      "time_spent": 360,
      "exercises_completed": 34
    },
    "culture": {
      "engagement_score": 0.65,
      "stories_read": 8,
      "cultural_quizzes": 5,
      "time_spent": 180,
      "cultural_knowledge_score": 0.71
    }
  },
  "learning_patterns": {
    "optimal_study_time": "14:00-16:00",
    "preferred_session_length": 25,
    "most_productive_day": "Tuesday",
    "learning_style_indicators": {
      "visual": 0.7,
      "auditory": 0.8,
      "kinesthetic": 0.4
    },
    "difficulty_preference": "progressive",
    "break_frequency": 15
  },
  "achievements_progress": {
    "unlocked_this_period": 3,
    "points_from_achievements": 600,
    "next_milestone": {
      "achievement": "pronunciation_master",
      "progress": 0.78,
      "estimated_completion": "2024-02-05"
    }
  }
}
```

### Get Progress Tracking

```http
GET /api/analytics/progress
```

Retrieve detailed progress tracking across all learning areas.

#### Response

```json
{
  "overall_progress": {
    "current_level": "intermediate",
    "level_progress": 0.35,
    "estimated_completion": "2024-03-15",
    "total_completion": 0.42,
    "learning_velocity": 0.08
  },
  "skill_breakdown": {
    "listening": {
      "level": "intermediate",
      "progress": 0.65,
      "accuracy": 0.78,
      "recent_improvement": 0.12,
      "exercises_completed": 89,
      "time_invested": 1200
    },
    "speaking": {
      "level": "beginner_plus",
      "progress": 0.45,
      "accuracy": 0.72,
      "recent_improvement": 0.18,
      "pronunciation_score": 0.78,
      "fluency_score": 0.65,
      "confidence_level": 0.58
    },
    "reading": {
      "level": "intermediate",
      "progress": 0.55,
      "comprehension": 0.82,
      "reading_speed": 145,
      "vocabulary_recognition": 0.88,
      "cultural_texts_read": 12
    },
    "writing": {
      "level": "beginner",
      "progress": 0.25,
      "accuracy": 0.68,
      "grammar_score": 0.72,
      "vocabulary_usage": 0.65,
      "cultural_appropriateness": 0.78
    }
  },
  "lesson_progress": {
    "completed_lessons": 45,
    "total_lessons": 120,
    "completion_rate": 0.375,
    "average_score": 0.82,
    "mastery_level": {
      "beginner": 1.0,
      "intermediate": 0.35,
      "advanced": 0.0
    }
  },
  "vocabulary_progress": {
    "words_learned": 245,
    "words_mastered": 189,
    "retention_rate": 0.82,
    "daily_review_needed": 23,
    "categories": {
      "basic_conversation": 0.95,
      "family_relationships": 0.88,
      "nature_environment": 0.72,
      "cultural_traditions": 0.65,
      "modern_life": 0.45
    }
  },
  "cultural_knowledge": {
    "stories_completed": 18,
    "cultural_quizzes_passed": 12,
    "traditions_learned": 8,
    "historical_knowledge": 0.68,
    "modern_context_understanding": 0.72
  },
  "milestones": [
    {
      "id": "first_conversation",
      "title": "First Conversation",
      "description": "Complete a full conversation in Tahitian",
      "achieved": true,
      "achieved_at": "2023-12-15T14:30:00Z",
      "points": 500
    },
    {
      "id": "cultural_explorer",
      "title": "Cultural Explorer",
      "description": "Read 20 traditional stories",
      "achieved": false,
      "progress": 0.9,
      "estimated_completion": "2024-02-01"
    }
  ]
}
```

### Get Performance Insights

```http
GET /api/analytics/insights
```

Retrieve AI-powered learning insights and recommendations.

#### Response

```json
{
  "learning_insights": {
    "strengths": [
      {
        "area": "pronunciation",
        "score": 0.85,
        "description": "Excellent progress in pronunciation accuracy",
        "specific_skills": ["vowel_sounds", "rhythm_patterns"]
      },
      {
        "area": "cultural_understanding",
        "score": 0.78,
        "description": "Strong engagement with cultural content",
        "specific_skills": ["traditional_stories", "cultural_context"]
      }
    ],
    "improvement_areas": [
      {
        "area": "grammar",
        "score": 0.58,
        "description": "Grammar concepts need more practice",
        "specific_skills": ["verb_conjugation", "sentence_structure"],
        "recommended_actions": [
          "Focus on daily grammar exercises",
          "Practice with sentence building games",
          "Review verb conjugation patterns"
        ]
      }
    ],
    "learning_style_analysis": {
      "primary_style": "auditory",
      "secondary_style": "visual",
      "confidence": 0.82,
      "recommendations": [
        "Continue using audio-based exercises",
        "Incorporate more visual learning aids",
        "Try pronunciation practice with native speakers"
      ]
    }
  },
  "personalized_recommendations": [
    {
      "type": "lesson",
      "priority": "high",
      "title": "Grammar Fundamentals Review",
      "description": "Strengthen your grammar foundation with targeted exercises",
      "estimated_time": 30,
      "difficulty": "intermediate",
      "reason": "Based on recent performance patterns"
    },
    {
      "type": "practice",
      "priority": "medium",
      "title": "Pronunciation Practice Session",
      "description": "Maintain your excellent pronunciation skills",
      "estimated_time": 15,
      "difficulty": "intermediate",
      "reason": "Leverage your strength in pronunciation"
    },
    {
      "type": "cultural",
      "priority": "medium",
      "title": "Traditional Fishing Stories",
      "description": "Explore stories about traditional Polynesian fishing",
      "estimated_time": 20,
      "difficulty": "intermediate",
      "reason": "Matches your cultural interests"
    }
  ],
  "optimal_schedule": {
    "best_study_times": [
      {
        "time": "14:00-16:00",
        "effectiveness": 0.92,
        "type": "peak_focus"
      },
      {
        "time": "19:00-20:00",
        "effectiveness": 0.78,
        "type": "review_session"
      }
    ],
    "recommended_session_length": 25,
    "break_intervals": 15,
    "weekly_schedule": {
      "monday": { "focus": "vocabulary", "duration": 30 },
      "tuesday": { "focus": "pronunciation", "duration": 25 },
      "wednesday": { "focus": "grammar", "duration": 35 },
      "thursday": { "focus": "cultural", "duration": 20 },
      "friday": { "focus": "conversation", "duration": 30 },
      "weekend": { "focus": "review", "duration": 20 }
    }
  },
  "motivation_insights": {
    "engagement_level": 0.78,
    "streak_motivation": 0.85,
    "achievement_drive": 0.72,
    "social_learning_preference": 0.65,
    "motivational_factors": [
      "Achievement unlocking",
      "Cultural discovery",
      "Progress visualization",
      "Community interaction"
    ],
    "risk_factors": [
      "Grammar difficulty frustration",
      "Session length fatigue"
    ]
  }
}
```

### Get Comparative Analytics

```http
GET /api/analytics/comparative
```

Compare user performance with anonymized peer data.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `level` | string | `current` | Compare with users at specific level |
| `timeframe` | string | `month` | Comparison timeframe |
| `anonymous` | boolean | true | Anonymize comparison data |

#### Response

```json
{
  "user_percentile": {
    "overall": 0.78,
    "study_time": 0.85,
    "lesson_completion": 0.72,
    "pronunciation_accuracy": 0.88,
    "cultural_engagement": 0.65
  },
  "peer_comparison": {
    "level_cohort": "intermediate",
    "cohort_size": 1247,
    "user_rank": 274,
    "metrics": {
      "average_study_time": {
        "user": 1800,
        "peer_average": 1450,
        "percentile": 0.85
      },
      "lesson_completion_rate": {
        "user": 0.82,
        "peer_average": 0.76,
        "percentile": 0.72
      },
      "pronunciation_accuracy": {
        "user": 0.78,
        "peer_average": 0.68,
        "percentile": 0.88
      },
      "vocabulary_retention": {
        "user": 0.82,
        "peer_average": 0.74,
        "percentile": 0.79
      }
    }
  },
  "achievement_comparison": {
    "achievements_unlocked": {
      "user": 12,
      "peer_average": 9.5,
      "percentile": 0.76
    },
    "rare_achievements": {
      "user": 2,
      "peer_average": 0.8,
      "percentile": 0.95
    }
  },
  "learning_velocity": {
    "user_progression_rate": 0.08,
    "peer_average_rate": 0.06,
    "estimated_completion": {
      "user": "2024-03-15",
      "peer_average": "2024-04-20"
    }
  },
  "strengths_relative_to_peers": [
    {
      "area": "pronunciation",
      "advantage": 0.15,
      "description": "Significantly above peer average"
    },
    {
      "area": "study_consistency",
      "advantage": 0.12,
      "description": "More consistent study habits"
    }
  ],
  "improvement_opportunities": [
    {
      "area": "grammar",
      "gap": -0.08,
      "description": "Below peer average, focus area identified"
    }
  ]
}
```

### Get Cultural Analytics

```http
GET /api/analytics/cultural
```

Retrieve analytics specific to cultural learning and engagement.

#### Response

```json
{
  "cultural_engagement": {
    "overall_score": 0.72,
    "stories_engagement": 0.85,
    "traditions_learning": 0.68,
    "modern_context": 0.65,
    "community_participation": 0.58
  },
  "cultural_knowledge_areas": {
    "traditional_stories": {
      "stories_read": 18,
      "comprehension_score": 0.82,
      "favorite_themes": ["nature", "family", "heroism"],
      "time_spent": 540,
      "retention_rate": 0.88
    },
    "historical_context": {
      "periods_studied": ["pre_european", "colonial", "modern"],
      "knowledge_score": 0.68,
      "timeline_understanding": 0.75,
      "cultural_impact_awareness": 0.72
    },
    "traditions_and_customs": {
      "traditions_learned": 12,
      "practical_application": 0.65,
      "cultural_sensitivity_score": 0.89,
      "modern_relevance_understanding": 0.71
    },
    "language_in_culture": {
      "cultural_expressions_learned": 34,
      "context_appropriate_usage": 0.78,
      "ceremonial_language": 0.45,
      "everyday_cultural_phrases": 0.85
    }
  },
  "regional_focus": {
    "society_islands": {
      "knowledge_level": 0.78,
      "stories_from_region": 12,
      "cultural_specifics": 0.72
    },
    "marquesas": {
      "knowledge_level": 0.45,
      "stories_from_region": 3,
      "cultural_specifics": 0.38
    },
    "tuamotu": {
      "knowledge_level": 0.32,
      "stories_from_region": 1,
      "cultural_specifics": 0.25
    }
  },
  "cultural_learning_patterns": {
    "preferred_content_types": [
      { "type": "traditional_stories", "engagement": 0.92 },
      { "type": "cultural_videos", "engagement": 0.78 },
      { "type": "historical_articles", "engagement": 0.65 }
    ],
    "learning_progression": {
      "basic_cultural_awareness": 1.0,
      "traditional_knowledge": 0.78,
      "modern_cultural_context": 0.65,
      "cultural_nuances": 0.42
    }
  },
  "cultural_milestones": [
    {
      "milestone": "cultural_foundation",
      "achieved": true,
      "description": "Understanding basic Polynesian cultural concepts"
    },
    {
      "milestone": "story_explorer",
      "achieved": true,
      "description": "Read 15 traditional stories"
    },
    {
      "milestone": "cultural_ambassador",
      "achieved": false,
      "progress": 0.68,
      "description": "Demonstrate deep cultural understanding"
    }
  ]
}
```

### Export Analytics Data

```http
GET /api/analytics/export
```

Export comprehensive analytics data for external analysis.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `json` | Export format (`json`, `csv`, `xlsx`) |
| `period` | string | `all_time` | Data period to export |
| `include` | string | `all` | Data categories to include |

#### Response

```json
{
  "export_id": "export_123456",
  "format": "json",
  "status": "processing",
  "estimated_completion": "2024-01-20T17:05:00Z",
  "download_url": null,
  "expires_at": "2024-01-27T17:00:00Z",
  "data_categories": [
    "learning_progress",
    "performance_metrics",
    "cultural_engagement",
    "achievement_history",
    "study_patterns"
  ]
}
```

### Get Real-time Analytics

```http
GET /api/analytics/realtime
```

Retrieve real-time learning session analytics.

#### Response

```json
{
  "current_session": {
    "session_id": "session_789",
    "start_time": "2024-01-20T16:30:00Z",
    "duration": 1200,
    "activity_type": "lesson",
    "lesson_id": "lesson_vocab_family",
    "progress": 0.65,
    "performance_metrics": {
      "accuracy": 0.82,
      "response_time": 2.3,
      "focus_score": 0.78,
      "difficulty_adaptation": 0.15
    }
  },
  "live_metrics": {
    "words_per_minute": 45,
    "pronunciation_attempts": 12,
    "correct_pronunciations": 9,
    "vocabulary_retention": 0.85,
    "engagement_level": 0.88
  },
  "adaptive_recommendations": [
    {
      "type": "difficulty_adjustment",
      "suggestion": "increase_difficulty",
      "confidence": 0.82,
      "reason": "High accuracy rate suggests readiness for harder content"
    },
    {
      "type": "break_suggestion",
      "suggestion": "short_break",
      "confidence": 0.65,
      "reason": "Focus score declining, 5-minute break recommended"
    }
  ],
  "session_predictions": {
    "estimated_completion_time": "2024-01-20T17:15:00Z",
    "predicted_final_score": 0.84,
    "mastery_likelihood": 0.78
  }
}
```

## WebSocket Events

### Real-time Analytics Updates

```javascript
// Subscribe to analytics events
socket.emit('subscribe', { channel: 'analytics' });

// Real-time progress updates
socket.on('analytics:progress_update', (data) => {
  console.log('Progress updated:', data.metric, data.value);
});

// Achievement unlocked
socket.on('analytics:achievement_unlocked', (data) => {
  console.log('Achievement unlocked:', data.achievement);
});

// Performance milestone reached
socket.on('analytics:milestone_reached', (data) => {
  console.log('Milestone reached:', data.milestone);
});

// Adaptive learning recommendations
socket.on('analytics:recommendation', (data) => {
  console.log('New recommendation:', data.recommendation);
});
```

## Error Responses

### Insufficient Data Error

```json
{
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "Not enough learning data for meaningful analytics",
    "minimum_requirements": {
      "lessons_completed": 5,
      "study_time": 300,
      "days_active": 3
    },
    "current_status": {
      "lessons_completed": 2,
      "study_time": 120,
      "days_active": 1
    }
  }
}
```

### Export Processing Error

```json
{
  "error": {
    "code": "EXPORT_FAILED",
    "message": "Data export processing failed",
    "export_id": "export_123456",
    "retry_available": true,
    "estimated_retry_time": "2024-01-20T17:30:00Z"
  }
}
```

## Rate Limits

- **Analytics queries**: 100 requests per hour
- **Real-time analytics**: 500 requests per hour
- **Data exports**: 5 exports per day
- **Comparative analytics**: 50 requests per hour

## Privacy and Data Protection

### Data Anonymization

- **Peer Comparisons**: All comparative data is anonymized
- **Aggregate Statistics**: Individual data is never exposed in aggregates
- **Export Controls**: Personal data exports require additional authentication
- **Retention Policies**: Analytics data follows strict retention guidelines

### GDPR Compliance

- **Data Portability**: Full analytics data export available
- **Right to Deletion**: Complete analytics data removal on request
- **Consent Management**: Granular consent for different analytics features
- **Data Minimization**: Only necessary analytics data is collected

## Examples

### JavaScript SDK Usage

```javascript
import { TahitiSpeakClient } from '@tahitispeak/sdk';

const client = new TahitiSpeakClient({ token: 'your-jwt-token' });

// Get comprehensive learning analytics
const analytics = await client.analytics.getLearningAnalytics({
  period: 'month',
  timezone: 'Pacific/Tahiti'
});

// Get AI-powered insights
const insights = await client.analytics.getInsights();

// Compare with peers
const comparison = await client.analytics.getComparative({
  level: 'intermediate',
  timeframe: 'month'
});

// Export data
const exportRequest = await client.analytics.exportData({
  format: 'json',
  period: 'all_time'
});

// Real-time session analytics
const realtimeData = await client.analytics.getRealtime();
```

### Python SDK Usage

```python
from tahitispeak import TahitiSpeakClient

client = TahitiSpeakClient(token='your-jwt-token')

# Get learning progress
progress = client.analytics.get_progress()

# Get cultural analytics
cultural_data = client.analytics.get_cultural_analytics()

# Get performance insights
insights = client.analytics.get_insights()

# Export analytics data
export_request = client.analytics.export_data(
    format='csv',
    period='year',
    include=['learning_progress', 'cultural_engagement']
)
```

### Real-time Analytics Dashboard

```javascript
// Set up real-time analytics dashboard
const socket = io('wss://api.tahitispeak.com');

socket.emit('subscribe', { channel: 'analytics' });

// Update dashboard with real-time data
socket.on('analytics:progress_update', (data) => {
  updateProgressChart(data);
});

socket.on('analytics:achievement_unlocked', (data) => {
  showAchievementNotification(data.achievement);
});

socket.on('analytics:recommendation', (data) => {
  displayRecommendation(data.recommendation);
});
```