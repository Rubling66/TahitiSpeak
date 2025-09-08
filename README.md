# Tahitian Tutor Web Application

A comprehensive web application for learning Tahitian language with French translations, featuring offline support, internationalization, and a complete testing suite.

## Features

- 🌐 **Multi-language Support**: English, French, and Tahitian with i18n framework
- 🔐 **Authentication System**: JWT-based authentication with role-based access control
- 📚 **Lesson Management**: Comprehensive lesson system with progress tracking
- 👨‍💼 **Admin Dashboard**: User management, analytics, and content administration
- 📱 **Offline Support**: IndexedDB caching for offline functionality
- 🧪 **Comprehensive Testing**: Unit, integration, and E2E tests
- 🚀 **CI/CD Pipeline**: Automated testing, code coverage, and deployment
- 📊 **Analytics**: User progress tracking and performance monitoring

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library, Playwright
- **Database**: IndexedDB for offline storage
- **Authentication**: JWT tokens
- **Internationalization**: next-intl
- **CI/CD**: GitHub Actions, SonarCloud, Codecov

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tahitian-tutor-web.git
cd tahitian-tutor-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run check` - Run type checking and linting

### Testing
- `npm run test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:all` - Run all tests

### Quality Assurance
- `npm run format` - Format code with Prettier
- `npm run analyze` - Analyze bundle size
- `npm run health-check` - Run health checks

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── services/           # Business logic services
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/               # End-to-end tests

.github/
├── workflows/          # GitHub Actions workflows
└── dependabot.yml     # Dependency updates
```

## Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- Service and utility function testing
- Hook testing with custom test utilities

### Integration Tests
- User workflow testing
- API integration testing
- Authentication flow testing

### End-to-End Tests
- Complete user journeys with Playwright
- Cross-browser testing
- Accessibility testing

## CI/CD Pipeline

The project includes a comprehensive CI/CD pipeline with:

- **Automated Testing**: All test suites run on every PR
- **Code Coverage**: Coverage reports with Codecov
- **Quality Gates**: SonarCloud analysis
- **Security Audits**: Automated dependency scanning
- **Bundle Analysis**: Size monitoring and optimization
- **Automated Deployment**: Production deployment on main branch

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test:all`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Application
NEXT_PUBLIC_APP_NAME="Tahitian Tutor"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Features
NEXT_PUBLIC_ENABLE_OFFLINE="true"
NEXT_PUBLIC_ENABLE_ANALYTICS="true"

# Development
NODE_ENV="development"
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

## Acknowledgments

- Tahitian language resources and cultural consultants
- Open source community for the amazing tools and libraries
- Contributors and testers who helped improve the application