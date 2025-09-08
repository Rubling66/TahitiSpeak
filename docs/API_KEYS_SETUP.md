# API Keys Configuration Guide

This guide provides comprehensive instructions for administrators on how to obtain and configure API keys for the Tahitian Tutor application.

## Overview

The Tahitian Tutor application integrates with multiple external services to provide AI-powered content creation, translation services, design tools, and learning management system integration. Each service requires proper API key configuration.

## Required API Keys

### 1. OpenAI API Key
**Purpose**: AI content creation and cultural tutoring
**Required**: Yes
**Environment Variable**: `OPENAI_API_KEY`

**How to obtain**:
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

**Configuration**:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Canva API Key
**Purpose**: Design integration for educational materials
**Required**: Yes
**Environment Variable**: `CANVA_API_KEY`

**How to obtain**:
1. Visit [Canva Developers](https://www.canva.com/developers/)
2. Create a developer account
3. Create a new app
4. Generate API credentials
5. Copy the API key

**Configuration**:
```env
CANVA_API_KEY=your-canva-api-key-here
```

### 3. Google Services
**Purpose**: Translation services and SSO authentication
**Required**: Yes
**Environment Variables**: 
- `GOOGLE_TRANSLATE_API_KEY`
- `GOOGLE_SSO_CLIENT_ID`
- `GOOGLE_SSO_CLIENT_SECRET`

**How to obtain**:
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Translate API and Google OAuth2 API
4. Create credentials:
   - For Translate API: Create API Key
   - For SSO: Create OAuth 2.0 Client ID

**Configuration**:
```env
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
GOOGLE_SSO_CLIENT_ID=your-google-client-id
GOOGLE_SSO_CLIENT_SECRET=your-google-client-secret
```

### 4. Canvas LTI Integration
**Purpose**: Learning Management System integration
**Required**: For LMS features
**Environment Variables**:
- `CANVAS_LTI_CONSUMER_KEY`
- `CANVAS_LTI_SHARED_SECRET`

**How to obtain**:
1. Contact your Canvas administrator
2. Request LTI app registration
3. Provide app details and redirect URLs
4. Receive consumer key and shared secret

**Configuration**:
```env
CANVAS_LTI_CONSUMER_KEY=your-canvas-consumer-key
CANVAS_LTI_SHARED_SECRET=your-canvas-shared-secret
```

### 5. DeepSeek API Key
**Purpose**: Enhanced AI features
**Required**: Optional
**Environment Variable**: `DEEPSEEK_API_KEY`

**How to obtain**:
1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Create an account
3. Navigate to API section
4. Generate API key

**Configuration**:
```env
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 6. Additional Translation Services
**Purpose**: Multiple translation provider support
**Required**: Optional
**Environment Variables**:
- `AZURE_TRANSLATE_API_KEY`
- `AWS_TRANSLATE_ACCESS_KEY`
- `AWS_TRANSLATE_SECRET_KEY`
- `DEEPL_API_KEY`

## Setup Instructions

### 1. Environment File Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your actual API keys:
   ```bash
   nano .env
   # or use your preferred editor
   ```

3. For local development, also create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

### 2. Admin Dashboard Configuration

1. Navigate to the admin dashboard: `/admin/api-keys`
2. Review the API key status overview
3. Click "Edit" next to any missing or invalid keys
4. Enter your API keys securely
5. Use "Test Connection" to verify each service
6. Save changes

### 3. Validation and Testing

The system provides several validation features:

- **Real-time validation**: Keys are validated as you type
- **Connection testing**: Test actual API connectivity
- **Production readiness**: Check if all required keys are configured
- **Security validation**: Ensure keys follow proper format

### 4. Security Best Practices

1. **Never commit API keys to version control**
   - The `.env*` files are already in `.gitignore`
   - Double-check before committing any configuration files

2. **Use environment-specific keys**
   - Development keys for local/staging environments
   - Production keys only for production deployment

3. **Regular key rotation**
   - Rotate API keys periodically
   - Update keys immediately if compromised

4. **Access control**
   - Limit who has access to production API keys
   - Use role-based access in the admin dashboard

5. **Monitoring**
   - Monitor API usage and quotas
   - Set up alerts for unusual activity

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Ensure the key is set in the `.env` file
   - Restart the application after adding new keys
   - Check for typos in environment variable names

2. **"Invalid API key" error**
   - Verify the key format is correct
   - Check if the key has expired
   - Ensure proper permissions are set for the key

3. **"Connection failed" error**
   - Check internet connectivity
   - Verify API service status
   - Check if IP address is whitelisted (if required)

4. **"Quota exceeded" error**
   - Check API usage limits
   - Upgrade your API plan if needed
   - Implement rate limiting in the application

### Getting Help

1. Check the admin dashboard for detailed error messages
2. Review the application logs for more information
3. Test individual API connections using the built-in test tools
4. Contact the respective API provider's support if issues persist

## Production Deployment

### Environment Variables Setup

For production deployment, ensure all required environment variables are set:

```bash
# Check production readiness
npm run check:env

# Validate all API connections
npm run test:apis
```

### Deployment Platforms

**Vercel**:
1. Add environment variables in Vercel dashboard
2. Deploy the application
3. Test all integrations in production

**Other platforms**:
1. Set environment variables according to platform documentation
2. Ensure all required keys are configured
3. Test the admin dashboard after deployment

## Monitoring and Maintenance

### Regular Tasks

1. **Monthly**: Review API usage and costs
2. **Quarterly**: Rotate API keys
3. **As needed**: Update keys when services change

### Health Checks

The admin dashboard provides:
- Real-time connection status
- API response times
- Error rate monitoring
- Usage statistics

### Backup and Recovery

1. Keep secure backups of API keys
2. Document key rotation procedures
3. Have emergency contact information for API providers

---

**Note**: This documentation should be kept secure and only shared with authorized administrators. API keys are sensitive credentials that should be protecte