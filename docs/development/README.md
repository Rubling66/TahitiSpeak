# Development Guide

This guide provides comprehensive information for developers working on TahitiSpeak, including setup instructions, development workflows, coding standards, and best practices.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance](#performance)
- [Security](#security)
- [Deployment](#deployment)

## Quick Start

### Prerequisites

- **Node.js**: Version 20.0 or higher
- **Package Manager**: npm or pnpm (pnpm recommended)
- **Git**: For version control
- **VS Code**: Recommended editor with extensions

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/TahitiSpeak.git
   cd TahitiSpeak
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/tahitispeak"
   
   # Authentication
   JWT_SECRET="your-jwt-secret"
   JWT_REFRESH_SECRET="your-refresh-secret"
   
   # External Services
   OPENAI_API_KEY="your-openai-key"
   SUPABASE_URL="your-supabase-url"
   SUPABASE_ANON_KEY="your-supabase-anon-key"
   
   # Email
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Development Environment

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "orta.vscode-jest",
    "ms-vscode.vscode-json"
  ]
}
```

### Environment Setup Script

Run the setup script to configure your development environment:

```bash
npm run setup:dev
```

This script will:
- Verify Node.js version
- Install dependencies
- Set up pre-commit hooks
- Initialize the database
- Run initial tests

### Docker Development (Optional)

For containerized development:

```bash
# Start all services
docker-compose up -d

# Start only the database
docker-compose up -d postgres

# View logs
docker-compose logs -f app
```

## Project Structure

```
TahitiSpeak/
├── .github/                 # GitHub templates and workflows
├── .trae/                   # Trae AI configuration
├── api/                     # Backend API (Express.js)
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   └── server.js           # Main server file
├── src/                     # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Next.js pages
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── styles/             # CSS and styling
├── docs/                    # Documentation
├── tests/                   # Test files
├── public/                  # Static assets
├── scripts/                 # Build and utility scripts
└── supabase/               # Supabase configuration
```

### Key Directories

- **`src/components/`**: Reusable UI components
- **`src/pages/`**: Next.js pages and routing
- **`src/hooks/`**: Custom React hooks for state management
- **`api/routes/`**: Backend API endpoints
- **`tests/`**: Unit, integration, and E2E tests
- **`docs/`**: Project documentation

## Development Workflow

### Branch Strategy

We use Git Flow with the following branches:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features and enhancements
- **`bugfix/*`**: Bug fixes
- **`hotfix/*`**: Critical production fixes

### Feature Development

1. **Create a feature branch:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/lesson-progress-tracking
   ```

2. **Make your changes:**
   - Follow coding standards
   - Write tests for new functionality
   - Update documentation

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat(lessons): add progress tracking functionality"
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/lesson-progress-tracking
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add two-factor authentication
fix(lessons): resolve audio playback issue
docs(api): update authentication endpoints
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use meaningful variable and function names
- Document complex types with JSDoc

```typescript
interface LessonProgress {
  lessonId: string;
  userId: string;
  completedAt: Date;
  score: number;
  timeSpent: number;
}

/**
 * Updates lesson progress for a user
 * @param userId - The user's unique identifier
 * @param lessonId - The lesson's unique identifier
 * @param progress - Progress data to update
 * @returns Promise resolving to updated progress
 */
async function updateLessonProgress(
  userId: string,
  lessonId: string,
  progress: Partial<LessonProgress>
): Promise<LessonProgress> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Keep components under 300 lines
- Extract reusable logic into custom hooks
- Use proper TypeScript props interfaces

```typescript
interface LessonCardProps {
  lesson: Lesson;
  onStart: (lessonId: string) => void;
  isCompleted?: boolean;
  className?: string;
}

export function LessonCard({ 
  lesson, 
  onStart, 
  isCompleted = false,
  className 
}: LessonCardProps) {
  // Component implementation
}
```

### CSS and Styling

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use semantic class names
- Maintain consistent spacing and colors

```tsx
<div className="
  flex flex-col gap-4 p-6
  bg-white rounded-lg shadow-md
  hover:shadow-lg transition-shadow
  md:flex-row md:gap-6
">
  {/* Component content */}
</div>
```

### API Design

- Use RESTful conventions
- Implement proper error handling
- Include request/response validation
- Document all endpoints

```typescript
// GET /api/lessons/:id
export async function getLessonById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({
        error: 'Invalid lesson ID format'
      });
    }
    
    const lesson = await lessonService.findById(id);
    
    if (!lesson) {
      return res.status(404).json({
        error: 'Lesson not found'
      });
    }
    
    res.json({ data: lesson });
  } catch (error) {
    logger.error('Error fetching lesson:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}
```

## Testing

### Test Structure

```
tests/
├── unit/                   # Unit tests
│   ├── components/        # Component tests
│   ├── hooks/             # Hook tests
│   └── utils/             # Utility function tests
├── integration/           # Integration tests
│   ├── api/               # API endpoint tests
│   └── database/          # Database tests
├── e2e/                   # End-to-end tests
│   ├── auth/              # Authentication flows
│   ├── lessons/           # Lesson functionality
│   └── admin/             # Admin features
└── fixtures/              # Test data and mocks
```

### Running Tests

```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

#### Unit Tests (Jest + React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonCard } from '../LessonCard';

describe('LessonCard', () => {
  const mockLesson = {
    id: '1',
    title: 'Basic Greetings',
    description: 'Learn common Tahitian greetings',
    difficulty: 'beginner'
  };

  it('renders lesson information correctly', () => {
    render(
      <LessonCard 
        lesson={mockLesson} 
        onStart={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
    expect(screen.getByText('Learn common Tahitian greetings')).toBeInTheDocument();
  });

  it('calls onStart when start button is clicked', () => {
    const mockOnStart = jest.fn();
    
    render(
      <LessonCard 
        lesson={mockLesson} 
        onStart={mockOnStart} 
      />
    );
    
    fireEvent.click(screen.getByText('Start Lesson'));
    expect(mockOnStart).toHaveBeenCalledWith('1');
  });
});
```

#### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Lesson Flow', () => {
  test('user can complete a lesson', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to lessons
    await page.goto('/lessons');
    await expect(page.locator('h1')).toContainText('Lessons');
    
    // Start a lesson
    await page.click('[data-testid="lesson-card-1"] button');
    await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
    
    // Complete lesson steps
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="submit-answer"]');
    
    // Verify completion
    await expect(page.locator('[data-testid="lesson-complete"]')).toBeVisible();
  });
});
```

## Debugging

### Development Tools

1. **React Developer Tools**: Browser extension for React debugging
2. **Redux DevTools**: For state management debugging
3. **Network Tab**: Monitor API requests and responses
4. **Console Logging**: Strategic console.log statements

### Debugging Techniques

```typescript
// Debug API calls
const debugAPI = (url: string, options: RequestInit) => {
  console.group(`🌐 API Call: ${options.method} ${url}`);
  console.log('Options:', options);
  console.log('Headers:', options.headers);
  console.groupEnd();
};

