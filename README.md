# TahitiSpeak 🌺

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)

**TahitiSpeak** is an innovative, interactive Tahitian language learning platform that combines modern web technologies with cultural authenticity. Our mission is to preserve and promote the beautiful Tahitian language through engaging, accessible, and culturally respectful learning experiences.

> *"E reo māita'i te reo Tahiti"* - Tahitian is a beautiful language

## 🌟 Features

### 🎓 Core Learning Experience
- **Interactive Lessons**: Engaging multimedia lessons with audio, visual, and interactive elements
- **Cultural Context**: Learn language through authentic Tahitian cultural stories and traditions
- **Progress Tracking**: Comprehensive analytics to monitor learning journey and achievements
- **Adaptive Learning**: AI-powered personalized learning paths based on individual progress
- **Community Features**: Connect with fellow learners and native speakers

### 🎯 Advanced Learning Tools
- **Speech Recognition**: Practice pronunciation with real-time feedback
- **3D Avatar Integration**: Interactive virtual teacher using TalkingHead technology
- **Offline Support**: Continue learning even without internet connection
- **Gamification**: Earn points, badges, and compete with friends
- **Multi-modal Learning**: Visual, auditory, and kinesthetic learning approaches

### 🛠 Technical Excellence
- **Modern Architecture**: Built with Next.js 14, React 18, and TypeScript
- **Real-time Features**: Live chat, collaborative learning, and instant feedback
- **PWA Support**: Install as a mobile app with offline capabilities
- **Accessibility**: WCAG 2.1 AA compliant for inclusive learning
- **Performance**: Optimized for fast loading and smooth interactions

### 🔧 Admin & Management
- **Content Management**: Easy-to-use CMS for creating and managing lessons
- **User Analytics**: Detailed insights into learning patterns and engagement
- **A/B Testing**: Optimize learning experiences through data-driven testing
- **Multi-language Support**: Platform available in multiple languages
- **Security & Privacy**: Enterprise-grade security with GDPR compliance

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20.0 or higher
- **npm** or **pnpm** package manager
- **Git** for version control
- **Supabase** account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rubling66/TahitiSpeak.git
   cd TahitiSpeak
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Using pnpm (recommended)
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   # Frontend only
   npm run dev
   
   # Full stack (frontend + API)
   npm run dev:full
   ```

5. **Access the application**
   - **Main application**: `http://localhost:3000`
   - **Admin dashboard**: `http://localhost:3000/admin`
   - **API server**: `http://localhost:3001` (when running full stack)

## 📁 Project Structure

```
TahitiSpeak/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/        # Authentication routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── learn/         # Learning modules
│   │   ├── api/           # API routes
│   │   └── globals.css    # Global styles
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── learning/     # Learning-specific components
│   │   ├── admin/        # Admin components
│   │   └── layout/       # Layout components
│   ├── lib/              # Utility libraries
│   │   ├── supabase/     # Supabase client & utilities
│   │   ├── auth/         # Authentication logic
│   │   ├── ai/           # AI integration
│   │   └── utils/        # General utilities
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript definitions
│   └── stores/           # State management
├── api/                  # Express.js backend
│   ├── routes/           # API route handlers
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   └── server.ts         # Server entry point
├── docs/                 # Documentation
│   ├── api/             # API documentation
│   ├── development/     # Development guides
│   ├── deployment/      # Deployment guides
│   ├── architecture/    # Architecture docs
│   └── user-guides/     # User documentation
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── api/            # API tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── public/             # Static assets
├── scripts/            # Build & utility scripts
└── supabase/           # Supabase configuration
    └── migrations/     # Database migrations
```

## 🛠 Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router and server-side rendering
- **React 18**: Modern UI framework with concurrent features
- **TypeScript 5**: Type-safe development with latest features
- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions
- **Recharts**: Interactive data visualization
- **Lucide React**: Beautiful icon library

### Backend & Services
- **Express.js**: RESTful API server
- **Supabase**: Backend-as-a-Service (database, auth, storage)
- **Socket.io**: Real-time communication
- **Stripe**: Payment processing
- **SendGrid/Resend**: Email services
- **Firebase**: AI services and additional backend features

### AI & Learning
- **Google AI (Genkit)**: AI-powered learning features
- **MediaPipe**: Face mesh for speech recognition
- **TalkingHead**: 3D avatar integration
- **Three.js**: 3D graphics and animations

### Development & Testing
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **ESLint**: Code linting and quality
- **Prettier**: Code formatting
- **Lighthouse CI**: Performance monitoring

## 📊 Learning Analytics & Admin

