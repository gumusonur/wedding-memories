# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Open Source Development Standards

## Quick Reference

**Project Mission**: Write code that's maintainable, secure, and accessible to contributors worldwide. Prioritize: **Community > Code**, **Documentation > Cleverness**, **Inclusion > Speed**

---

## Core Development Principles

### Clean Code Fundamentals

- **SOLID Principles**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY (Don't Repeat Yourself)**: Extract common functionality into reusable components
- **YAGNI (You Aren't Gonna Need It)**: Don't build features until they're actually needed
- **Self-Documenting**: Code should explain its purpose without excessive comments

### Community-First Development

- **Welcoming**: Code should be approachable for developers of all skill levels
- **Documented**: Every decision should be explainable to new contributors
- **Inclusive**: Consider global audience (timezone-friendly practices, clear English)
- **Transparent**: Development decisions made in public (issues, discussions)

---

## Code Quality Standards

### Function Design & Structure

```javascript
// ✅ Excellent - Self-documenting with clear purpose
/**
 * Validates user email addresses according to RFC 5322 standard.
 * Rejects common typos and disposable email providers.
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid and not disposable
 * @throws {TypeError} If email is not a string
 *
 * @example
 * isValidEmail('user@example.com') // returns true
 * isValidEmail('user@10minutemail.com') // returns false
 */
const isValidEmail = (email) => {
  if (typeof email !== "string") {
    throw new TypeError("Email must be a string");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidFormat = emailRegex.test(email);
  const isNotDisposable = !DISPOSABLE_DOMAINS.includes(email.split("@")[1]);

  return isValidFormat && isNotDisposable;
};

// ❌ Poor for open source - Unclear and uncommented
const chkEm = (e) => e && e.includes("@") && !bad.some((d) => e.endsWith(d));
```

### Naming Conventions

- **Functions**: `verifyEmailAddress()`, `calculateTotalPrice()`
- **Variables**: `userAccountData`, `isEmailValid`
- **Constants**: `MAX_RETRY_ATTEMPTS`, `API_BASE_URL`
- **Classes**: `UserService`, `PaymentProcessor`
- **Files**: `user-service.js`, `PaymentProcessor.tsx`
- **Clear English**: Avoid idioms, slang, cultural references
- **Descriptive**: `calculateShippingCost` not `calcShip`

### Function Guidelines

- **Single Responsibility**: One function, one clear purpose
- **Length**: Aim for 20-30 lines max
- **Parameters**: 3 or fewer; use objects for complex data
- **Pure Functions**: Predictable inputs/outputs, minimal side effects
- **Early Returns**: Use guard clauses to reduce nesting

---

## Security Standards

### Security by Design

- **Input Validation**: Sanitize and validate ALL user inputs
- **Output Encoding**: Prevent XSS with proper encoding
- **Authentication**: Secure token handling and session management
- **Authorization**: Principle of least privilege
- **Rate Limiting**: Protect against abuse on all public APIs

### Dependency Security

```json
{
  "dependencies": {
    "only-what-we-need": "^1.2.3"
  },
  "scripts": {
    "audit": "npm audit && npm audit fix",
    "check-licenses": "license-checker --onlyAllow MIT;Apache-2.0;BSD-3-Clause"
  }
}
```

### Security Checklist

- [ ] All user inputs validated and sanitized
- [ ] No hardcoded secrets or credentials
- [ ] Dependencies regularly updated and audited
- [ ] Rate limiting on authentication endpoints
- [ ] HTTPS enforced everywhere
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] SECURITY.md file with vulnerability reporting process

---

## Error Handling & Resilience

### Error Management

```javascript
// ✅ Excellent error handling
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

function processPayment(amount, paymentMethod, userId) {
  if (!amount || amount <= 0) {
    throw new ValidationError("Amount must be positive", "amount");
  }

  if (!isValidPaymentMethod(paymentMethod)) {
    throw new ValidationError("Invalid payment method", "paymentMethod");
  }

  return chargePayment(amount, paymentMethod, userId);
}
```

### Error Principles

- **Fail Fast**: Validate inputs immediately
- **Specific Errors**: Custom error types with context
- **User-Friendly**: Never expose technical details to users
- **Logging**: Include correlation IDs and relevant context
- **Graceful Degradation**: Non-critical failures shouldn't break the app

---

## Testing Strategy

### Test Structure & Coverage

```javascript
// ✅ Excellent test structure for open source
describe("EmailValidator", () => {
  describe("isValidEmail", () => {
    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "first.last@subdomain.example.org",
        "user+tag@example.com",
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it("should reject disposable email providers", () => {
      const disposableEmails = [
        "user@10minutemail.com",
        "test@guerrillamail.com",
      ];

      disposableEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it("should throw TypeError for non-string input", () => {
      expect(() => isValidEmail(null)).toThrow(TypeError);
      expect(() => isValidEmail(123)).toThrow(TypeError);
    });
  });
});
```

### Testing Standards

- **Coverage Target**: 80%+ overall, 100% for critical security functions
- **Test Pyramid**: Unit tests (70%), integration tests (20%), E2E tests (10%)
- **Cross-Platform**: Test on different Node.js versions and operating systems
- **Documentation Tests**: Verify examples in docs actually work
- **Performance Tests**: Ensure no regressions

---

## API Design

### Developer-Friendly APIs

```javascript
// ✅ Excellent API design
class UserManager {
  /**
   * Creates a new user with validation and proper error handling.
   *
   * @param {Object} userData - User information
   * @param {string} userData.email - Valid email address
   * @param {string} userData.password - Password (min 8 chars)
   * @param {string} [userData.name] - Optional display name
   * @returns {Promise<User>} Created user object (without password)
   * @throws {ValidationError} Invalid input data
   * @throws {ConflictError} Email already exists
   */
  async createUser(userData) {
    // Implementation with proper validation
  }
}
```

### REST Principles

- **Resource-Based URLs**: `/users/123` not `/getUser?id=123`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)
- **Consistent Response Format**: Always include data, meta, and errors fields
- **Versioning**: `/api/v1/users` for breaking changes

