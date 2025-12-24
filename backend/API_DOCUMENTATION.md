# UniSense Core Backend API Documentation

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints except `/auth/login` require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Interactive API Documentation

Once the backend is running, access the interactive Swagger UI at:

```
http://localhost:3000/api
```

## API Endpoints

### Authentication

#### POST /auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@university.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@university.edu",
    "role": "ADMIN",
    "universityId": "uuid"
  }
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials

#### GET /auth/profile

Get authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "admin@university.edu",
  "role": "ADMIN",
  "universityId": "uuid"
}
```

**Status Codes:**
- `200` - Profile retrieved
- `401` - Unauthorized

---

### Students

#### POST /students

Create a new student profile.

**Roles:** ADMIN

**Request Body:**
```json
{
  "studentId": "STU001",
  "firstName": "John",
  "lastName": "Doe",
  "faculty": "Engineering",
  "department": "Computer Science",
  "level": 100,
  "enrollmentStatus": "active",
  "creditLimit": 24
}
```

**Response:**
```json
{
  "id": "uuid",
  "universityId": "uuid",
  "studentId": "STU001",
  "firstName": "John",
  "lastName": "Doe",
  "faculty": "Engineering",
  "department": "Computer Science",
  "level": 100,
  "enrollmentStatus": "active",
  "creditLimit": 24,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `201` - Student created
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `409` - Conflict (duplicate student ID)

#### POST /students/import

Bulk import students from CSV file.

**Roles:** ADMIN

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (CSV file)

**CSV Format:**
```csv
studentId,firstName,lastName,faculty,department,level,enrollmentStatus
STU001,John,Doe,Engineering,Computer Science,100,active
STU002,Jane,Smith,Science,Physics,100,active
```

**Response:**
```json
{
  "successCount": 2,
  "errorCount": 0,
  "errors": []
}
```

**Status Codes:**
- `201` - Import completed
- `400` - Invalid file or format
- `401` - Unauthorized
- `403` - Forbidden

#### GET /students

Get all students (filtered by university).

**Roles:** ADMIN, DEAN, FINANCE

**Query Parameters:**
- `faculty` (optional) - Filter by faculty
- `department` (optional) - Filter by department
- `level` (optional) - Filter by level

**Response:**
```json
[
  {
    "id": "uuid",
    "studentId": "STU001",
    "firstName": "John",
    "lastName": "Doe",
    "faculty": "Engineering",
    "department": "Computer Science",
    "level": 100,
    "enrollmentStatus": "active"
  }
]
```

**Status Codes:**
- `200` - Students retrieved
- `401` - Unauthorized
- `403` - Forbidden

#### GET /students/:id

Get a specific student by ID.

**Roles:** ADMIN, DEAN, FINANCE

**Response:**
```json
{
  "id": "uuid",
  "studentId": "STU001",
  "firstName": "John",
  "lastName": "Doe",
  "faculty": "Engineering",
  "department": "Computer Science",
  "level": 100,
  "enrollmentStatus": "active",
  "creditLimit": 24
}
```

**Status Codes:**
- `200` - Student retrieved
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Student not found

---

### Courses

#### POST /courses

Create a new course.

**Roles:** ADMIN, DEAN

**Request Body:**
```json
{
  "courseCode": "CS101",
  "title": "Introduction to Programming",
  "creditUnits": 3,
  "faculty": "Engineering",
  "department": "Computer Science",
  "level": 100,
  "lecturerId": "uuid",
  "session": "2023/2024",
  "semester": "First"
}
```

**Response:**
```json
{
  "id": "uuid",
  "courseCode": "CS101",
  "title": "Introduction to Programming",
  "creditUnits": 3,
  "faculty": "Engineering",
  "department": "Computer Science",
  "level": 100,
  "lecturerId": "uuid",
  "session": "2023/2024",
  "semester": "First",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `201` - Course created
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `409` - Conflict (duplicate course)

#### POST /courses/register

Register a student for a course.

**Roles:** ADMIN, STUDENT

**Request Body:**
```json
{
  "studentId": "uuid",
  "courseId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "courseId": "uuid",
  "registeredAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `201` - Registration successful
- `400` - Credit limit exceeded
- `401` - Unauthorized
- `409` - Already registered

#### GET /courses

Get all courses (filtered by university).

**Roles:** ADMIN, DEAN, LECTURER, STUDENT

**Query Parameters:**
- `faculty` (optional)
- `department` (optional)
- `level` (optional)

**Response:**
```json
[
  {
    "id": "uuid",
    "courseCode": "CS101",
    "title": "Introduction to Programming",
    "creditUnits": 3,
    "faculty": "Engineering",
    "department": "Computer Science",
    "level": 100,
    "session": "2023/2024",
    "semester": "First"
  }
]
```

---

### Grades

#### POST /grades/enter

Enter a grade for a student.

**Roles:** LECTURER

**Request Body:**
```json
{
  "studentId": "uuid",
  "courseId": "uuid",
  "score": 75.5
}
```

**Response:**
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "courseId": "uuid",
  "score": 75.5,
  "letterGrade": "A",
  "gradePoint": 5.0,
  "isPublished": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `201` - Grade entered
- `400` - Invalid score
- `401` - Unauthorized
- `403` - Not authorized for this course

#### POST /grades/publish

Publish results for a course.

**Roles:** LECTURER

**Request Body:**
```json
{
  "courseId": "uuid"
}
```

**Response:**
```json
{
  "message": "Results published successfully"
}
```

**Status Codes:**
- `201` - Results published
- `401` - Unauthorized
- `403` - Not authorized for this course

#### GET /grades/student/:studentId

Get grades for a student.

**Roles:** STUDENT, LECTURER, ADMIN, DEAN, FINANCE

**Response:**
```json
[
  {
    "id": "uuid",
    "courseCode": "CS101",
    "courseTitle": "Introduction to Programming",
    "score": 75.5,
    "letterGrade": "A",
    "gradePoint": 5.0,
    "creditUnits": 3,
    "isPublished": true
  }
]
```

**Note:** Students can only see published grades.

#### GET /grades/semester-results/:studentId

Get semester results with GPA/CGPA.

**Roles:** STUDENT, LECTURER, ADMIN, DEAN, FINANCE

**Response:**
```json
[
  {
    "id": "uuid",
    "session": "2023/2024",
    "semester": "First",
    "gpa": 4.5,
    "cgpa": 4.5,
    "totalCredits": 18,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### Fees

#### POST /fees/structures

Create a fee structure.

**Roles:** ADMIN, FINANCE

**Request Body:**
```json
{
  "session": "2023/2024",
  "level": 100,
  "amount": 50000
}
```

**Response:**
```json
{
  "id": "uuid",
  "session": "2023/2024",
  "level": 100,
  "amount": 50000,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### POST /fees/invoices/generate

Generate invoices for all enrolled students.

**Roles:** ADMIN, FINANCE

**Request Body:**
```json
{
  "session": "2023/2024"
}
```

**Response:**
```json
{
  "count": 150,
  "message": "Invoices generated successfully"
}
```

#### POST /fees/invoices/:id/payments

Record a payment for an invoice.

**Roles:** ADMIN, FINANCE

**Request Body:**
```json
{
  "amount": 25000
}
```

**Response:**
```json
{
  "id": "uuid",
  "amount": 50000,
  "amountPaid": 25000,
  "status": "partially_paid",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Payment Status:**
- `unpaid` - No payment made
- `partially_paid` - Partial payment made
- `fully_paid` - Full payment made

#### GET /fees/invoices

Get all invoices.

**Roles:** ADMIN, FINANCE, STUDENT

**Query Parameters:**
- `session` (optional)
- `status` (optional) - unpaid, partially_paid, fully_paid
- `page` (optional) - default: 1
- `limit` (optional) - default: 50

**Response:**
```json
[
  {
    "id": "uuid",
    "studentId": "uuid",
    "session": "2023/2024",
    "amount": 50000,
    "amountPaid": 25000,
    "status": "partially_paid",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /fees/reports/export

Export financial report as CSV.

**Roles:** ADMIN, FINANCE

**Query Parameters:**
- `session` (optional)

**Response:**
CSV file download

---

### Announcements

#### POST /announcements

Create an announcement.

**Roles:** ADMIN, DEAN

**Request Body:**
```json
{
  "title": "Important Notice",
  "content": "This is an important announcement for all students.",
  "targetRoles": ["STUDENT", "LECTURER"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Important Notice",
  "content": "This is an important announcement for all students.",
  "targetRoles": ["STUDENT", "LECTURER"],
  "createdBy": "uuid",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Note:** Creating an announcement triggers notifications via email, SMS, and WhatsApp.

#### GET /announcements

Get all announcements for the authenticated user's role.

**Roles:** All

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Important Notice",
    "content": "This is an important announcement for all students.",
    "targetRoles": ["STUDENT", "LECTURER"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "fieldName",
      "reason": "Specific reason for error"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_ERROR` - Invalid credentials or token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

API requests are limited to 100 requests per minute per user.

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

---

## Multi-Tenancy

All data is automatically scoped to the authenticated user's university. Users can only access data belonging to their university.

The `university_id` is extracted from the JWT token and automatically applied to all database queries.

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response Headers:**
```
X-Total-Count: 150
X-Page: 1
X-Per-Page: 50
X-Total-Pages: 3
```

---

## Filtering and Sorting

Many endpoints support filtering and sorting:

**Query Parameters:**
- `sort` - Field to sort by (prefix with `-` for descending)
- `filter[field]` - Filter by field value

**Example:**
```
GET /students?filter[faculty]=Engineering&sort=-level
```

---

## Webhooks

The system can send webhooks for certain events:

- Student created
- Grade published
- Invoice generated
- Payment recorded

Configure webhooks in the admin panel.

---

## SDK and Client Libraries

Official client libraries:

- JavaScript/TypeScript: `@unisense/client-js`
- Python: `unisense-client`
- PHP: `unisense/client-php`

---

## Support

For API support, contact: api-support@unisense.com

For bug reports, create an issue on GitHub.
