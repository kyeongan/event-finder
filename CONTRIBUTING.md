# Contributing to Event Finder

Thank you for your interest in contributing to Event Finder! 🎉

We welcome contributions from developers of all skill levels. Whether you're fixing a typo, adding a feature, or improving documentation, your help is appreciated!

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x or later
- npm or yarn
- Git
- A Ticketmaster API key (free at [developer.ticketmaster.com](https://developer.ticketmaster.com))

### Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/event-finder.git
   cd event-finder
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Add your Ticketmaster API key to `.env`:

   ```
   TICKETMASTER_API_KEY=your_key_here
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

   This runs both the frontend (Vite) and backend (Express) servers:

   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

5. **Run tests**
   ```bash
   npm test
   ```

## 📋 How to Contribute

### Finding Something to Work On

1. **Check open issues**: Look for issues labeled with:

   - `good-first-issue` - Great for beginners
   - `help-wanted` - We need help on these
   - `enhancement` - New features
   - `bug` - Bug fixes needed

2. **Comment on the issue**: Let us know you're working on it to avoid duplicate work

3. **Ask questions**: Don't hesitate to ask for clarification in the issue comments

### Making Changes

1. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**

   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation if needed

3. **Test your changes**

   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):

   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with:
     - What changes you made
     - Why you made them
     - Any relevant issue numbers (e.g., "Fixes #123")
     - Screenshots (if UI changes)

## 🎯 Contribution Areas

### Frontend (React + TypeScript)

**Good First Issues:**

- Add loading spinners
- Improve error messages
- Add more event filters
- Responsive design improvements

**Intermediate:**

- Implement map view for venues
- Add favorites/bookmarks functionality
- Build event detail pages
- Add pagination for search results

**Advanced:**

- Performance optimization
- Code splitting and lazy loading
- Advanced state management
- PWA implementation

### Backend (Express + TypeScript)

**Good First Issues:**

- Add request logging
- Improve error handling
- Add more API endpoints
- Cache optimization

**Intermediate:**

- Implement rate limiting
- Add database integration
- User authentication
- API versioning

**Advanced:**

- Migrate to serverless functions
- Implement recommendation engine
- Add Redis caching
- Build GraphQL API

### Design (UX/UI)

**What We Need:**

- Modern, clean interface design
- Improved color scheme and typography
- Mobile-first responsive layouts
- Accessibility improvements (WCAG compliance)
- Loading states and animations
- Error state designs

**How to Contribute:**

- Create Figma/Sketch designs
- Submit design mockups in issues
- Implement designs in CSS/styled-components
- Conduct user testing

### Documentation

**What We Need:**

- API documentation
- Component documentation
- Architecture diagrams
- User guides
- Video tutorials

### Testing

**What We Need:**

- Increase test coverage (currently 66%)
- E2E tests (Playwright/Cypress)
- Accessibility testing
- Performance testing
- Mobile testing

## 📝 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new files
- Enable strict mode
- No `any` types (use `unknown` if needed)
- Use meaningful variable names
- Add JSDoc comments for complex functions
- Prefer functional components and hooks

### React

- Use functional components
- Destructure props
- Use custom hooks for shared logic
- Keep components small and focused
- Add PropTypes or TypeScript interfaces

### CSS

- Use semantic class names
- Mobile-first approach
- Avoid inline styles
- Use CSS variables for theming

### Git

- Write clear commit messages
- Keep commits focused and atomic
- Reference issue numbers in commits
- Squash commits if requested

## 🧪 Testing Guidelines

- Write tests for all new features
- Test edge cases and error states
- Aim for >80% code coverage
- Use descriptive test names
- Mock external dependencies

```typescript
// Good test name
test('should display error message when API call fails', () => {
  // ...
});

// Bad test name
test('error test', () => {
  // ...
});
```

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description**: What happened vs. what should happen
2. **Steps to reproduce**: Detailed steps
3. **Environment**: OS, browser, Node version
4. **Screenshots**: If applicable
5. **Error messages**: Full error logs

## 💡 Suggesting Features

When suggesting features:

1. **Use case**: Why is this feature needed?
2. **Expected behavior**: How should it work?
3. **Alternatives**: Any alternative solutions?
4. **Mockups**: Designs or wireframes (if applicable)

## ❓ Questions?

- Open an issue with the `question` label
- Ask in PR comments
- [Optional: Join our Discord/Slack]

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, level of experience, nationality, personal appearance, race, religion, or sexual identity.

### Expected Behavior

- Be respectful and inclusive
- Welcome newcomers warmly
- Give and receive constructive feedback gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment, trolling, or discriminatory comments
- Personal attacks or insults
- Publishing private information
- Disruptive behavior

### Enforcement

Violations may result in temporary or permanent ban from the project.

## 🎉 Recognition

Contributors will be:

- Listed in our README
- Mentioned in release notes
- Given credit in commits and PRs

Thank you for contributing! 🚀
