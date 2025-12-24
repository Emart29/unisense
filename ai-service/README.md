# UniSense AI Service

Lightweight analytics and predictions service for the UniSense university management platform.

## Overview

The AI Service provides analytics and predictive capabilities including:

- **Risk Detection**: Identifies at-risk students based on GPA trends, failures, and unpaid fees
- **GPA Prediction**: Predicts end-semester GPA with confidence indicators
- **Workload Analysis**: Analyzes lecturer teaching load
- **Insights Generation**: Provides enrollment trends, pass/fail heatmaps, and department performance metrics

## Architecture

- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (read-only connection)
- **ML Library**: scikit-learn for linear regression
- **Testing**: Hypothesis for property-based testing

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL database (shared with Core Backend)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database connection string
```

### Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/unisense
MODEL_PATH=./models
```

## Running the Service

### Development

```bash
uvicorn main:app --reload --port 8001
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Docker

```bash
docker build -t unisense-ai-service .
docker run -p 8001:8001 --env-file .env unisense-ai-service
```

## API Endpoints

### Health Check

```
GET /health
```

Returns service health status.

### Risk Detection

```
GET /api/risk/student/{student_id}?university_id={university_id}
```

Analyzes student risk based on:

- GPA trend (declining GPA increases risk)
- Course failures (F grades)
- Unpaid fees

**Response:**

```json
{
  "student_id": "uuid",
  "risk_score": 45.5,
  "risk_level": "Medium Risk",
  "factors": {
    "gpa_trend": 20.0,
    "failures": 40.0,
    "unpaid_fees": 50.0
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GPA Prediction

```
GET /api/gpa/predict/{student_id}?university_id={university_id}
```

Predicts end-semester GPA using linear regression on historical data.

**Response:**

```json
{
  "student_id": "uuid",
  "predicted_gpa": 3.2,
  "confidence": 75.5,
  "current_gpa": 3.0,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Workload Analysis

```
GET /api/workload/lecturer/{lecturer_id}?university_id={university_id}
```

Analyzes lecturer teaching load.

**Response:**

```json
{
  "lecturer_id": "uuid",
  "course_count": 4,
  "total_students": 180,
  "workload_score": 170.0,
  "is_overloaded": false,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Enrollment Trends

```
GET /api/insights/enrollment-trends?university_id={university_id}
```

Returns enrollment trends over time.

**Response:**

```json
{
  "university_id": "uuid",
  "trends": [
    {"period": "2023-2024-First", "value": 1200},
    {"period": "2023-2024-Second", "value": 1250}
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Pass/Fail Heatmap

```
GET /api/insights/pass-fail-heatmap?university_id={university_id}
```

Generates course performance heatmap.

**Response:**

```json
{
  "university_id": "uuid",
  "courses": [
    {
      "course_code": "CS101",
      "course_title": "Introduction to Programming",
      "pass_rate": 85.5,
      "fail_rate": 14.5,
      "total_students": 120
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Department Performance

```
GET /api/insights/department-performance?university_id={university_id}
```

Aggregates department performance metrics.

**Response:**

```json
{
  "university_id": "uuid",
  "departments": [
    {
      "department": "Computer Science",
      "faculty": "Engineering",
      "average_gpa": 3.2,
      "pass_rate": 92.5,
      "total_students": 450
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Testing

### Run All Tests

```bash
pytest test_properties.py -v
```

### Run Specific Test

```bash
pytest test_properties.py::test_risk_score_computation -v
```

### Property-Based Tests

The service includes comprehensive property-based tests using Hypothesis:

1. **Risk Score Computation** - Validates risk scoring logic
2. **GPA Prediction with Confidence** - Tests prediction accuracy
3. **GPA Prediction Updates** - Verifies predictions update with new data
4. **Lecturer Workload Calculation** - Tests workload metrics
5. **Enrollment Trends Accuracy** - Validates trend data
6. **Pass/Fail Heatmap Accuracy** - Tests performance metrics
7. **Department Performance Aggregation** - Validates aggregations

Each test runs 100 iterations with randomly generated data.

## Multi-Tenancy

All queries are automatically scoped by `university_id` to ensure data isolation between universities. The service uses read-only database access for security.

## Performance

- Response time target: < 500ms (p95)
- Supports horizontal scaling (stateless service)
- Database connection pooling enabled

## Security

- Read-only database access
- University-level data isolation
- No sensitive data in logs
- CORS configuration for production

## Monitoring

Key metrics to monitor:

- API response times
- Prediction accuracy
- Database query performance
- Error rates

## Future Enhancements

- Deep learning models for improved predictions
- Real-time analytics with streaming data
- Advanced anomaly detection
- Personalized student recommendations
