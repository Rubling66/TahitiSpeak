# Community API

The Community API enables social learning features, cultural discussions, and collaborative learning experiences within the TahitiSpeak platform.

## Endpoints

### Get Community Feed

```http
GET /api/community/feed
```

Retrieve the personalized community activity feed.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `all` | Feed type (`all`, `following`, `cultural`, `achievements`) |
| `limit` | integer | 20 | Number of posts (max 50) |
| `offset` | integer | 0 | Pagination offset |
| `since` | string | - | ISO timestamp for newer posts |

#### Response

```json
{
  "posts": [
    {
      "id": "post_123",
      "type": "achievement",
      "user": {
        "id": "user_456",
        "username": "marie_tahiti",
        "display_name": "Marie D.",
        "avatar_url": "https://cdn.tahitispeak.com/avatars/user_456.jpg",
        "level": "intermediate"
      },
      "content": {
        "achievement": {
          "id": "culture_explorer",
          "title": "Culture Explorer",
          "description": "Read 10 cultural stories",
          "icon": "🌺",
          "points": 200
        },
        "message": "Just unlocked Culture Explorer! The stories about traditional Tahitian fishing are fascinating! 🐟"
      },
      "engagement": {
        "likes": 15,
        "comments": 3,
        "shares": 2,
        "user_liked": false,
        "user_bookmarked": true
      },
      "cultural_context": {
        "tags": ["traditional_fishing", "polynesian_culture"],
        "region": "Society_Islands",
        "language_focus": "tahitian"
      },
      "created_at": "2024-01-20T14:30:00Z",
      "updated_at": "2024-01-20T15:45:00Z"
    },
    {
      "id": "post_124",
      "type": "discussion",
      "user": {
        "id": "user_789",
        "username": "pierre_learning",
        "display_name": "Pierre M.",
        "avatar_url": "https://cdn.tahitispeak.com/avatars/user_789.jpg",
        "level": "beginner"
      },
      "content": {
        "text": "Can someone help me understand the difference between 'ia ora na' and 'maeva'? Both seem to be greetings but I'm confused about when to use each one.",
        "media": [],
        "lesson_reference": {
          "id": "lesson_greetings_01",
          "title": "Basic Tahitian Greetings"
        }
      },
      "engagement": {
        "likes": 8,
        "comments": 12,
        "shares": 1,
        "user_liked": true,
        "user_bookmarked": false
      },
      "cultural_context": {
        "tags": ["greetings", "basic_vocabulary", "cultural_etiquette"],
        "difficulty": "beginner",
        "language_focus": "tahitian"
      },
      "created_at": "2024-01-20T12:15:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "has_more": true
  },
  "trending_topics": [
    {
      "tag": "traditional_music",
      "post_count": 23,
      "growth": 0.15
    },
    {
      "tag": "pronunciation_tips",
      "post_count": 18,
      "growth": 0.08
    }
  ]
}
```

### Create Community Post

```http
POST /api/community/posts
```

Create a new community post or discussion.

#### Request Body

```json
{
  "type": "discussion",
  "content": {
    "text": "Just learned about the traditional Tahitian dance 'Ori Tahiti'. The hip movements are so expressive! Any tips for beginners?",
    "media": [
      {
        "type": "image",
        "url": "https://cdn.tahitispeak.com/uploads/dance_photo.jpg",
        "caption": "Traditional Ori Tahiti performance"
      }
    ],
    "lesson_reference": {
      "id": "lesson_culture_dance_01"
    }
  },
  "cultural_context": {
    "tags": ["traditional_dance", "ori_tahiti", "cultural_expression"],
    "region": "Society_Islands",
    "difficulty": "beginner"
  },
  "visibility": "public"
}
```

#### Response

```json
{
  "id": "post_125",
  "type": "discussion",
  "user": {
    "id": "user_123",
    "username": "current_user",
    "display_name": "You",
    "avatar_url": "https://cdn.tahitispeak.com/avatars/user_123.jpg"
  },
  "content": {
    "text": "Just learned about the traditional Tahitian dance 'Ori Tahiti'. The hip movements are so expressive! Any tips for beginners?",
    "media": [
      {
        "type": "image",
        "url": "https://cdn.tahitispeak.com/uploads/dance_photo.jpg",
        "caption": "Traditional Ori Tahiti performance"
      }
    ]
  },
  "engagement": {
    "likes": 0,
    "comments": 0,
    "shares": 0,
    "user_liked": false,
    "user_bookmarked": false
  },
  "created_at": "2024-01-20T16:30:00Z",
  "status": "published"
}
```

