# Integration Tests

## Overview

The integration tests in `integration.e2e-spec.ts` test end-to-end workflows across the UniSense system, including:

1. **Complete Student Lifecycle**: create → enroll → grade → calculate GPA
2. **Announcement Flow**: create → dispatch → deliver via email/SMS/WhatsApp
3. **Multi-service Communication**: Core Backend → AI Service analytics
4. **Async Messaging**: Core Backend → Redis → WhatsApp Service
5. **Multi-tenant Data Isolation**: Verify university data separation
6. **CSV Import Workflow**: Bulk student import with error handling
7. **Fee Management Workflow**: Fee structures, invoice generation, payment recording
8. **Authentication and Authorization**: Login, token validation, RBAC

## Prerequisites

Before running the integration tests, ensure you have:

1. **PostgreSQL Database** running and accessible
2. **Redis** running (for async messaging tests)
3. **Environment Variables** configured:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=unisense_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key
```

## Running with Docker Compose

The easiest way to run the integration tests is using Docker Compose:

```bash
# Start the test environment
docker-compose -f docker-compose.test.yml up -d

# Run the tests
npm run test:e2e

# Stop the test environment
docker-compose -f docker-compose.test.yml down
```

## Running Locally

If you have PostgreSQL and Redis running locally:

```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_NAME=unisense_test
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=test-secret-key

# Run the tests
npm run test:e2e
```

## Test Structure

### 1. Complete Student Lifecycle

Tests the full workflow from student creation to GPA calculation:

- Create student profile
- Create course
- Register student for course
- Prevent duplicate registration
- Enter grade
- Verify unpublished grades are hidden
- Publish results
- Verify published grades are visible
- Calculate GPA/CGPA correctly

### 2. Announcement Flow

Tests multi-channel notification system:

- Create announcement
- Retrieve announcements for target roles
- Verify role-based filtering
- Trigger email/SMS/WhatsApp notifications (async)

### 3. Multi-service Communication

Tests integration with AI Service:

- Risk detection API calls
- GPA prediction API calls
- Graceful handling of service unavailability

### 4. Async Messaging

Tests asynchronous message queue:

- WhatsApp notification dispatch
- Non-blocking announcement creation
- Resilience when WhatsApp service is down

### 5. Multi-tenant Data Isolation

Tests data separation between universities:

- Create multiple universities
- Verify users can only access their university's data
- Test cross-university access prevention

### 6. CSV Import Workflow

Tests bulk data import:

- Import valid CSV data
- Handle partial imports with errors
- Error reporting for invalid records

### 7. Fee Management Workflow

Tests financial operations:

- Create fee structures
- Generate invoices for students
- Record payments
- Update payment status (unpaid → partially_paid → fully_paid)

### 8. Authentication and Authorization

Tests security:

- Reject invalid credentials
- Reject requests without tokens
- Reject requests with invalid tokens
- Enforce role-based access control

## Test Data Cleanup

The tests automatically clean up all test data after execution. The cleanup process:

1. Deletes grades and semester results
2. Deletes course registrations
3. Deletes courses
4. Deletes invoices and fee structures
5. Deletes students
6. Deletes announcements
7. Deletes users
8. Deletes universities

## Troubleshooting

### Database Connection Errors

If you see database connection errors:

1. Verify PostgreSQL is running: `pg_isready`
2. Check connection parameters in environment variables
3. Ensure the database exists: `createdb unisense_test`

### Redis Connection Errors

If you see Redis connection errors:

1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL environment variable

### Test Timeouts

If tests timeout:

1. Increase Jest timeout in `jest-e2e.json`
2. Check database performance
3. Verify network connectivity to external services

## CI/CD Integration

To run these tests in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Start test services
  run: docker-compose -f docker-compose.test.yml up -d

- name: Wait for services
  run: |
    timeout 30 bash -c 'until pg_isready -h localhost; do sleep 1; done'
    timeout 30 bash -c 'until redis-cli ping; do sleep 1; done'

- name: Run integration tests
  run: npm run test:e2e
  working-directory: ./backend

- name: Stop test services
  run: docker-compose -f docker-compose.test.yml down
```

## Performance Considerations

- Tests run sequentially to avoid race conditions
- Each test suite creates and cleans up its own data
- Database transactions are used where possible
- Test execution time: ~30-60 seconds

## Future Enhancements

- Add performance benchmarks
- Add load testing scenarios
- Add chaos engineering tests
- Add contract testing for microservices
- Add visual regression testing for frontend
