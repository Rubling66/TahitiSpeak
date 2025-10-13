# Lessons API

The Lessons API provides access to TahitiSpeak's interactive learning content, progress tracking, and assessment features.

## Endpoints

### Get All Lessons

```http
GET /api/lessons
```

Retrieve a paginated list of available lessons.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 20 | Number of lessons per page (max 100) |
| `level` | string | - | Filter by difficulty level (`beginner`, `intermediate`, `advanced`) |
| `category` | string | - | Filter by category (`grammar`, `vocabulary`, `culture`, `pronunciation`) |
| `search` | string | - | Search lessons by title or description |

#### Response

```json
{
  "lessons": [
    {
      "id": "lesson_123",
      "title": "Basic Greetings",
      "description": "Learn essential Tahitian greetings and introductions",
      "level": "beginner",
      "category": "vocabulary",
      "duration": 15,
      "cultural_context": "Traditional Tahitian greeting customs",
      "objectives": [
        "Master common greetings",
        "Understand cultural context",
        "Practice pronunciation"
      ],
      "prerequisites": [],
      "completion_rate": 0.85,
      "average_score": 0.78,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Lesson Details

```http
GET /api/lessons/{lesson_id}
```

Retrieve detailed information about a specific lesson.

#### Response

```json
{
  "id": "lesson_123",
  "title": "Basic Greetings",
  "description": "Learn essential Tahitian greetings and introductions",
  "level": "beginner",
  "category": "vocabulary",
  "duration": 15,
  "cultural_context": "Traditional Tahitian greeting customs",
  "objectives": [
    "Master common greetings",
    "Understand cultural context",
    "Practice pronunciation"
  ],
  "content": {
    "sections": [
      {
        "id": "section_1",
        "type": "introduction",
        "title": "Welcome to Tahitian Greetings",
        "content": "In Tahitian culture, greetings are more than words...",
        "media": {
          "audio": "/audio/greetings-intro.mp3",
          "video": "/video/cultural-context.mp4"
        }
      },
      {
        "id": "section_2",
        "type": "vocabulary",
        "title": "Essential Greetings",
        "words": [
          {
            "tahitian": "Ia ora na",
            "english": "Hello",
            "pronunciation": "/ia ˈora na/",
            "audio": "/audio/ia-ora-na.mp3",
            "usage": "General greeting used throughout the day"
          }
        ]
      }
    ]
  },
  "assessments": [
    {
      "id": "quiz_1",
      "type": "multiple_choice",
      "title": "Greeting Recognition",
      "questions": 5
    }
  ],
  "user_progress": {
    "completed": false,
    "progress": 0.6,
    "score": 0.8,
    "time_spent": 720,
    "last_accessed": "2024-01-20T09:15:00Z"
  }
}
```

### Start Lesson

```http
POST /api/lessons/{lesson_id}/start
```

Begin or resume a lesson session.

#### Response

```json
{
  "session_id": "session_456",
  "lesson_id": "lesson_123",
  "started_at": "2024-01-20T10:00:00Z",
  "expires_at": "2024-01-20T12:00:00Z",
  "current_section": "section_1",
  "progress": 0.0
}
```

### Update Lesson Progress

```http
PUT /api/lessons/{lesson_id}/progress
```

Update user progress within a lesson.

#### Request Body

```json
{
  "session_id": "session_456",
  "section_id": "section_2",
  "progress": 0.75,
  "time_spent": 450,
  "interactions": [
    {
      "type": "audio_playback",
      "content_id": "ia-ora-na",
      "timestamp": "2024-01-20T10:15:00Z"
    }
  ]
}
```

#### Response

```json
{
  "updated": true,
  "current_progress": 0.75,
  "next_section": "section_3",
  "achievements": [
    {
      "id": "first_audio",
      "title": "First Audio Interaction",
      "points": 10
    }
  ]
}
```

### Complete Lesson

```http
POST /api/lessons/{lesson_id}/complete
```

Mark a lesson as completed and submit final assessment.

#### Request Body

```json
{
  "session_id": "session_456",
  "final_score": 0.85,
  "time_spent": 900,
  "assessment_results": {
    "quiz_1": {
      "score": 0.8,
      "answers": [
        {
          "question_id": "q1",
          "answer": "ia_ora_na",
          "correct": true
        }
      ]
    }
  }
}
```

#### Response

```json
{
  "completed": true,
  "final_score": 0.85,
  "grade": "B+",
  "points_earned": 150,
  "achievements": [
    {
      "id": "lesson_complete",
      "title": "Lesson Master",
      "points": 50
    }
  ],
  "next_recommended": "lesson_124",
  "certificate": {
    "id": "cert_789",
    "url": "/certificates/cert_789.pdf"
  }
}
```

### Get User Progress

```http
GET /api/lessons/progress
```

Retrieve user's progress across all lessons.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status (`not_started`, `in_progress`, `completed`) |
| `level` | string | - | Filter by difficulty level |

#### Response

```json
{
  "overall_progress": {
    "total_lessons": 150,
    "completed": 45,
    "in_progress": 3,
    "completion_rate": 0.3,
    "average_score": 0.82,
    "total_time": 18000,
    "points_earned": 4500
  },
  "lessons": [
    {
      "lesson_id": "lesson_123",
      "title": "Basic Greetings",
      "status": "completed",
      "progress": 1.0,
      "score": 0.85,
      "completed_at": "2024-01-20T11:30:00Z"
    }
  ]
}
```

## Error Responses

### Lesson Not Found

```json
{
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "The requested lesson does not exist",
    "lesson_id": "invalid_lesson"
  }
}
```

### Invalid Session

```json
{
  "error": {
    "code": "INVALID_SESSION",
    "message": "Session has expired or is invalid",
    "session_id": "expired_session"
  }
}
```

### Prerequisites Not Met

```json
{
  "error": {
    "code": "PREREQUISITES_NOT_MET",
    "message": "Required prerequisite lessons must be completed first",
    "required_lessons": ["lesson_101", "lesson_102"]
  }
}
```

## WebSocket Events

Real-time lesson events for collaborative learning:

### Lesson Progress Update

```json
{
  "type": "lesson_progress",
  "lesson_id": "lesson_123",
  "user_id": "user_456",
  "progress": 0.75,
  "section": "section_3"
}
```

### Study Group Activity

```json
{
  "type": "study_group_activity",
  "group_id": "group_789",
  "lesson_id": "lesson_123",
  "activity": "user_completed_section",
  "user": {
    "id": "user_456",
    "name": "Marie Dupont"
  }
}
```

## Rate Limits

- **Lesson retrieval**: 100 requests per hour
- **Progress updates**: 500 requests per hour
- **Lesson completion**: 50 requests per hour

## Cultural Content Guidelines

When working with lesson content:

1. **Respect Cultural Context**: Always include cultural background and significance
2. **Pronunciation Accuracy**: Use IPA notation for precise pronunciation guides
3. **Traditional Knowledge**: Properly attribute traditional stories and customs
4. **Community Input**: Encourage feedback from native speakers and cultural experts

## Examples

### JavaScript SDK Usage

```javascript
import { TahitiSpeakClient } from '@tahitispeak/sdk';

const client = new TahitiSpeakClient({ token: 'your-jwt-token' });

// Get beginner lessons
const lessons = await client.lessons.list({ level: 'beginner' });

// Start a lesson
const session = await client.lessons.start('lesson_123');

// Update progress
await client.lessons.updateProgress('lesson_123', {
  session_id: session.session_id,
  progress: 0.5,
  section_id: 'section_2'
});

// Complete lesson
const result = await client.lessons.complete('lesson_123', {
  session_id: session.session_id,
  final_score: 0.85
});
```

### Python SDK Usage

```python
from tahitispeak import TahitiSpeakClient

client = TahitiSpeakClient(token='your-jwt-token')

# Get lessons by category
lessons = client.lessons.list(category='culture')

# Start lesson
session = client.lessons.start('lesson_123')

# Update progress
client.lessons.update_progress('lesson_123', {
    'session_id': session['session_id'],
    'progress': 0.75,
    'section_id': 'section_3'
})
```