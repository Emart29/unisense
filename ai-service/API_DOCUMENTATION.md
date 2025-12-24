# UniSense AI Service API Documentation

## Overview

The AI Service provides lightweight analytics and predictions for the UniSense platform. It uses rule-based logic and basic statistical models to deliver insights without requiring deep learning infrastructure.

## Base URL

```
http://localhost:8001
```

## Authentication

The AI Service uses read-only database access and doesn't require authentication for internal calls from the Core Backend. In production, implement API key authentication.

## Endpoints

### Health Check

#### GET /health

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "ai-service",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Risk Detection

#### POST /risk/analyze

Analyze a student's risk level.

**Request Body:**
```json
{
  "studentId": "uuid",
  "universityId": "uuid"
}
```

**Response:**
```json
{
  "studentId": "uuid",
  "riskScore": 65.5,
  "riskLevel": "Medium Risk",
  "factors": {
    "gpaDecline": {
      "score": 30,
      "description": "GPA declined by 0.5 points"
    },
    "courseFailures": {
      "score": 25,
      "description": "Failed 2 courses"
    },
    "unpaidFees": {
      "score": 10.5,
      "description": "₦21,000 in unpaid fees"
    }
  },
  "recommendations": [
    "Schedule academic counseling session",
    "Review course load for next semester",
    "Contact finance office regarding payment plan"
  ],
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

**Risk Levels:**
- `Low Risk` - Score 0-40
- `Medium Risk` - Score 41-70
- `High Risk` - Score 71-100

**Risk Factors:**
- **GPA Decline** - Weighted by rate of decline
- **Course Failures** - Each failure adds to risk
- **Unpaid Fees** - Proportional to amount owed
- **Attendance** - Low attendance increases risk

**Status Codes:**
- `200` - Analysis successful
- `400` - Invalid request
- `404` - Student not found

---

### GPA Prediction

#### POST /gpa/predict

Predict end-semester GPA for a student.

**Request Body:**
```json
{
  "studentId": "uuid",
  "universityId": "uuid",
  "currentSemester": "2023/2024-First"
}
```

**Response:**
```json
{
  "studentId": "uuid",
  "currentGPA": 3.5,
  "predictedGPA": 3.7,
  "confidence": 78.5,
  "factors": {
    "currentPerformance": {
      "weight": 0.4,
      "value": 3.5
    },
    "historicalTrend": {
      "weight": 0.3,
      "value": 3.8
    },
    "courseLoad": {
      "weight": 0.2,
      "value": 3.6
    },
    "attendance": {
      "weight": 0.1,
      "value": 3.9
    }
  },
  "predictedAt": "2024-01-15T10:30:00Z"
}
```

**Confidence Levels:**
- `0-50%` - Low confidence (insufficient data)
- `51-75%` - Medium confidence
- `76-100%` - High confidence

**Prediction Model:**
The prediction uses a weighted linear regression model based on:
- Current semester performance (40%)
- Historical GPA trend (30%)
- Course load difficulty (20%)
- Attendance patterns (10%)

**Status Codes:**
- `200` - Prediction successful
- `400` - Invalid request
- `404` - Student not found
- `422` - Insufficient data for prediction

---

### Workload Analysis

#### POST /workload/analyze-lecturer

Analyze a lecturer's teaching workload.

**Request Body:**
```json
{
  "lecturerId": "uuid",
  "universityId": "uuid",
  "session": "2023/2024",
  "semester": "First"
}
```

**Response:**
```json
{
  "lecturerId": "uuid",
  "session": "2023/2024",
  "semester": "First",
  "courseCount": 4,
  "totalStudents": 320,
  "totalCreditUnits": 12,
  "workloadScore": 85.5,
  "status": "Overloaded",
  "courses": [
    {
      "courseCode": "CS101",
      "title": "Introduction to Programming",
      "studentCount": 120,
      "creditUnits": 3
    },
    {
      "courseCode": "CS201",
      "title": "Data Structures",
      "studentCount": 80,
      "creditUnits": 3
    }
  ],
  "recommendations": [
    "Consider redistributing CS101 to another lecturer",
    "Limit new course assignments for next semester"
  ],
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

**Workload Status:**

- `Normal` - Score 0-60
- `High` - Score 61-80
- `Overloaded` - Score 81-100

**Workload Calculation:**
```
workloadScore = (courseCount * 15) + (totalStudents / 10) + (totalCreditUnits * 2)
```

**Thresholds:**

- Normal: ≤ 3 courses, ≤ 200 students
- High: 4 courses, 201-300 students
- Overloaded: ≥ 5 courses, > 300 students

**Status Codes:**

- `200` - Analysis successful
- `400` - Invalid request
- `404` - Lecturer not found

#### POST /workload/analyze-department

Analyze workload distribution across a department.

**Request Body:**

```json
{
  "universityId": "uuid",
  "faculty": "Engineering",
  "department": "Computer Science",
  "session": "2023/2024",
  "semester": "First"
}
```

**Response:**

```json
{
  "faculty": "Engineering",
  "department": "Computer Science",
  "session": "2023/2024",
  "semester": "First",
  "lecturerCount": 8,
  "totalCourses": 24,
  "totalStudents": 1200,
  "averageWorkloadScore": 65.5,
  "lecturers": [
    {
      "lecturerId": "uuid",
      "name": "Dr. John Smith",
      "courseCount": 4,
      "studentCount": 320,
      "workloadScore": 85.5,
      "status": "Overloaded"
    }
  ],
  "recommendations": [
    "Hire 2 additional lecturers",
    "Redistribute courses from overloaded lecturers"
  ],
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

---

### Insights and Analytics

#### POST /insights/enrollment-trends

Get enrollment trends over time.

**Request Body:**
```json
{
  "universityId": "uuid",
  "startSession": "2020/2021",
  "endSession": "2023/2024",
  "groupBy": "session"
}
```

**Response:**
```json
{
  "universityId": "uuid",
  "startSession": "2020/2021",
  "endSession": "2023/2024",
  "trends": [
    {
      "period": "2020/2021",
      "totalStudents": 2500,
      "newEnrollments": 800,
      "graduations": 600,
      "suspensions": 50,
      "growthRate": 6.0
    },
    {
      "period": "2021/2022",
      "totalStudents": 2650,
      "newEnrollments": 850,
      "graduations": 620,
      "suspensions": 45,
      "growthRate": 6.0
    }
  ],
  "summary": {
    "totalGrowth": 18.0,
    "averageGrowthRate": 6.0,
    "projectedNextYear": 2809
  },
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

**Group By Options:**
- `session` - Academic session
- `semester` - Semester
- `month` - Monthly

#### POST /insights/pass-fail-heatmap

Generate pass/fail heatmap for courses.

**Request Body:**
```json
{
  "universityId": "uuid",
  "session": "2023/2024",
  "semester": "First",
  "faculty": "Engineering",
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "universityId": "uuid",
  "session": "2023/2024",
  "semester": "First",
  "faculty": "Engineering",
  "department": "Computer Science",
  "courses": [
    {
      "courseCode": "CS101",
      "title": "Introduction to Programming",
      "totalStudents": 120,
      "passed": 95,
      "failed": 25,
      "passRate": 79.2,
      "averageScore": 65.5,
      "difficulty": "Medium"
    },
    {
      "courseCode": "CS301",
      "title": "Algorithm Design",
      "totalStudents": 60,
      "passed": 30,
      "failed": 30,
      "passRate": 50.0,
      "averageScore": 52.3,
      "difficulty": "High"
    }
  ],
  "summary": {
    "totalCourses": 12,
    "averagePassRate": 72.5,
    "difficultCourses": ["CS301", "CS401"],
    "easyCourses": ["CS101", "CS102"]
  },
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

**Difficulty Levels:**
- `Easy` - Pass rate > 80%
- `Medium` - Pass rate 60-80%
- `High` - Pass rate < 60%

#### POST /insights/department-performance

Analyze department performance metrics.

**Request Body:**
```json
{
  "universityId": "uuid",
  "session": "2023/2024",
  "faculty": "Engineering"
}
```

**Response:**
```json
{
  "universityId": "uuid",
  "session": "2023/2024",
  "faculty": "Engineering",
  "departments": [
    {
      "department": "Computer Science",
      "studentCount": 450,
      "averageGPA": 3.5,
      "passRate": 85.5,
      "graduationRate": 78.0,
      "atRiskStudents": 45,
      "ranking": 1
    },
    {
      "department": "Electrical Engineering",
      "studentCount": 380,
      "averageGPA": 3.2,
      "passRate": 80.0,
      "graduationRate": 75.0,
      "atRiskStudents": 52,
      "ranking": 2
    }
  ],
  "facultySummary": {
    "totalStudents": 1200,
    "averageGPA": 3.35,
    "averagePassRate": 82.5,
    "averageGraduationRate": 76.5
  },
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

---

## Data Models

### Risk Score Calculation

```python
risk_score = (
    gpa_decline_factor * 30 +
    failure_count * 12.5 +
    unpaid_fees_factor * 20 +
    attendance_factor * 15 +
    credit_overload_factor * 10
)
```

### GPA Prediction Model

```python
predicted_gpa = (
    current_performance * 0.4 +
    historical_trend * 0.3 +
    course_difficulty * 0.2 +
    attendance_rate * 0.1
)

confidence = min(100, (
    data_completeness * 0.5 +
    historical_accuracy * 0.3 +
    sample_size_factor * 0.2
) * 100)
```

---

## Error Responses

```json
{
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "Not enough historical data to make prediction",
    "details": {
      "requiredSemesters": 2,
      "availableSemesters": 1
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Codes

- `INSUFFICIENT_DATA` - Not enough data for analysis
- `INVALID_PARAMETERS` - Invalid request parameters
- `STUDENT_NOT_FOUND` - Student doesn't exist
- `LECTURER_NOT_FOUND` - Lecturer doesn't exist
- `DATABASE_ERROR` - Database connection error

---

## Performance

- Average response time: < 200ms
- Concurrent requests: Up to 100
- Cache TTL: 5 minutes for analytics
- Database: Read-only replica

---

## Deployment

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/unisense
MODEL_PATH=/app/models
LOG_LEVEL=INFO
CACHE_TTL=300
```

### Docker

```bash
docker build -t unisense-ai-service .
docker run -p 8001:8001 \
  -e DATABASE_URL=postgresql://... \
  unisense-ai-service
```

---

## Future Enhancements

- Deep learning models for dropout prediction
- Natural language processing for feedback analysis
- Computer vision for attendance tracking
- Reinforcement learning for course recommendations
- Time series forecasting for enrollment planning

---

## Support

For AI Service support, contact: ai-support@unisense.com
