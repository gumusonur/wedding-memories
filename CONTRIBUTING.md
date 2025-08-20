# Contributing to Wedding Memories Gallery

Thank you for your interest in contributing to the Wedding Memories Gallery! This document provides guidelines for contributing to this project.

## Code of Conduct

- **Inclusive Environment**: Welcoming to all contributors
- **Respectful Communication**: Professional and constructive interactions
- **Harassment-Free**: Zero tolerance for harassment or discrimination
- **Enforcement**: Clear escalation process for violations

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- Cloudinary account for testing image uploads

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wedding-memories.git
   cd wedding-memories
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Cloudinary credentials
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## Development Guidelines

### Code Quality Standards

- **TypeScript strict mode** with comprehensive type safety
- **WCAG 2.1 AA accessibility** compliance throughout
- **Security-first validation** with input sanitization
- **Mobile-first responsive design** approach
- **Performance optimizations** with caching and progressive loading

### Naming Conventions

- **Functions**: `uploadPhotos()`, `generateBlurPlaceholder()`, `validateImageFile()`
- **Variables**: `photoMetadata`, `isUploadComplete`, `galleryState`
- **Constants**: `MAX_FILE_SIZE`, `CLOUDINARY_FOLDER`, `IMAGE_QUALITY`
- **Components**: `PhotoGallery`, `CachedModal`, `WelcomeDialog`
- **Files**: `photo-gallery.tsx`, `useAppStore.ts`, `cloudinary.ts`

### Function Guidelines

- **Single Responsibility**: One function, one clear purpose
- **Length**: Aim for 20-30 lines max
- **Parameters**: 3 or fewer; use objects for complex data
- **Pure Functions**: Predictable inputs/outputs, minimal side effects
- **Early Returns**: Use guard clauses to reduce nesting

## Security Standards

### Security Checklist

- [ ] All user inputs validated and sanitized
- [ ] No hardcoded secrets or credentials
- [ ] File type validation for uploads
- [ ] File size limits enforced
- [ ] Rate limiting considered for APIs
- [ ] XSS prevention (output encoding)
- [ ] Environment variables properly secured

### Guest Experience Priority

- **Intuitive Interface**: Any guest should be able to upload photos without instructions
- **Mobile First**: Most guests will use their phones to upload photos
- **Fast Loading**: Photos should load quickly even on slow connections
- **Graceful Failures**: Upload failures should never crash the experience
- **Privacy Aware**: Guest names are stored but photos remain publicly viewable

## Testing

### Test Structure

```typescript
describe("ImageValidator", () => {
  describe("validateImageFile", () => {
    it("should accept valid image files", async () => {
      const validFiles = [
        createMockFile('photo.jpg', 'image/jpeg', 2 * 1024 * 1024),
        createMockFile('wedding.png', 'image/png', 5 * 1024 * 1024),
      ];

      for (const file of validFiles) {
        await expect(validateImageFile(file)).resolves.toBe(true);
      }
    });

    it("should reject oversized files", async () => {
      const oversizedFile = createMockFile('huge.jpg', 'image/jpeg', 20 * 1024 * 1024);
      await expect(validateImageFile(oversizedFile)).rejects.toThrow('File too large');
    });
  });
});
```

### Testing Standards

- **Coverage Target**: 80%+ overall, 100% for critical security functions
- **Test Types**: Unit tests for utilities, integration tests for API routes
- **Mobile Testing**: Test upload functionality on various devices
- **Accessibility Testing**: Verify keyboard navigation and screen readers

## Pull Request Process

### Before Submitting

1. **Quality Checks**
   ```bash
   pnpm lint        # Run ESLint
   pnpm type-check  # TypeScript validation
   pnpm build       # Ensure build succeeds
   pnpm format      # Format code
   ```

2. **Test Your Changes**
   - Test photo upload functionality
   - Verify modal navigation works
   - Check responsive design on mobile
   - Validate accessibility features

3. **Documentation**
   - Update README.md if adding features
   - Add JSDoc comments for new functions
   - Update environment variable documentation if needed

### Pull Request Guidelines

1. **Branch Naming**: Use descriptive names like `feature/upload-progress` or `fix/modal-navigation`
2. **Commit Messages**: Clear, concise descriptions of changes
3. **Description**: Explain what changes were made and why
4. **Screenshots**: Include before/after screenshots for UI changes
5. **Testing**: Describe how you tested the changes

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Upload functionality tested
- [ ] Modal navigation verified
- [ ] Mobile responsiveness checked
- [ ] Accessibility validated

## Screenshots
<!-- Include screenshots for UI changes -->

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No console errors or warnings
- [ ] Build passes without errors
```

## Issue Management

### Bug Reports

```markdown
## Bug Description
Clear description of the issue.

## Steps to Reproduce
1. Step one
2. Step two
3. Expected vs actual behavior

## Environment
- Browser: [e.g., Chrome 120, Safari 17, Firefox 121]
- Device: [e.g., iPhone 13, Samsung Galaxy S23, MacBook Pro M2]
- OS: [e.g., iOS 17, Android 14, macOS 14, Windows 11]

## Screenshots
<!-- Include screenshots if applicable -->
```

### Feature Requests

```markdown
## Feature Description
Clear description of the requested feature.

## Use Case
Why would this feature be useful?

## Proposed Solution
How do you envision this working?

## Additional Context
Any other context or screenshots about the feature request.
```

## Image Handling Standards

### File Requirements

- **File Size Limits**: 10MB maximum per image (prevents mobile upload failures)
- **Format Support**: JPEG, PNG, WebP (covers all modern devices)
- **Compression**: Automatic server-side compression for optimal loading
- **Metadata Preservation**: Keep guest names and upload timestamps
- **Progressive Loading**: Show blur placeholders before high-quality images

### Cloudinary Integration

- Images stored in configured folder with proper organization
- Automatic optimization and responsive sizing
- Blur placeholder generation for smooth loading
- Upload API handles base64 file conversion securely

## Performance Guidelines

### Performance Targets

- **Page Load**: <3 seconds on 3G connection
- **Image Loading**: Progressive with blur placeholders
- **Upload Speed**: Optimized with compression and progress tracking
- **Bundle Size**: Minimized with code splitting

### Optimization Techniques

- Use Next.js Image component for automatic optimization
- Implement proper caching strategies
- Lazy load images outside viewport
- Compress images before upload when possible

## Accessibility Requirements

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 for normal text
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Descriptive alt text for images

### Testing Accessibility

- Test with keyboard-only navigation
- Use screen reader software
- Verify color contrast ratios
- Check focus management in modals

## Release Process

### Version Management

- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Update package.json version before release
- Create release notes documenting changes

### Deployment

1. **Staging**: Test on staging environment first
2. **Production**: Deploy to production after staging validation
3. **Monitoring**: Monitor for errors after deployment
4. **Rollback**: Be prepared to rollback if issues arise

## Getting Help

### Resources

- Check existing issues and PRs first
- Review the codebase documentation
- Test your changes thoroughly before submitting

### Communication

- Use GitHub issues for bug reports and feature requests
- Be clear and specific in your descriptions
- Provide context and examples when possible

## Recognition

Contributors will be recognized in:
- GitHub contributor list
- Release notes for significant contributions
- Project documentation when appropriate

Thank you for contributing to making wedding memories more accessible and enjoyable for everyone! 🎉