TahitiSpeak provides comprehensive analytics and management tools:

### 📈 Learning Analytics
- **Progress Tracking**: Monitor individual and cohort learning progress
- **Engagement Metrics**: Track lesson completion rates and time spent
- **Performance Analysis**: Identify learning patterns and areas for improvement
- **Cultural Content Analytics**: Measure effectiveness of cultural learning materials
- **Retention Insights**: Understand user engagement and retention patterns

### 🎯 Content Management
- **Lesson Builder**: Create interactive lessons with multimedia content
- **Cultural Content Curation**: Manage authentic Tahitian cultural materials
- **Assessment Tools**: Design quizzes, exercises, and pronunciation tests
- **Content Localization**: Manage multi-language content and translations
- **Version Control**: Track content changes and maintain quality

### 👥 User Management
- **User Profiles**: Comprehensive learner profiles and preferences
- **Learning Paths**: Customize learning journeys for different skill levels
- **Community Moderation**: Manage user interactions and community features
- **Achievement System**: Configure badges, points, and milestone rewards
- **Support Tools**: Help desk integration and user assistance

### 🔧 System Administration
- **Performance Monitoring**: Real-time application performance metrics
- **Security Dashboard**: Monitor security events and user authentication
- **A/B Testing**: Optimize learning experiences through controlled experiments
- **Backup Management**: Automated data backup and recovery procedures
- **Integration Management**: Configure third-party services and APIs

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# AI Services
GOOGLE_AI_API_KEY=your_google_ai_key
FIREBASE_PROJECT_ID=your_firebase_project_id

# Payment Processing
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email Services
SENDGRID_API_KEY=your_sendgrid_api_key
RESEND_API_KEY=your_resend_api_key

