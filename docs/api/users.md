# Users API

The Users API provides comprehensive user profile management, preferences, and account settings for the TahitiSpeak platform.

## Endpoints

### Get Current User Profile

```http
GET /api/users/me
```

Retrieve the authenticated user's profile information.

#### Response

```json
{
  "id": "user_123",
  "email": "marie@example.com",
  "username": "marie_tahiti",
  "profile": {
    "first_name": "Marie",
    "last_name": "Dupont",
    "display_name": "Marie D.",
    "avatar_url": "https://cdn.tahitispeak.com/avatars/user_123.jpg",
    "bio": "Passionate about Polynesian culture and languages",
    "location": "Papeete, Tahiti",
    "timezone": "Pacific/Tahiti",
    "date_of_birth": "1990-05-15",
    "cultural_background": "French-Polynesian"
  },
  "learning_profile": {
    "current_level": "intermediate",
    "learning_goals": ["conversational_fluency", "cultural_understanding"],
    "preferred_learning_style": "visual_auditory",
    "daily_goal_minutes": 30,
    "streak_days": 15,
    "total_study_time": 18000,
    "lessons_completed": 45,
    "points_earned": 4500,
    "achievements_count": 12
  },
  "preferences": {
    "language": "en",
    "notifications": {
      "email": true,
      "push": true,
      "study_reminders": true,
      "achievement_alerts": true,
      "community_updates": false
    },
    "privacy": {
      "profile_visibility": "public",
      "progress_sharing": true,
      "allow_study_partners": true
    },
    "accessibility": {
      "high_contrast": false,
      "large_text": false,
      "screen_reader": false,
      "reduced_motion": false
    }
  },
  "subscription": {
    "plan": "premium",
    "status": "active",
    "expires_at": "2024-12-31T23:59:59Z",
    "features": ["unlimited_lessons", "offline_mode", "premium_content"]
  },
  "created_at": "2023-06-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z",
  "last_active": "2024-01-20T16:30:00Z"
}
```

### Update User Profile

```http
PUT /api/users/me
```

Update the authenticated user's profile information.

#### Request Body

```json
{
  "profile": {
    "first_name": "Marie",
    "last_name": "Dupont",
    "display_name": "Marie D.",
    "bio": "Passionate about Polynesian culture and languages",
    "location": "Papeete, Tahiti",
    "timezone": "Pacific/Tahiti",
    "cultural_background": "French-Polynesian"
  },
  "learning_profile": {
    "learning_goals": ["conversational_fluency", "cultural_understanding"],
    "preferred_learning_style": "visual_auditory",
    "daily_goal_minutes": 45
  }
}
```

#### Response

```json
{
  "updated": true,
  "profile": {
    "first_name": "Marie",
    "last_name": "Dupont",
    "display_name": "Marie D.",
    "bio": "Passionate about Polynesian culture and languages",
    "location": "Papeete, Tahiti",
    "timezone": "Pacific/Tahiti",
    "cultural_background": "French-Polynesian"
  },
  "updated_at": "2024-01-20T16:45:00Z"
}
```

### Upload Avatar

```http
POST /api/users/me/avatar
```

Upload a new profile avatar image.

#### Request

```http
Content-Type: multipart/form-data

avatar: [image file]
```

#### Response

```json
{
  "avatar_url": "https://cdn.tahitispeak.com/avatars/user_123.jpg",
  "uploaded_at": "2024-01-20T16:50:00Z"
}
```

### Update User Preferences

```http
PUT /api/users/me/preferences
```

Update user preferences and settings.

#### Request Body

```json
{
  "notifications": {
    "email": true,
    "push": true,
    "study_reminders": true,
    "achievement_alerts": true,
    "community_updates": false
  },
  "privacy": {
    "profile_visibility": "friends_only",
    "progress_sharing": false,
    "allow_study_partners": true
  },
  "accessibility": {
    "high_contrast": true,
    "large_text": false,
    "screen_reader": false,
    "reduced_motion": true
  }
}
```

#### Response