### Get Post Details

```http
GET /api/community/posts/{post_id}
```

Retrieve detailed information about a specific post.

#### Response

```json
{
  "id": "post_123",
  "type": "discussion",
  "user": {
    "id": "user_456",
    "username": "marie_tahiti",
    "display_name": "Marie D.",
    "avatar_url": "https://cdn.tahitispeak.com/avatars/user_456.jpg",
    "level": "intermediate",
    "cultural_background": "French-Polynesian"
  },
  "content": {
    "text": "Can someone help me understand the difference between 'ia ora na' and 'maeva'?",
    "media": [],
    "lesson_reference": {
      "id": "lesson_greetings_01",
      "title": "Basic Tahitian Greetings",
      "url": "/lessons/greetings-01"
    }
  },
  "engagement": {
    "likes": 15,
    "comments": 8,
    "shares": 2,
    "user_liked": false,
    "user_bookmarked": true
  },
  "cultural_context": {
    "tags": ["greetings", "basic_vocabulary"],
    "region": "Society_Islands",
    "difficulty": "beginner",
    "cultural_notes": "Understanding greeting contexts is essential for respectful communication in Polynesian culture."
  },
  "comments": [
    {
      "id": "comment_456",
      "user": {
        "id": "user_789",
        "username": "cultural_expert",
        "display_name": "Teiva M.",
        "avatar_url": "https://cdn.tahitispeak.com/avatars/user_789.jpg",
        "badges": ["cultural_expert", "native_speaker"]
      },
      "content": "'Ia ora na' is more formal and used throughout the day, while 'maeva' is specifically for welcoming someone. Think of 'maeva' as 'welcome' and 'ia ora na' as 'hello/good day'.",
      "likes": 12,
      "user_liked": true,
      "created_at": "2024-01-20T13:00:00Z",
      "cultural_validation": {
        "verified": true,
        "expert_approved": true
      }
    }
  ],
  "created_at": "2024-01-20T12:15:00Z",
  "updated_at": "2024-01-20T15:30:00Z"
}
```

### Like/Unlike Post

```http
POST /api/community/posts/{post_id}/like
```

Like or unlike a community post.

#### Response

```json
{
  "liked": true,
  "total_likes": 16,
  "user_liked": true
}
```

### Add Comment

```http
POST /api/community/posts/{post_id}/comments
```

Add a comment to a community post.

#### Request Body

```json
{
  "content": "Great explanation! I've been wondering about this too. The cultural context really helps understand when to use each greeting.",
  "reply_to": "comment_456"
}
```

#### Response

```json
{
  "id": "comment_789",
  "user": {
    "id": "user_123",
    "username": "current_user",
    "display_name": "You",
    "avatar_url": "https://cdn.tahitispeak.com/avatars/user_123.jpg"
  },
  "content": "Great explanation! I've been wondering about this too. The cultural context really helps understand when to use each greeting.",
  "likes": 0,
  "user_liked": false,
  "reply_to": {
    "id": "comment_456",
    "user": "Teiva M."
  },
  "created_at": "2024-01-20T16:45:00Z"
}
```

### Get Study Groups

```http
GET /api/community/groups
```

Retrieve available study groups and learning communities.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `all` | Group type (`study`, `cultural`, `practice`) |
| `level` | string | - | Filter by learning level |
| `topic` | string | - | Filter by topic/interest |
| `size` | string | - | Group size (`small`, `medium`, `large`) |

#### Response

