# Contributing to UniSense

Thank you for your interest in contributing to UniSense! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Add upstream remote: `git remote add upstream <original-repo-url>`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### 1. Set Up Development Environment

Follow the setup instructions in [SETUP.md](SETUP.md) to get your local environment running.

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

Before submitting a pull request:

```bash
# Run backend tests
cd backend
npm run test
npm run lint

# Run AI service tests
cd ai-service
pytest

# Run WhatsApp service tests
cd whatsapp-service
pytest

# Run frontend tests
cd frontend
npm run test
npm run lint
```

### 4. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add student bulk import validation"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Code Style Guidelines

### TypeScript/JavaScript (Backend & Frontend)

- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable and function names
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises when possible
- Add JSDoc comments for public APIs

**Example:**
```typescript
/**
 * Calculates the GPA for a student in a given semester
 * @param studentId - The unique identifier of the student
 * @param semesterId - The semester identifier
 * @returns The calculated GPA
 */
async calculateGPA(studentId: string, semesterId: string): Promise<number> {
  // Implementation
}
```

### Python (AI & WhatsApp Services)

- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions and classes
- Use meaningful variable names
- Keep functions focused and small

**Example:**
```python
def calculate_risk_score(student_id: str) -> RiskScore:
    """
    Calculates the risk score for a student based on multiple factors.
    
    Args:
        student_id: The unique identifier of the student
        
    Returns:
        RiskScore object containing the score and classification
    """
    # Implementation
```

## Testing Guidelines

### Unit Tests

- Write tests for all new features
- Aim for high code coverage (>80%)
- Test edge cases and error conditions
- Use descriptive test names

**Backend Example:**
```typescript
describe('GradeService', () => {
  describe('calculateGPA', () => {
    it('should calculate correct GPA for valid grades', async () => {
      // Test implementation
    });

    it('should handle empty grade list', async () => {
      // Test implementation
    });
  });
});
```

**Python Example:**
```python
def test_risk_score_calculation():
    """Test that risk score is calculated correctly"""
    # Test implementation

def test_risk_score_with_no_data():
    """Test risk score calculation with missing data"""
    # Test implementation
```

### Property-Based Tests

For critical business logic, use property-based testing:

**Backend (fast-check):**
```typescript
// Feature: unisense-mvp, Property 14: GPA calculation correctness
test('GPA equals weighted average of grade points', () => {
  fc.assert(
    fc.property(
      fc.array(courseGradeGenerator(), { minLength: 1, maxLength: 10 }),
      (grades) => {
        const gpa = calculateGPA(grades);
        const expected = weightedAverage(grades);
        expect(gpa).toBeCloseTo(expected, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

Test complete workflows:

```typescript
describe('Student Registration Flow', () => {
  it('should complete full registration workflow', async () => {
    // Create student
    // Enroll in courses
    // Verify registration
  });
});
```

## Database Migrations

When modifying database schema:

1. Create a migration:
```bash
npm run migration:create -- src/migrations/YourMigrationName
```

2. Implement `up()` and `down()` methods
3. Test the migration locally
4. Test the rollback (`down()` method)

## Documentation

Update documentation when:
- Adding new features
- Changing APIs
- Modifying configuration
- Updating dependencies

## Pull Request Process

1. **Update Documentation**: Ensure README, API docs, and comments are updated
2. **Add Tests**: Include tests for new functionality
3. **Run All Tests**: Ensure all tests pass
4. **Update Changelog**: Add entry to CHANGELOG.md (if exists)
5. **Request Review**: Tag relevant reviewers
6. **Address Feedback**: Respond to review comments promptly

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## Reporting Bugs

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, Docker version, etc.
6. **Logs**: Relevant error messages or logs
7. **Screenshots**: If applicable

## Suggesting Features

When suggesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: Your suggested approach
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Any other relevant information

## Project Structure

Understanding the project structure:

```
unisense/
├── backend/              # NestJS Core Backend
│   ├── src/
│   │   ├── auth/        # Authentication
│   │   ├── users/       # User management
│   │   ├── students/    # Student management
│   │   ├── courses/     # Course management
│   │   ├── grades/      # Grading system
│   │   ├── fees/        # Fee management
│   │   ├── entities/    # Database entities
│   │   ├── migrations/  # Database migrations
│   │   └── config/      # Configuration
│   └── test/            # Tests
├── frontend/            # Next.js Frontend
│   ├── pages/          # Next.js pages
│   ├── components/     # React components
│   └── styles/         # CSS/styling
├── ai-service/         # Python AI Service
│   ├── main.py
│   ├── risk_detector.py
│   ├── gpa_predictor.py
│   └── tests/
├── whatsapp-service/   # Python WhatsApp Service
│   ├── main.py
│   └── tests/
└── .github/
    └── workflows/      # CI/CD pipelines
```

## Questions?

If you have questions:
- Check existing documentation
- Search closed issues
- Ask in discussions
- Contact maintainers

Thank you for contributing to UniSense!