# Analytics & Monitoring
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
SENTRY_DSN=your_sentry_dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_SPEECH_RECOGNITION=true
NEXT_PUBLIC_ENABLE_3D_AVATAR=true
```

### Learning Configuration

Customize the learning experience:

```typescript
// lib/config/learning.ts
export const learningConfig = {
  lessons: {
    defaultDuration: 15, // minutes
    maxRetries: 3,
    passThreshold: 0.8
  },
  speech: {
    recognitionTimeout: 5000,
    pronunciationThreshold: 0.7
  },
  gamification: {
    pointsPerLesson: 100,
    streakBonus: 1.5,
    achievementUnlockThreshold: 0.9
  }
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run API tests
npm run test:api

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y

# Run performance tests
npm run test:performance

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/                   # Unit tests for components and utilities
│   ├── components/        # React component tests
│   ├── lib/              # Utility function tests
│   └── hooks/            # Custom hook tests
├── api/                   # API endpoint tests
│   ├── auth/             # Authentication API tests
│   ├── learning/         # Learning API tests
│   └── admin/            # Admin API tests
├── integration/           # Integration tests
│   ├── learning-flow.test.ts
│   └── user-journey.test.ts
├── e2e/                  # End-to-end tests
│   ├── learning.spec.ts
│   ├── admin.spec.ts
│   └── auth.spec.ts
└── accessibility/        # Accessibility tests
    └── a11y.test.ts
```

### Writing Tests

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { LessonCard } from '@/components/learning/LessonCard';

describe('LessonCard', () => {
  const mockLesson = {
    id: '1',
    title: 'Basic Greetings',
    description: 'Learn common Tahitian greetings',
    difficulty: 'beginner',
    duration: 15
  };

  test('renders lesson information correctly', () => {
    render(<LessonCard lesson={mockLesson} />);
    
    expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
    expect(screen.getByText('Learn common Tahitian greetings')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });
});

// Example API test
import request from 'supertest';
import { app } from '@/api/server';

describe('Learning API', () => {
  test('GET /api/lessons returns lessons list', async () => {
    const response = await request(app)
      .get('/api/lessons')
      .expect(200);

    expect(response.body).toHaveProperty('lessons');
    expect(Array.isArray(response.body.lessons)).toBe(true);
  });
});
```

## 🚀 Deployment

### Development

```bash
# Start development server (frontend only)
npm run dev

# Start full stack development (frontend + API)
npm run dev:full

# Run type checking
npm run type-check

# Run linting and formatting
npm run check
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start

# Analyze bundle size
npm run build:analyze

# Build standalone version
npm run build:standalone
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

#### Manual Deployment
```bash
# Build the application
npm run build

# Copy files to server
# .next/, public/, package.json, package-lock.json

# On server
npm ci --only=production
npm start
```

For detailed deployment instructions, see [docs/deployment/README.md](docs/deployment/README.md).

## 📚 Documentation

### 🏗 Architecture & Development
- **[Technical Architecture](docs/architecture/technical-architecture.md)**: System architecture and design patterns
- **[Development Guide](docs/development/README.md)**: Complete development setup and workflow
- **[Implementation Guide](docs/development/implementation-guide.md)**: Implementation best practices

### 🚀 Deployment & Operations
- **[Deployment Guide](docs/deployment/README.md)**: Comprehensive deployment instructions
- **[Production Architecture](docs/architecture/production-architecture.md)**: Production environment setup

### 📖 API Documentation
- **[API Overview](docs/api/README.md)**: Complete API documentation
- **[Authentication API](docs/api/auth.md)**: Authentication endpoints and flows
- **[Learning API](docs/api/learning.md)**: Learning content and progress APIs

### 👥 User & Community
- **[User Guides](docs/user-guides/)**: End-user documentation and tutorials
- **[Contributing Guide](CONTRIBUTING.md)**: How to contribute to TahitiSpeak
- **[Code of Conduct](CODE_OF_CONDUCT.md)**: Community guidelines and standards

### 🔒 Security & Compliance
- **[Security Policy](SECURITY.md)**: Security guidelines and vulnerability reporting
- **[Privacy Policy](docs/legal/privacy-policy.md)**: Data privacy and protection
- **[Terms of Service](docs/legal/terms-of-service.md)**: Platform terms and conditions

## 🔒 Security

### Security Features
- **Authentication**: Secure user authentication with Supabase Auth
- **Authorization**: Role-based access control (RBAC) for different user types
- **Data Protection**: Encryption at rest and in transit
- **Input Validation**: Comprehensive input sanitization using Zod schemas
- **Rate Limiting**: API rate limiting to prevent abuse
- **CSRF Protection**: Cross-site request forgery protection
- **XSS Prevention**: Content Security Policy and input sanitization
- **Secure Headers**: Security headers configuration with Helmet.js

### Privacy & Compliance
- **GDPR Compliance**: Data protection and user privacy rights
- **COPPA Compliance**: Child privacy protection for educational content
- **Cultural Sensitivity**: Respectful handling of Tahitian cultural content
- **Data Minimization**: Collect only necessary user data
- **Audit Logging**: Comprehensive activity logging for security monitoring

### Security Best Practices
- Regular dependency updates with automated vulnerability scanning
- Secure environment variable management
- Database security with Row Level Security (RLS)
- API security with authentication and authorization
- Regular security assessments and penetration testing

### Reporting Security Issues
If you discover a security vulnerability, please report it responsibly:
- **Email**: security@tahitispeak.com
- **Response Time**: We aim to respond within 24 hours
- **Disclosure**: Coordinated disclosure process following industry standards

For detailed security information, see our [Security Policy](SECURITY.md).

## 🤝 Contributing

We welcome contributions to TahitiSpeak! Whether you're fixing bugs, adding features, improving documentation, or contributing cultural content, your help is appreciated.

### Ways to Contribute
- 🐛 **Bug Reports**: Report issues and help improve the platform
- ✨ **Feature Requests**: Suggest new learning features or improvements
- 🌺 **Cultural Content**: Contribute authentic Tahitian language content
- 📚 **Documentation**: Improve guides, tutorials, and API documentation
- 🧪 **Testing**: Help test new features and report feedback
- 🎨 **Design**: Contribute UI/UX improvements and accessibility enhancements

### Development Workflow
1. **Fork** the repository and clone your fork
2. **Create** a feature branch (`git checkout -b feature/lesson-builder`)
3. **Install** dependencies (`npm install`)
4. **Make** your changes following our coding standards
5. **Test** your changes (`npm run test` and `npm run check`)
6. **Commit** using conventional commit format
7. **Push** to your fork and create a Pull Request

### Cultural Content Guidelines
When contributing Tahitian language content:
- Ensure accuracy and authenticity of language usage
- Respect cultural context and traditional knowledge
- Provide proper attribution for cultural references
- Follow our cultural sensitivity guidelines in [CONTRIBUTING.md](CONTRIBUTING.md)

### Code Standards
- **TypeScript**: Use TypeScript for all new code
- **Testing**: Add tests for new functionality
- **Accessibility**: Ensure WCAG 2.1 AA compliance
- **Performance**: Consider performance impact of changes
- **Documentation**: Update relevant documentation

### Commit Convention
```
type(scope): description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `cultural`
**Scopes**: `learning`, `admin`, `auth`, `api`, `ui`, `docs`, `cultural`

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📈 Performance & Optimization

### Performance Features
- **Next.js Optimization**: Automatic code splitting and image optimization
- **Lazy Loading**: Dynamic imports for better initial load times
- **Caching**: Intelligent caching strategies for API responses and static assets
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Virtual Scrolling**: Efficient rendering for large lesson lists
- **Service Workers**: PWA capabilities with offline support

### Monitoring & Analytics
- **Core Web Vitals**: Real-time performance monitoring
- **User Analytics**: Learning engagement and progress tracking
- **Error Monitoring**: Sentry integration for error tracking
- **Performance Budgets**: Automated performance regression detection
- **Lighthouse CI**: Continuous performance auditing

## 🌐 Browser & Device Support

### Desktop Browsers
- **Chrome** 90+ (recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Mobile Support
- **iOS Safari** 14+
- **Chrome Mobile** 90+
- **Samsung Internet** 14+

### Accessibility
- **Screen Readers**: NVDA, JAWS, VoiceOver support
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Support for high contrast modes
- **Text Scaling**: Responsive to user font size preferences

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Technology Partners
- **Next.js Team** for the incredible React framework
- **Supabase** for providing excellent backend-as-a-service
- **Vercel** for seamless deployment and hosting
- **Tailwind CSS** for the utility-first CSS framework

### Cultural Contributors
- **Tahitian Language Experts** for authentic content validation
- **Cultural Advisors** for ensuring respectful representation
- **Community Contributors** for ongoing content improvements
- **Beta Testers** from the Tahitian learning community

### Open Source Libraries
- **Radix UI** for accessible component primitives
- **Framer Motion** for smooth animations
- **Three.js** for 3D graphics capabilities
- **All open source contributors** who make this project possible

## 📞 Support & Community

### Getting Help
- **📖 Documentation**: Comprehensive guides in [docs/](docs/)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/Rubling66/TahitiSpeak/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Rubling66/TahitiSpeak/discussions)
- **📧 Email Support**: support@tahitispeak.com

### Community
- **🌺 Cultural Community**: Connect with Tahitian language learners
- **👩‍💻 Developer Community**: Contribute to the open source project
- **🎓 Educator Network**: Resources for teachers and institutions
- **📱 Social Media**: Follow us for updates and community highlights

## 🗺 Roadmap

### 🚀 Version 2.0 (Q2 2024)
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **Advanced AI**: Personalized learning recommendations
- [ ] **Voice Recognition**: Enhanced pronunciation feedback
- [ ] **Collaborative Learning**: Study groups and peer interactions

### 🌟 Version 2.1 (Q3 2024)
- [ ] **Offline Mode**: Complete offline learning capabilities
- [ ] **Cultural VR**: Virtual reality cultural experiences
- [ ] **Teacher Dashboard**: Advanced tools for educators
- [ ] **API Marketplace**: Third-party integrations

### 🎯 Long-term Vision
- [ ] **Multi-Polynesian**: Support for other Polynesian languages
- [ ] **AR Integration**: Augmented reality learning experiences
- [ ] **Global Community**: Worldwide Tahitian language network
- [ ] **Cultural Preservation**: Digital archive of Tahitian heritage

### Recent Releases
- **v1.0.0** (Current): Core learning platform with interactive lessons
- **v0.9.0**: Beta release with community testing
- **v0.8.0**: Alpha release with basic functionality

---

## 🌺 Getting Started Checklist

Ready to contribute to preserving and promoting the Tahitian language? Here's your checklist:

- [ ] ⭐ **Star** the repository to show your support
- [ ] 🍴 **Fork** the repository to your GitHub account
- [ ] 📥 **Clone** your fork locally
- [ ] 📦 **Install** dependencies with `npm install`
- [ ] 🔧 **Configure** environment variables
- [ ] 🚀 **Start** the development server
- [ ] 🎯 **Explore** the learning modules
- [ ] 📚 **Read** the documentation
- [ ] 🧪 **Run** the test suite
- [ ] 🤝 **Make** your first contribution

---

<div align="center">

**Māuruuru roa** (Thank you very much) for your interest in TahitiSpeak! 

*Together, we're preserving and promoting the beautiful Tahitian language for future generations.*

🌺 **E reo māita'i te reo Tahiti** 🌺

[⭐ Star on GitHub](https://github.com/Rubling66/TahitiSpeak) • [🚀 Try TahitiSpeak](https://tahitispeak.com) • [📖 Read the Docs](docs/) • [💬 Join Discussion](https://github.com/Rubling66/TahitiSpeak/discussions)

</div>