```json
{
  "updated": true,
  "preferences": {
    "notifications": {
      "email": true,
      "push": true,
      "study_reminders": true,
      "achievement_alerts": true,
      "community_updates": false
    },
    "privacy": {
      "profile_visibility": "friends_only",
      "progress_sharing": false,
      "allow_study_partners": true
    },
    "accessibility": {
      "high_contrast": true,
      "large_text": false,
      "screen_reader": false,
      "reduced_motion": true
    }
  }
}
```

### Get User Statistics

```http
GET /api/users/me/stats
```

Retrieve detailed learning statistics for the authenticated user.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `all_time` | Time period (`week`, `month`, `year`, `all_time`) |
| `timezone` | string | `UTC` | Timezone for date calculations |

#### Response

```json
{
  "period": "month",
  "learning_stats": {
    "total_study_time": 1800,
    "lessons_completed": 12,
    "average_session_duration": 25,
    "streak_days": 15,
    "points_earned": 1200,
    "achievements_unlocked": 3,
    "pronunciation_accuracy": 0.78,
    "vocabulary_learned": 45,
    "cultural_stories_read": 8
  },
  "daily_breakdown": [
    {
      "date": "2024-01-20",
      "study_time": 30,
      "lessons": 1,
      "points": 150
    }
  ],
  "category_progress": {
    "vocabulary": 0.65,
    "grammar": 0.45,
    "pronunciation": 0.78,
    "culture": 0.82
  },
  "level_progression": {
    "current_level": "intermediate",
    "progress_to_next": 0.35,
    "estimated_completion": "2024-03-15"
  }
}
```

### Get User Achievements

```http
GET /api/users/me/achievements
```

Retrieve user's achievements and badges.

#### Response

```json
{
  "total_achievements": 12,
  "total_points": 4500,
  "achievements": [
    {
      "id": "first_lesson",
      "title": "First Steps",
      "description": "Complete your first lesson",
      "icon": "🎯",
      "category": "milestone",
      "points": 50,
      "rarity": "common",
      "unlocked_at": "2023-06-15T11:00:00Z"
    },
    {
      "id": "culture_explorer",
      "title": "Culture Explorer",
      "description": "Read 10 cultural stories",
      "icon": "🌺",
      "category": "cultural",
      "points": 200,
      "rarity": "rare",
      "unlocked_at": "2024-01-10T14:30:00Z"
    }
  ],
  "next_achievements": [
    {
      "id": "pronunciation_master",
      "title": "Pronunciation Master",
      "description": "Achieve 90% pronunciation accuracy",
      "icon": "🎤",
      "category": "skill",
      "points": 300,
      "progress": 0.78,
      "requirement": 0.9
    }
  ]
}
```

### Get Study Partners

```http
GET /api/users/me/study-partners
```

Retrieve user's study partners and learning connections.

#### Response

```json
{
  "study_partners": [
    {
      "id": "user_456",
      "username": "pierre_learning",
      "display_name": "Pierre M.",
      "avatar_url": "https://cdn.tahitispeak.com/avatars/user_456.jpg",
      "level": "beginner",
      "mutual_lessons": 8,
      "study_streak": 5,
      "connected_since": "2023-12-01T10:00:00Z",
      "last_active": "2024-01-20T15:30:00Z"
    }
  ],
  "study_groups": [
    {
      "id": "group_789",
      "name": "Tahitian Culture Enthusiasts",
      "member_count": 15,
      "activity_level": "high",
      "joined_at": "2023-11-15T09:00:00Z"
    }
  ],
  "pending_invitations": [
    {
      "id": "invite_123",
      "from_user": {
        "id": "user_789",
        "username": "sophie_tahiti",
        "display_name": "Sophie L."
      },
      "type": "study_partner",
      "message": "Let's learn together!",
      "sent_at": "2024-01-19T16:00:00Z"
    }
  ]
}
```

### Delete User Account

```http
DELETE /api/users/me
```

Permanently delete the user account and all associated data.

#### Request Body

```json
{
  "confirmation": "DELETE_MY_ACCOUNT",
  "password": "user_password",
  "reason": "No longer using the service"
}
```

#### Response

```json
{
  "deleted": true,
  "deletion_id": "del_123456",
  "scheduled_for": "2024-01-27T16:00:00Z",
  "message": "Account deletion scheduled. You have 7 days to cancel."
}
```

## Public User Endpoints

### Get Public User Profile