---

## Performance & Scalability

### Performance Targets

- **Page Load**: <3 seconds on 3G connection
- **API Response**: <200ms for data queries, <500ms for complex operations
- **Database**: <100ms for simple queries, proper indexing required
- **Bundle Size**: <300KB initial load, code splitting for larger apps

### Optimization Techniques

```javascript
// ✅ Efficient data processing
class DataProcessor {
  async processLargeDataset(data, options = {}) {
    const { chunkSize = 1000, onProgress } = options;
    const results = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const processed = await this.processChunk(chunk);
      results.push(...processed);

      if (onProgress) {
        onProgress((i + chunkSize) / data.length);
      }

      // Yield control to prevent blocking
      await new Promise((resolve) => setImmediate(resolve));
    }

    return results;
  }
}
```

---

## Documentation Standards

### README Requirements

````markdown
# Project Name

Brief description of what this project does and why it exists.

## Quick Start

```bash
npm install project-name
npm start
```
````

## Features

- Feature 1 with brief explanation
- Feature 2 with brief explanation

## Documentation

- [Installation Guide](docs/installation.md)
- [API Reference](docs/api.md)
- [Contributing Guide](CONTRIBUTING.md)

## License

[MIT](LICENSE)

````

### Code Documentation
- **Public APIs**: Full JSDoc with examples
- **Complex Logic**: Inline comments explaining "why"
- **Architecture Decisions**: Document in `/docs` folder
- **Working Examples**: Code samples in `/examples` directory
- **Tutorials**: Step-by-step guides for common use cases

---

## Accessibility & Internationalization

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Descriptive alt text for images

### Internationalization Support
```javascript
// ✅ i18n-ready code
const ERROR_MESSAGES = {
  INVALID_EMAIL: 'email_validation_failed',
  MISSING_REQUIRED_FIELD: 'required_field_missing',
  NETWORK_ERROR: 'network_connection_failed'
};

class DateFormatter {
  constructor(locale = 'en-US', options = {}) {
    this.formatter = new Intl.DateTimeFormat(locale, options);
    this.locale = locale;
  }

  format(date) {
    return this.formatter.format(date);
  }
}
````

---

## Open Source Workflow

### Issue Management

```markdown
<!-- Issue Template -->

## Bug Report / Feature Request

**Description**
Clear description of the issue or requested feature.

**Steps to Reproduce** (for bugs)

1. Step one
2. Step two
3. Expected vs actual behavior

**Environment**

- OS: [e.g., macOS 12.0]
- Node.js version: [e.g., 18.17.0]
- Package version: [e.g., 1.2.3]
```

### Pull Request Process

1. **Fork & Branch**: Create feature branches from main
2. **Small Changes**: Keep PRs focused and reviewable
3. **Tests Required**: All changes must include tests
4. **Documentation**: Update docs if changing public APIs
5. **Review Process**: At least one maintainer approval required

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm audit
```

---

## Community Guidelines

### Code of Conduct

- **Inclusive Environment**: Welcoming to all contributors
- **Respectful Communication**: Professional and constructive interactions
- **Harassment-Free**: Zero tolerance for harassment or discrimination
- **Enforcement**: Clear escalation process for violations

### Contributor Experience

- **Low Barrier to Entry**: Clear setup instructions, good first issues
- **Learning Opportunities**: Code reviews as teaching moments
- **Recognition**: Credit contributors in commits, changelogs, and documentation
- **Mentorship**: Experienced contributors guide newcomers

---

## Maintenance & Sustainability

### Long-term Health

- **Bus Factor**: Multiple maintainers for critical components
- **Knowledge Transfer**: Documented processes and decisions
- **Response Time**: Issues acknowledged within 48 hours
- **Resolution Time**: Bugs fixed within 2 weeks
- **Security**: Respond to security issues within 24 hours

### Health Metrics

