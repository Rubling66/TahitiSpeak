# TahitiSpeak 🌺

**Interactive Tahitian Language Learning Platform with Local AI**

TahitiSpeak is a comprehensive web application designed to help users learn the beautiful Tahitian language through interactive lessons, pronunciation practice, and cultural immersion. Powered by local AI (Llama 3.1 DeepSeek) for enhanced privacy and offline capabilities, this platform offers an authentic Polynesian language learning experience.

**🎯 Currently in Beta Testing Phase** - Ready for educational evaluation and feedback.

## ✨ Features

### Core Learning Features
- **Interactive Lessons**: Structured learning modules with progressive difficulty
- **AI-Powered Pronunciation**: Local AI feedback for accurate Tahitian pronunciation
- **Cultural Context**: Learn language through authentic Tahitian culture and traditions
- **Progress Tracking**: Monitor your learning journey with detailed analytics
- **Multi-language Support**: Interface available in English, French, and Tahitian

### Technical Features
- **Local AI Integration**: Llama 3.1 DeepSeek for privacy-focused language processing
- **Offline Capability**: Continue learning even without internet connection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **PWA Support**: Install as a native app on any device
- **Authentication System**: JWT-based authentication with role-based access control

### Educational Features
- **Beta Testing Ready**: Comprehensive guides for educators and students
- **Feedback System**: Built-in tools for collecting educational feedback
- **Performance Analytics**: Track learning effectiveness and engagement
- **Accessibility**: WCAG compliant for inclusive learning

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+ (Node.js 20.17.0 recommended)
- npm or pnpm package manager
- **Local AI Setup**: Ollama with Llama 3.1 DeepSeek model (for full functionality)
- Git for version control

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Rubling66/TahitiSpeak.git
cd TahitiSpeak
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

4. **Set up Local AI (Recommended)**:
```bash
# Install Ollama (if not already installed)
# Visit https://ollama.ai for installation instructions

# Pull the Llama 3.1 DeepSeek model
ollama pull deepseek-coder:6.7b

# Verify the model is running
ollama list
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Beta Testing

**For Educators**: See [Beta Testing Guide](docs/beta-testing/educator-comprehensive-guide.md) for comprehensive testing instructions.

**For Students**: See [Student Quick Start Guide](docs/beta-testing/student-quick-start.md) for easy setup instructions.

**Technical Setup**: See [Technical Documentation](docs/technical/setup-guide.md) for advanced configuration.

## 🛠️ Technology Stack

### Frontend & Core
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library with accessibility focus
- **Internationalization**: next-intl (English, French, Tahitian)

### AI & Language Processing
- **Local AI**: Ollama with Llama 3.1 DeepSeek model
- **Audio Processing**: Web Audio API for pronunciation analysis
- **Speech Recognition**: Browser-native APIs with AI enhancement

### Data & Storage
- **Database**: IndexedDB for offline storage
- **Authentication**: JWT tokens with role-based access
- **State Management**: React Context + Custom hooks

### Development & Quality
- **Testing**: Jest, React Testing Library, Playwright
- **PWA**: Service Workers, Workbox for offline functionality
- **CI/CD**: GitHub Actions, SonarCloud, Codecov
- **Performance**: Custom monitoring and analytics

## 📱 Progressive Web App

TahitiSpeak is built as a PWA, offering:
- Offline functionality
- App-like experience on mobile devices
- Push notifications for learning reminders
- Fast loading with service worker caching
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
NEXT_PUBLIC_APP_NAME="TahitiSpeak"
NEXT_PUBLIC_APP_VERSION="1.0.0-beta"

# Local AI Configuration
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="deepseek-coder:6.7b"
NEXT_PUBLIC_ENABLE_LOCAL_AI="true"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Features
NEXT_PUBLIC_ENABLE_OFFLINE="true"
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_BETA_TESTING="true"

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

---

**Māuruuru roa!** (Thank you very much!) for your interest in TahitiSpeak. Together, let's preserve and share the beauty of the Tahitian language! 🌺
