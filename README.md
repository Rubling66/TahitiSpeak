# TahitiSpeak

## Content

The records a caller can mean are defined in `src/content.ts`. That file is the contract. It names the records and their fields.


Web app for learning French and Tahitian. Not a dconsult shop product.

## Features in this repository

- Lessons with progressive modules
- Pronunciation practice through the Web Speech API
- English, French, and Tahitian interface strings (`next-intl`)
- Offline page via the service worker
- Admin screens for content and keys
- JWT authentication
- Jest and Playwright tests
- GitHub Actions workflows

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or pnpm package manager

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

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library, Playwright
- **Database**: IndexedDB for offline storage
- **Authentication**: JWT tokens
- **Internationalization**: next-intl
- **Audio Processing**: Web Audio API
- **PWA**: Service Workers, Workbox
- **CI**: GitHub Actions. Codecov is wired. The SonarCloud project key in `setup-github.md` is still a placeholder. The production deploy job in `ci.yml` is a comment stub.
- **Analytics**: Custom performance monitoring

## 📱 Progressive Web App

TahitiSpeak is built as a PWA, offering:
- Offline functionality
- App-like experience on mobile devices
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

Workflows in this repository:

- Jest and Playwright are scripted
- Codecov upload is wired in GitHub Actions
- SonarCloud is referenced, and `setup-github.md` still has a placeholder project key
- `ci.yml` has a production deploy job whose body is a comment, not a host deploy

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

---

**Māuruuru roa!** (Thank you very much!) for your interest in TahitiSpeak. Together, let's preserve and share the beauty of the Tahitian language! 🌺