- **Test Coverage**: Maintain 80%+ coverage
- **Dependencies**: Keep dependencies up to date
- **Performance**: No regressions in key metrics
- **Community**: Active contributor growth

---

## License & Legal Considerations

### License Selection

- **MIT**: Most permissive, good for libraries
- **Apache 2.0**: Patent protection, good for larger projects
- **GPL v3**: Copyleft, ensures derivative works remain open
- **License Compatibility**: Ensure all dependencies are compatible

### Copyright & Attribution

```javascript
/**
 * Copyright (c) 2025 Project Contributors
 * SPDX-License-Identifier: MIT
 */
```

---

## Getting Started Checklist

### New Project Setup

- [ ] README.md with clear description and quick start
- [ ] LICENSE file with appropriate open source license
- [ ] CONTRIBUTING.md with contribution guidelines
- [ ] CODE_OF_CONDUCT.md
- [ ] SECURITY.md with vulnerability reporting process
- [ ] Issue and PR templates
- [ ] CI/CD pipeline setup
- [ ] Test coverage reporting
- [ ] Documentation site

### Community Building

- [ ] Good first issues labeled and documented
- [ ] Mentorship program for new contributors
- [ ] Regular community updates
- [ ] Multiple communication channels
- [ ] Recognition system for contributors

Remember: Open source success comes from building a sustainable, welcoming community around quality code. Prioritize contributor experience as much as code quality.

---

## Project Overview

This is a Next.js wedding memories gallery application built with Cloudinary integration for image storage and processing. The app allows users to view photos in a masonry grid layout with modal viewing and upload functionality. Features customizable couple names through environment variables and transparent blur loading screens for better UX.

## Key Architecture

### Core Technologies

- **Next.js** (App Router) with TypeScript
- **Cloudinary** for image storage, optimization, and transformations
- **Tailwind CSS** with shadcn/ui components for styling
- **Framer Motion** for animations
- **React Global State** for state management

### Application Structure

- **App Router**: Uses Next.js app directory structure
- **Static Generation**: Images are fetched at build time via `getStaticProps`
- **Modal Navigation**: URL-based photo viewing with shallow routing (`/?photoId=X` → `/p/X`)
- **Component Architecture**: Reusable UI components in `/components` with shadcn/ui integration
- **Transparent Loading**: Blur loading screens that show content behind for better UX

### Key Files and Directories

- `app/page.tsx` - Main gallery page with masonry layout
- `app/p/[photoId]/page.tsx` - Individual photo pages
- `app/api/upload/route.ts` - API endpoint for photo uploads
- `app/loading.tsx` - Global loading UI with transparent blur
- `components/AppLoader.tsx` - App startup loader with couple names
- `components/Upload.tsx` - Photo upload component with drawer UI
- `components/WelcomeDialog.tsx` - Guest name collection dialog
- `utils/cloudinary.ts` - Cloudinary configuration
- `utils/types.ts` - TypeScript interfaces for image data

## Development Commands

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Environment Configuration

Required environment variables:

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (public)
- `CLOUDINARY_API_KEY` - Cloudinary API key (server-side)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (server-side)
- `CLOUDINARY_FOLDER` - Folder name in Cloudinary for photo storage
- `NEXT_PUBLIC_BRIDE_NAME` - Bride's name for display throughout the app
- `NEXT_PUBLIC_GROOM_NAME` - Groom's name for display throughout the app

## Image Handling Architecture

### Image Flow

1. **Upload**: Photos uploaded via `/api/upload` endpoint to Cloudinary
2. **Storage**: Images stored in configured Cloudinary folder with guest context
3. **Retrieval**: `getStaticProps` fetches images from Cloudinary at build time
4. **Display**: Images served with Cloudinary transformations (720px width, optimized)
5. **Blur Placeholders**: Generated server-side for better loading experience

### Cloudinary Integration

- Images fetched using Cloudinary Search API with folder filtering
- Automatic image optimization and responsive sizing
- Blur placeholder generation for smooth loading
- Upload API handles base64 file conversion

## UI/UX Patterns

### Layout System

- **Masonry Grid**: Responsive columns (1-4 based on screen size)
- **Modal Navigation**: URL-preserving photo viewing with keyboard/swipe navigation
- **Drawer Upload**: Bottom drawer for mobile-friendly photo upload

### Styling Architecture

- **Tailwind CSS**: Utility-first styling with custom theme extensions
- **shadcn/ui**: Pre-built accessible components (Button, Drawer, Input)
- **CSS Variables**: HSL-based color system for theme consistency
- **Responsive Design**: Mobile-first approach with custom breakpoints

## State Management

- **React Global State**: Used for tracking last viewed photo position
- **URL State**: Photo modal state managed through Next.js router
- **Local State**: Component-level state for upload form and UI interactions

## Performance Optimizations

- **Static Generation**: Images pre-fetched at build time
- **Image Optimization**: Next.js Image component with Cloudinary transformations
- **Blur Placeholders**: Smooth loading experience
- **Responsive Images**: Multiple sizes served based on viewport