```json
{
  "groups": [
    {
      "id": "group_123",
      "name": "Tahitian Culture Enthusiasts",
      "description": "A community for learners passionate about Polynesian culture, traditions, and language.",
      "type": "cultural",
      "level": "all_levels",
      "topics": ["culture", "traditions", "history", "language"],
      "member_count": 156,
      "activity_level": "high",
      "privacy": "public",
      "cover_image": "https://cdn.tahitispeak.com/groups/culture_enthusiasts.jpg",
      "moderators": [
        {
          "id": "user_456",
          "username": "teiva_cultural",
          "display_name": "Teiva M.",
          "badges": ["cultural_expert", "native_speaker"]
        }
      ],
      "recent_activity": {
        "posts_this_week": 23,
        "new_members_this_week": 8,
        "last_post": "2024-01-20T15:30:00Z"
      },
      "created_at": "2023-08-15T10:00:00Z"
    },
    {
      "id": "group_124",
      "name": "Beginner Study Circle",
      "description": "Support group for beginners learning Tahitian. Practice together, share tips, and encourage each other!",
      "type": "study",
      "level": "beginner",
      "topics": ["vocabulary", "pronunciation", "basic_grammar"],
      "member_count": 45,
      "activity_level": "medium",
      "privacy": "public",
      "study_schedule": {
        "weekly_sessions": 2,
        "session_duration": 60,
        "timezone": "Pacific/Tahiti"
      },
      "created_at": "2023-11-01T14:00:00Z"
    }
  ],
  "user_groups": [
    {
      "id": "group_123",
      "role": "member",
      "joined_at": "2023-12-01T10:00:00Z"
    }
  ],
  "recommended_groups": [
    {
      "id": "group_125",
      "name": "Pronunciation Practice",
      "match_score": 0.85,
      "reason": "Based on your learning goals and current level"
    }
  ]
}
```

### Join Study Group

```http
POST /api/community/groups/{group_id}/join
```

Join a study group or learning community.

#### Request Body

```json
{
  "message": "I'm excited to learn about Tahitian culture and connect with other learners!",
  "learning_goals": ["cultural_understanding", "conversational_fluency"]
}
```

#### Response

```json
{
  "joined": true,
  "group": {
    "id": "group_123",
    "name": "Tahitian Culture Enthusiasts",
    "role": "member"
  },
  "welcome_message": "Welcome to Tahitian Culture Enthusiasts! Please introduce yourself in the welcome thread.",
  "joined_at": "2024-01-20T16:50:00Z"
}
```

### Get Cultural Stories

```http
GET /api/community/stories
```

Retrieve cultural stories and traditional content shared by the community.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | `all` | Story category (`legends`, `history`, `traditions`, `modern`) |
| `region` | string | - | Polynesian region filter |
| `difficulty` | string | - | Language difficulty level |
| `featured` | boolean | false | Show only featured stories |

#### Response

```json
{
  "stories": [
    {
      "id": "story_123",
      "title": "The Legend of Maui and the Sun",
      "subtitle": "Te Parau no Maui e te Ra",
      "category": "legends",
      "region": "Society_Islands",
      "difficulty": "intermediate",
      "author": {
        "id": "user_cultural_expert",
        "display_name": "Teiva Manutahi",
        "credentials": "Cultural Historian",
        "verified": true
      },
      "content": {
        "summary": "The famous Polynesian legend of how Maui slowed down the sun to give people more daylight hours.",
        "reading_time": 8,
        "word_count": 450,
        "language_mix": {
          "english": 0.7,
          "tahitian": 0.3
        }
      },
      "cultural_context": {
        "historical_period": "pre_european",
        "cultural_significance": "high",
        "themes": ["heroism", "nature", "family"],
        "learning_objectives": [
          "Understanding Polynesian mythology",
          "Learning traditional storytelling patterns",
          "Vocabulary related to nature and time"
        ]
      },
      "engagement": {
        "reads": 1250,
        "likes": 89,
        "bookmarks": 156,
        "discussions": 23
      },
      "media": {
        "cover_image": "https://cdn.tahitispeak.com/stories/maui_sun.jpg",
        "audio_narration": "https://cdn.tahitispeak.com/audio/maui_legend.mp3",
        "illustrations": [
          "https://cdn.tahitispeak.com/stories/maui_1.jpg",
          "https://cdn.tahitispeak.com/stories/maui_2.jpg"
        ]
      },
      "published_at": "2024-01-15T10:00:00Z",
      "featured": true
    }
  ],
  "categories": [
    {
      "name": "legends",
      "display_name": "Traditional Legends",
      "story_count": 45,
      "icon": "🌟"
    },
    {
      "name": "history",
      "display_name": "Historical Accounts",
      "story_count": 32,
      "icon": "📚"
    }
  ],
  "featured_story": {
    "id": "story_124",
    "title": "Modern Tahitian Life",
    "reason": "Trending this week"
  }
}
```

