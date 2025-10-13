# Authentication API

The Authentication API handles user registration, login, password management, and token operations for TahitiSpeak.

## Base URL
```
/api/auth
```

## Endpoints

### Register User

Create a new user account.

```http
POST /api/auth/register
```

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "preferredLanguage": "en",
  "culturalBackground": "tahitian",
  "learningGoals": ["conversation", "cultural_understanding"],
  "agreedToTerms": true,
  "agreedToPrivacy": true
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "isEmailVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "message": "Registration successful. Please verify your email."
}
```

#### Error Responses
```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists",
    "statusCode": 409
  }
}
```

### Login User

Authenticate a user and receive access tokens.

```http
POST /api/auth/login
```

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "rememberMe": true
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "preferences": {
        "language": "en",
        "notifications": true,
        "theme": "light"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "message": "Login successful"
}
```

### Refresh Token

Refresh an expired access token using a refresh token.

```http
POST /api/auth/refresh
```

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### Logout

Invalidate user tokens and end the session.

```http
POST /api/auth/logout
```

#### Headers
```http
Authorization: Bearer <access-token>
```

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Verify Email

Verify user email address using verification token.

```http
POST /api/auth/verify-email
```

#### Request Body
```json
{
  "token": "verification_token_here",
  "email": "user@example.com"
}
```

#### Response
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Resend Verification Email

Resend email verification link.

```http
POST /api/auth/resend-verification
```

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Response
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### Forgot Password

Initiate password reset process.

```http
POST /api/auth/forgot-password
```

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Response
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password

Reset password using reset token.

```http
POST /api/auth/reset-password
```

#### Request Body
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

#### Response
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Change Password

Change password for authenticated user.

```http
POST /api/auth/change-password
```

#### Headers
```http
Authorization: Bearer <access-token>
```

#### Request Body
```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

#### Response
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Get Current User

Get current authenticated user information.

```http
GET /api/auth/me
```

#### Headers
```http
Authorization: Bearer <access-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "isEmailVerified": true,
      "profile": {
        "avatar": "https://cdn.tahitispeak.com/avatars/user_123456.jpg",
        "bio": "Learning Tahitian to connect with my heritage",
        "culturalBackground": "tahitian",
        "learningGoals": ["conversation", "cultural_understanding"],
        "level": "beginner",
        "joinedAt": "2024-01-01T00:00:00Z"
      },
      "preferences": {
        "language": "en",
        "notifications": {
          "email": true,
          "push": true,
          "lessonReminders": true,
          "achievements": true
        },
        "privacy": {
          "profileVisibility": "public",
          "showProgress": true,
          "allowMessages": true
        },
        "accessibility": {
          "fontSize": "medium",
          "highContrast": false,
          "screenReader": false
        }
      },
      "stats": {
        "lessonsCompleted": 25,
        "streakDays": 7,
        "totalStudyTime": 1800,
        "achievementsUnlocked": 5
      }
    }
  }
}
```

## Social Authentication

### Google OAuth

```http
GET /api/auth/google
```

Redirects to Google OAuth consent screen.

### Google OAuth Callback

```http
GET /api/auth/google/callback?code=<auth-code>
```

Handles Google OAuth callback and creates/authenticates user.

### Facebook OAuth

```http
GET /api/auth/facebook
```

Redirects to Facebook OAuth consent screen.

### Facebook OAuth Callback

```http
GET /api/auth/facebook/callback?code=<auth-code>
```

Handles Facebook OAuth callback and creates/authenticates user.

## Two-Factor Authentication

### Enable 2FA

```http
POST /api/auth/2fa/enable
```

#### Headers
```http
Authorization: Bearer <access-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": [
      "12345678",
      "87654321",
      "11223344"
    ]
  }
}
```

### Verify 2FA Setup

```http
POST /api/auth/2fa/verify-setup
```

#### Headers
```http
Authorization: Bearer <access-token>
```

#### Request Body
```json
{
  "token": "123456"
}
```

### Disable 2FA

```http
POST /api/auth/2fa/disable
```

#### Headers
```http
Authorization: Bearer <access-token>
```

#### Request Body
```json
{
  "password": "currentPassword123",
  "token": "123456"
}
```

### Verify 2FA Token

```http
POST /api/auth/2fa/verify
```

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123",
  "token": "123456"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email or password is incorrect |
| `EMAIL_ALREADY_EXISTS` | Account with email already exists |
| `EMAIL_NOT_VERIFIED` | Email address not verified |
| `INVALID_TOKEN` | Token is invalid or expired |
| `PASSWORD_TOO_WEAK` | Password doesn't meet requirements |
| `ACCOUNT_LOCKED` | Account temporarily locked due to failed attempts |
| `2FA_REQUIRED` | Two-factor authentication required |
| `INVALID_2FA_TOKEN` | Two-factor authentication token invalid |

## Rate Limiting

Authentication endpoints have specific rate limits:

- **Login**: 5 attempts per 15 minutes per IP
- **Register**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per email
- **Email Verification**: 5 attempts per hour per email

## Security Features

- **Password Requirements**: Minimum 8 characters, mixed case, numbers
- **Account Lockout**: Temporary lockout after 5 failed login attempts
- **Token Expiration**: Access tokens expire in 1 hour, refresh tokens in 30 days
- **Secure Headers**: CSRF protection, secure cookies, HTTPS enforcement
- **Audit Logging**: All authentication events are logged for security monitoring