// Debug component renders
const DebugComponent = ({ children, name }: { children: React.ReactNode; name: string }) => {
  console.log(`🔄 ${name} rendered at`, new Date().toISOString());
  return <>{children}</>;
};

// Debug hooks
const useDebugValue = (value: any, label: string) => {
  React.useDebugValue(value, (val) => `${label}: ${JSON.stringify(val)}`);
  return value;
};
```

### Error Monitoring

We use error monitoring tools in production:

```typescript
// Error boundary for React components
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service
    errorMonitoring.captureException(error, {
      extra: errorInfo,
      tags: { component: 'ErrorBoundary' }
    });
  }
}

// API error handling
const handleAPIError = (error: Error, context: string) => {
  errorMonitoring.captureException(error, {
    tags: { context },
    extra: { timestamp: Date.now() }
  });
};
```

## Performance

### Optimization Strategies

1. **Code Splitting**: Lazy load components and routes
2. **Image Optimization**: Use Next.js Image component
3. **Bundle Analysis**: Regular bundle size monitoring
4. **Caching**: Implement proper caching strategies

### Performance Monitoring

```bash
# Analyze bundle size
npm run analyze

# Run Lighthouse audit
npm run lighthouse

# Performance testing
npm run test:performance
```

### Best Practices

```typescript
// Lazy loading
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Memoization
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data.title}</div>;
});

// Optimized images
import Image from 'next/image';

<Image
  src="/lesson-image.jpg"
  alt="Lesson illustration"
  width={400}
  height={300}
  priority={false}
  placeholder="blur"
/>
```

## Security

### Security Checklist

- [ ] Input validation on all forms
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secure headers
- [ ] Authentication verification
- [ ] Authorization checks
- [ ] Sensitive data encryption

### Implementation

```typescript
// Input validation
import { z } from 'zod';

const lessonSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'])
});

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

## Deployment

### Build Process

```bash
# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test:ci
```

### Environment Configuration

Different configurations for each environment:

- **Development**: `.env.local`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

### Deployment Commands

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Rollback deployment
npm run rollback
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in `.env.local`
2. **Database connection**: Verify DATABASE_URL
3. **API key errors**: Check environment variables
4. **Build failures**: Clear cache with `npm run clean`

### Getting Help

- **Documentation**: Check relevant docs sections
- **GitHub Issues**: Search existing issues
- **Discord**: Join our developer community
- **Email**: dev-support@tahitispeak.com

## Contributing

See [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) for detailed contribution guidelines.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Playwright Testing](https://playwright.dev)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)