### Report Content

```http
POST /api/community/report
```

Report inappropriate content or cultural inaccuracies.

#### Request Body

```json
{
  "content_type": "post",
  "content_id": "post_123",
  "reason": "cultural_inaccuracy",
  "description": "The information about traditional greetings contains inaccuracies that could mislead learners.",
  "cultural_context": {
    "specific_issue": "Incorrect usage context for 'maeva'",
    "suggested_correction": "Maeva is primarily used for welcoming guests, not as a general greeting"
  }
}
```

#### Response

```json
{
  "report_id": "report_456",
  "status": "submitted",
  "review_timeline": "24-48 hours",
  "cultural_review": true,
  "submitted_at": "2024-01-20T17:00:00Z"
}
```

## WebSocket Events

### Real-time Community Updates

```javascript
// Subscribe to community events
socket.emit('subscribe', { channel: 'community' });

// New post in followed groups
socket.on('community:new_post', (data) => {
  console.log('New post:', data.post);
});

// Live discussion updates
socket.on('community:post_updated', (data) => {
  console.log('Post updated:', data.post_id, data.changes);
});

// Cultural expert responses
socket.on('community:expert_response', (data) => {
  console.log('Expert answered:', data.post_id, data.comment);
});
```

## Error Responses

### Content Moderation Error

```json
{
  "error": {
    "code": "CONTENT_MODERATED",
    "message": "Content requires cultural review",
    "details": {
      "reason": "potential_cultural_sensitivity",
      "review_required": true,
      "estimated_review_time": "2-4 hours"
    }
  }
}
```

### Group Access Error

```json
{
  "error": {
    "code": "GROUP_ACCESS_DENIED",
    "message": "Cannot join private group",
    "group_id": "group_456",
    "requirements": {
      "invitation_required": true,
      "minimum_level": "intermediate"
    }
  }
}
```

## Rate Limits

- **Post creation**: 10 posts per hour
- **Comments**: 50 comments per hour
- **Likes/reactions**: 200 per hour
- **Group joins**: 5 per day
- **Reports**: 10 per day

## Cultural Guidelines

### Content Standards

- **Cultural Accuracy**: All cultural content is reviewed by native speakers
- **Respectful Discourse**: Community guidelines enforce respectful communication
- **Educational Focus**: Content should contribute to learning and understanding
- **Source Attribution**: Traditional stories and cultural content must be properly attributed

### Moderation

- **Expert Review**: Cultural content is reviewed by verified cultural experts
- **Community Reporting**: Users can report inaccuracies or inappropriate content
- **Educational Corrections**: Incorrect information is corrected with educational context
- **Cultural Sensitivity**: Special attention to sacred or sensitive cultural topics

## Examples

### JavaScript SDK Usage

```javascript
import { TahitiSpeakClient } from '@tahitispeak/sdk';

const client = new TahitiSpeakClient({ token: 'your-jwt-token' });

// Get community feed
const feed = await client.community.getFeed({
  type: 'cultural',
  limit: 10
});

// Create a discussion post
const post = await client.community.createPost({
  type: 'discussion',
  content: {
    text: 'What are your favorite Tahitian phrases for expressing gratitude?',
    tags: ['vocabulary', 'gratitude', 'daily_expressions']
  }
});

// Join a study group
await client.community.joinGroup('group_123', {
  message: 'Excited to learn with everyone!'
});

// Get cultural stories
const stories = await client.community.getStories({
  category: 'legends',
  difficulty: 'beginner'
});
```

### Python SDK Usage

```python
from tahitispeak import TahitiSpeakClient

client = TahitiSpeakClient(token='your-jwt-token')

# Get personalized feed
feed = client.community.get_feed(type='following')

# Like a post
client.community.like_post('post_123')

# Add comment with cultural context
client.community.add_comment('post_123', {
    'content': 'This explanation really helps understand the cultural nuances!',
    'cultural_appreciation': True
})

# Search study groups
groups = client.community.search_groups(
    topic='pronunciation',
    level='beginner'
)
```