# TahitiSpeak API Documentation

Welcome to the TahitiSpeak API documentation. This comprehensive guide covers all available endpoints, authentication methods, and integration patterns for the TahitiSpeak language learning platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [SDKs and Libraries](#sdks-and-libraries)

## Overview

The TahitiSpeak API provides programmatic access to:
- User authentication and management
- Lesson content and progress tracking
- Cultural stories and annotations
- Community features and social learning
- Analytics and reporting
- Administrative functions
- Real-time notifications and collaboration

## Authentication

### JWT Token Authentication

All API requests require authentication using JWT tokens:

```http
Authorization: Bearer <your-jwt-token>
```

### API Key Authentication (Admin Only)

Administrative endpoints require API key authentication:

```http
X-API-Key: <your-api-key>
Authorization: Bearer <admin-jwt-token>
```

### Getting Started

1. Register a user account through `/api/auth/register`
2. Authenticate using `/api/auth/login` to receive JWT token
3. Include the token in all subsequent requests

## Base URL

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging-api.tahitispeak.com/api`
- **Production**: `https://api.tahitispeak.com/api`

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour
- **Admin users**: 5000 requests per hour

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Handling

The API uses conventional HTTP response codes and returns detailed error information:

### Success Codes
- `200` - OK
- `201` - Created
- `204` - No Content

### Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

## API Endpoints

### Authentication Endpoints
- [Authentication API](./auth.md) - User registration, login, and token management

### User Management
- [Users API](./users.md) - User profiles, preferences, and account management

### Learning Content
- [Lessons API](./lessons.md) - Lesson content, progress tracking, and assessments
- [Stories API](./stories.md) - Cultural stories, annotations, and discussions

### Community Features
- [Social API](./social.md) - Study groups, forums, and collaborative learning
- [Achievements API](./achievements.md) - Badges, leaderboards, and gamification

### Analytics and Reporting
- [Analytics API](./analytics.md) - Learning analytics, progress reports, and insights
- [Admin API](./admin.md) - Administrative functions and system management

### Real-time Features
- [Notifications API](./notifications.md) - Push notifications and real-time updates
- [Collaboration API](./collaboration.md) - Live sessions and real-time collaboration

## WebSocket Events

Real-time features use WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('wss://api.tahitispeak.com/ws');
ws.onopen = () => {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Event Types
- `lesson_progress` - Real-time lesson progress updates
- `collaboration_invite` - Study group invitations
- `achievement_unlocked` - New achievement notifications
- `story_discussion` - Story discussion updates
- `system_notification` - System-wide announcements

## SDKs and Libraries

### JavaScript/TypeScript SDK
```bash
npm install @tahitispeak/sdk
```

```javascript
import { TahitiSpeakClient } from '@tahitispeak/sdk';

const client = new TahitiSpeakClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.tahitispeak.com'
});

// Get user profile
const profile = await client.users.getProfile();
```

### Python SDK
```bash
pip install tahitispeak-python
```

```python
from tahitispeak import TahitiSpeakClient

client = TahitiSpeakClient(
    api_key='your-api-key',
    base_url='https://api.tahitispeak.com'
)

# Get lessons
lessons = client.lessons.list()
```

## Postman Collection

Import our Postman collection for easy API testing:
- [Download Collection](./postman/TahitiSpeak-API.postman_collection.json)
- [Environment Variables](./postman/TahitiSpeak-Environment.postman_environment.json)

## OpenAPI Specification

- [OpenAPI 3.0 Specification](./openapi.yaml)
- [Swagger UI](https://api.tahitispeak.com/docs)

## Support

For API support and questions:
- **Documentation**: [docs.tahitispeak.com](https://docs.tahitispeak.com)
- **Email**: api-support@tahitispeak.com
- **Discord**: [TahitiSpeak Developers](https://discord.gg/tahitispeak-dev)
- **GitHub Issues**: [github.com/tahitispeak/api-issues](https://github.com/tahitispeak/api-issues)

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for API version history and breaking changes.

## License

The TahitiSpeak API is available under the MIT License. See [LICENSE](../../LICENSE) for details.