# Contributing to TahitiSpeak

Thank you for your interest in contributing to TahitiSpeak! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Provide detailed reproduction steps
4. Include environment information
5. Add screenshots or recordings if helpful

### Suggesting Features

1. Check existing feature requests
2. Use the feature request template
3. Explain the use case and benefits
4. Consider cultural relevance for Tahitian learning
5. Provide mockups or examples if possible

### Code Contributions

1. Fork the repository
2. Create a feature branch from `develop`
3. Follow our coding standards
4. Write tests for new functionality
5. Update documentation as needed
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 20.0 or higher
- npm or pnpm package manager
- Git for version control
- A code editor (VS Code recommended)

### Local Development

1. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/TahitiSpeak.git
   cd TahitiSpeak
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Run tests:**
   ```bash
   npm run test
   npm run test:e2e
   ```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Maintain strict type checking
- Document complex types with JSDoc comments
- Use meaningful variable and function names

### Code Style
- Follow ESLint and Prettier configurations
- Use consistent naming conventions
- Write self-documenting code
- Add comments for complex business logic

### Component Guidelines
- Keep components under 300 lines
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility best practices

### Testing
- Write unit tests for all new functions
- Add integration tests for complex features
- Include E2E tests for critical user flows
- Maintain test coverage above 80%

## Cultural Sensitivity

When contributing content related to Tahitian culture:

### Guidelines
- Respect cultural traditions and practices
- Verify accuracy with cultural consultants
- Use appropriate and respectful language
- Consider cultural context in design decisions
- Acknowledge traditional knowledge sources

### Content Review Process
1. Cultural content requires review by native speakers
2. Traditional stories must be properly attributed
3. Language content should be verified for accuracy
4. Cultural imagery should be respectful and appropriate

## Pull Request Process

### Before Submitting
1. Ensure all tests pass locally
2. Update documentation for new features
3. Add entries to CHANGELOG.md if applicable
4. Verify accessibility compliance
5. Test across different browsers and devices

### PR Requirements
1. Use the provided PR template
2. Include clear description of changes
3. Reference related issues
4. Add screenshots for UI changes
5. Ensure CI/CD pipeline passes

### Review Process
1. Maintainers will review within 48 hours
2. Address feedback promptly
3. Keep PR scope focused and manageable
4. Be responsive to questions and suggestions

## Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features and enhancements
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks

### Examples
```
feat(lessons): add pronunciation feedback system
fix(auth): resolve login redirect issue
docs(api): update authentication endpoints
```

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes and changelogs
- Annual contributor acknowledgments
- Special recognition for cultural contributions

## Getting Help

### Community Support
- GitHub Discussions for general questions
- Discord community for real-time chat
- Stack Overflow with `tahitispeak` tag

### Direct Contact
- Technical questions: dev@tahitispeak.com
- Cultural content: cultural@tahitispeak.com
- General inquiries: hello@tahitispeak.com

## Development Resources

### Documentation
- [API Documentation](docs/api/)
- [Architecture Overview](docs/architecture/)
- [Deployment Guide](docs/deployment/)
- [Testing Guide](docs/development/testing-guide.md)

### Tools and Extensions
- VS Code with recommended extensions
- ESLint and Prettier for code formatting
- Jest and Playwright for testing
- Storybook for component development

## Cultural Contributors

We especially welcome contributions from:
- Native Tahitian speakers
- Cultural experts and historians
- Language educators and linguists
- Community members with traditional knowledge

### Special Considerations
- Cultural content may require additional review time
- Traditional knowledge should be properly attributed
- Community consensus may be sought for sensitive content
- Cultural contributors receive special recognition

## License

By contributing to TahitiSpeak, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask questions! We're here to help and appreciate all forms of contribution, from code to documentation to cultural guidance.

Thank you for helping preserve and promote the Tahitian language! 🌺