```http
GET /api/users/{user_id}
```

Retrieve public profile information for any user.

#### Response

```json
{
  "id": "user_456",
  "username": "pierre_learning",
  "profile": {
    "display_name": "Pierre M.",
    "avatar_url": "https://cdn.tahitispeak.com/avatars/user_456.jpg",
    "bio": "Learning Tahitian to connect with my heritage",
    "location": "Paris, France",
    "cultural_background": "French"
  },
  "learning_profile": {
    "current_level": "beginner",
    "lessons_completed": 23,
    "achievements_count": 8,
    "streak_days": 12,
    "joined_at": "2023-10-01T10:00:00Z"
  },
  "public_achievements": [
    {
      "id": "first_lesson",
      "title": "First Steps",
      "icon": "🎯",
      "unlocked_at": "2023-10-01T11:00:00Z"
    }
  ]
}
```

### Search Users

```http
GET /api/users/search
```

Search for users by username, display name, or learning interests.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search query |
| `level` | string | - | Filter by learning level |
| `location` | string | - | Filter by location |
| `limit` | integer | 20 | Number of results (max 50) |

#### Response

```json
{
  "users": [
    {
      "id": "user_456",
      "username": "pierre_learning",
      "display_name": "Pierre M.",
      "avatar_url": "https://cdn.tahitispeak.com/avatars/user_456.jpg",
      "level": "beginner",
      "location": "Paris, France",
      "mutual_connections": 2,
      "compatibility_score": 0.85
    }
  ],
  "total": 45,
  "suggestions": [
    "Study partners near you",
    "Users with similar learning goals",
    "Cultural background matches"
  ]
}
```

## Error Responses

### Profile Update Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid profile data",
    "details": [
      {
        "field": "email",
        "message": "Email address is already in use"
      },
      {
        "field": "username",
        "message": "Username must be 3-20 characters"
      }
    ]
  }
}
```

### Avatar Upload Error

```json
{
  "error": {
    "code": "INVALID_FILE",
    "message": "Avatar file must be an image under 5MB",
    "allowed_types": ["image/jpeg", "image/png", "image/webp"],
    "max_size": 5242880
  }
}
```

### Privacy Restriction Error

```json
{
  "error": {
    "code": "PRIVACY_RESTRICTED",
    "message": "User profile is private",
    "user_id": "user_456"
  }
}
```

## Rate Limits

- **Profile updates**: 10 requests per hour
- **Avatar uploads**: 5 requests per hour
- **User searches**: 100 requests per hour
- **Profile views**: 500 requests per hour

## Privacy and Security

### Data Protection

- **Personal Information**: Encrypted at rest and in transit
- **Profile Visibility**: Configurable privacy settings
- **Data Retention**: Automatic cleanup of inactive accounts
- **GDPR Compliance**: Full data export and deletion rights

### Security Features

- **Two-Factor Authentication**: Optional 2FA for enhanced security
- **Session Management**: Automatic logout and session monitoring
- **Suspicious Activity**: Real-time monitoring and alerts
- **Password Security**: Strong password requirements and breach detection

## Examples

### JavaScript SDK Usage

```javascript
import { TahitiSpeakClient } from '@tahitispeak/sdk';

const client = new TahitiSpeakClient({ token: 'your-jwt-token' });

// Get current user profile
const profile = await client.users.getProfile();

// Update profile
await client.users.updateProfile({
  profile: {
    display_name: 'Marie D.',
    bio: 'Learning Tahitian culture and language'
  }
});

// Upload avatar
const avatarFile = document.getElementById('avatar').files[0];
await client.users.uploadAvatar(avatarFile);

// Get user statistics
const stats = await client.users.getStats({ period: 'month' });

// Search for study partners
const partners = await client.users.search({
  q: 'tahitian culture',
  level: 'intermediate'
});
```

### Python SDK Usage

```python
from tahitispeak import TahitiSpeakClient

client = TahitiSpeakClient(token='your-jwt-token')

# Get profile
profile = client.users.get_profile()

# Update preferences
client.users.update_preferences({
    'notifications': {
        'email': True,
        'push': False
    },
    'privacy': {
        'profile_visibility': 'friends_only'
    }
})

# Get achievements
achievements = client.users.get_achievements()
```