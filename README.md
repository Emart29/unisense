# 🎓 UniSense - University Management System

> A comprehensive, AI-powered university management platform designed to streamline administrative operations and improve student outcomes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

UniSense is a modern, microservices-based university management system that combines essential administrative functions with AI-powered analytics. Built with scalability and multi-tenancy in mind, it provides universities with the tools they need to manage students, courses, grades, fees, and more—all while gaining actionable insights through machine learning.

### Key Highlights

- **Multi-tenant Architecture** - Complete data isolation for multiple universities
- **AI-Powered Insights** - Predictive analytics for student success and risk detection
- **Progressive Web App** - Works offline with automatic sync when online
- **Role-Based Access Control** - Granular permissions for Admin, Dean, Lecturer, Student, and Finance roles
- **Real-time Notifications** - WhatsApp, Email, and SMS integration
- **RESTful APIs** - Well-documented APIs with Swagger/OpenAPI
- **Property-Based Testing** - Rigorous testing for correctness guarantees

## ✨ Features

### Core Modules

#### 👥 User Management
- Multi-role support (Admin, Dean, Lecturer, Student, Finance)
- JWT-based authentication
- University-scoped access control
- Profile management

#### 📚 Student Information System (SIS)
- Student registration and enrollment
- Bulk CSV import/export
- Academic records management
- Student profile with photo support

#### 📖 Course Management
- Course catalog and scheduling
- Course registration workflow
- Credit hour tracking
- Prerequisite management

#### 📊 Grading System
- Flexible grading scales
- GPA and CGPA calculation
- Semester results tracking
- Grade distribution analytics

#### 💰 Fee Management
- Fee structure configuration
- Invoice generation
- Payment tracking
- Outstanding balance reports
- Export to Excel/PDF

#### 📢 Announcements & Notifications
- Role-targeted announcements
- Multi-channel delivery (WhatsApp, Email, SMS)
- Notification preferences
- Read/unread tracking

### AI-Powered Features

#### 🎯 At-Risk Student Detection
Identifies students at risk of academic failure based on:
- GPA trends and patterns
- Attendance records
- Fee payment status
- Historical performance data

#### 📈 GPA Prediction
Predicts end-of-semester GPA using:
- Current academic performance
- Course difficulty metrics
- Historical student data
- Workload analysis

#### 👨‍🏫 Lecturer Workload Analytics
Analyzes teaching loads to:
- Identify overloaded faculty
- Balance course assignments
- Optimize resource allocation
- Prevent burnout

#### 📊 Administrative Insights
Provides actionable insights on:
- Enrollment trends
- Course performance heatmaps
- Department analytics
- Resource utilization

## 🏗️ Architecture

UniSense follows a microservices architecture with four main services:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│                    Progressive Web App (PWA)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/REST
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    Core Backend (NestJS)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Auth     │  │   Business   │  │   Database   │     │
│  │   & RBAC     │  │    Logic     │  │    Layer     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────┬────────────────────┬────────────────────┬─────────┘
         │                    │                    │
         │                    │                    │
    ┌────┴─────┐      ┌──────┴──────┐      ┌─────┴──────┐
    │   AI     │      │  WhatsApp   │      │ PostgreSQL │
    │ Service  │      │   Service   │      │   + Redis  │
    │ (Python) │      │  (Python)   │      │            │
    └──────────┘      └─────────────┘      └────────────┘
```

### Service Responsibilities

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Core Backend** | NestJS + TypeORM | Authentication, business logic, data persistence |
| **Frontend** | Next.js + React | User interface, PWA capabilities, offline support |
| **AI Service** | Python + FastAPI | Machine learning models, predictive analytics |
| **WhatsApp Service** | Python + FastAPI | Asynchronous message delivery, notification queue |

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **ORM**: TypeORM
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Testing**: Jest + fast-check (property-based testing)

### Frontend
- **Framework**: Next.js 14.x
- **Language**: TypeScript 5.x
- **UI Library**: React 18.x
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library + fast-check

### AI Service
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **ML Libraries**: scikit-learn, pandas, numpy
- **Database**: PostgreSQL (read-only)
- **Testing**: pytest + Hypothesis (property-based testing)

### WhatsApp Service
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Queue**: Redis
- **API**: WhatsApp Business API
- **Testing**: pytest + Hypothesis

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (production)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (optional)

## 🚀 Getting Started

### Prerequisites

- **Docker** 24.0+ and **Docker Compose** 2.20+
- **Node.js** 20+ (for local development)
- **Python** 3.11+ (for local development)
- **PostgreSQL** 15+ (if not using Docker)
- **Redis** 7+ (if not using Docker)

### Quick Start (Docker)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Emart29/unisense.git
   cd unisense
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp ai-service/.env.example ai-service/.env
   cp whatsapp-service/.env.example whatsapp-service/.env
   ```

3. **Configure your environment**
   
   Edit the `.env` files with your configuration. At minimum, update:
   - Database credentials
   - JWT secret
   - Redis URL
   - API keys (optional for MVP)

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   docker-compose exec backend npm run migration:run
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api
   - AI Service: http://localhost:8001
   - WhatsApp Service: http://localhost:8002

### Quick Start (Windows - Manual Setup)

For Windows users without Docker/WSL2:

1. **Install dependencies**
   - PostgreSQL 15+ ([Download](https://www.postgresql.org/download/windows/))
   - Redis (Memurai for Windows: `choco install memurai`)
   - Node.js 20+ ([Download](https://nodejs.org/))
   - Python 3.11+ ([Download](https://www.python.org/downloads/))

2. **Set up database**
   ```powershell
   .\setup-database.ps1
   ```

3. **Seed test data**
   ```powershell
   .\seed-data.ps1
   ```

4. **Start all services**
   ```powershell
   .\start-services.ps1
   ```

5. **Stop all services**
   ```powershell
   .\stop-services.ps1
   ```

### Test Credentials

After seeding the database, you can login with:

| Email | Password | Role |
|-------|----------|------|
| admin@test.edu | password123 | Admin |
| dean@test.edu | password123 | Dean |
| lecturer@test.edu | password123 | Lecturer |
| student@test.edu | password123 | Student |
| finance@test.edu | password123 | Finance |

All test users belong to "Test University" (TEST_UNI).

## ⚙️ Configuration

### Environment Variables

#### Core Backend (`backend/.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=unisense

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# Redis
REDIS_URL=redis://localhost:6379

# AI Service
AI_SERVICE_URL=http://localhost:8001

# Application
NODE_ENV=development
PORT=3001
```

#### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### AI Service (`ai-service/.env`)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/unisense
MODEL_PATH=./models
```

#### WhatsApp Service (`whatsapp-service/.env`)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/unisense
REDIS_URL=redis://localhost:6379
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=your_token
WEBHOOK_SECRET=your_secret
```

### Multi-Tenancy

UniSense implements row-level multi-tenancy:
- All tables include a `university_id` column
- Middleware automatically scopes queries to the authenticated user's university
- Complete data isolation between universities

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

**Swagger UI**: http://localhost:3001/api

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile

#### Students
- `GET /students` - List all students
- `POST /students` - Create new student
- `POST /students/import` - Bulk import from CSV
- `GET /students/:id` - Get student details

#### Courses
- `GET /courses` - List all courses
- `POST /courses` - Create new course
- `POST /course-registrations` - Register student for course

#### Grades
- `POST /grades` - Submit grade
- `GET /grades/student/:id` - Get student grades
- `GET /semester-results/:id` - Get semester results with GPA

#### Fees
- `GET /invoices` - List invoices
- `POST /invoices` - Create invoice
- `GET /invoices/export` - Export invoices to Excel

#### AI Analytics
- `GET /ai/at-risk-students` - Get at-risk students
- `GET /ai/enrollment-trends` - Get enrollment trends
- `GET /ai/department-performance` - Get department analytics

## 🧪 Testing

### Running Tests

#### Backend Tests
```bash
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:cov          # With coverage
npm run test:e2e          # Integration tests
```

#### Frontend Tests
```bash
cd frontend
npm run test              # Run all tests
npm run test:watch        # Watch mode
```

#### AI Service Tests
```bash
cd ai-service
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest --cov              # With coverage
```

#### WhatsApp Service Tests
```bash
cd whatsapp-service
pytest                    # Run all tests
pytest -v                 # Verbose output
```

### Property-Based Testing

UniSense uses property-based testing to ensure correctness:

**Backend (fast-check)**:
```typescript
// Feature: unisense-mvp, Property 14: GPA calculation correctness
test('GPA equals weighted average of grade points', () => {
  fc.assert(
    fc.property(
      fc.array(courseGradeGenerator(), { minLength: 1 }),
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

**Python Services (Hypothesis)**:
```python
@given(st.lists(student_generator(), min_size=1))
def test_risk_score_range(students):
    """Risk scores should always be between 0 and 1"""
    for student in students:
        score = calculate_risk_score(student)
        assert 0 <= score <= 1
```

## 🚢 Deployment

### Production Deployment

1. **Update environment variables** for production
   ```bash
   cp .env.example .env
   # Edit with production values
   ```

2. **Build and start services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Run migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run migration:run
   ```

4. **Set up SSL/TLS** with Let's Encrypt or your certificate provider

5. **Configure reverse proxy** (Nginx recommended)

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Scaling

UniSense is designed to scale horizontally:
- **Backend**: Multiple instances behind load balancer
- **Database**: Read replicas + connection pooling (PgBouncer)
- **Redis**: Redis Cluster for high availability
- **AI Service**: Multiple workers for parallel processing

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[API Documentation](http://localhost:3001/api)** - Interactive API docs (when running)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Coding standards
- Testing requirements
- Pull request process

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/), [Next.js](https://nextjs.org/), and [FastAPI](https://fastapi.tiangolo.com/)
- Property-based testing powered by [fast-check](https://github.com/dubzzz/fast-check) and [Hypothesis](https://hypothesis.readthedocs.io/)
- Icons and UI components from various open-source projects

## 📞 Support

- **Documentation**: [docs.unisense.com](https://docs.unisense.com) (coming soon)
- **Issues**: [GitHub Issues](https://github.com/Emart29/unisense/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Emart29/unisense/discussions)

## 🗺️ Roadmap

### Phase 1 (Current - MVP)
- ✅ Core modules (Users, Students, Courses, Grades, Fees)
- ✅ AI-powered analytics
- ✅ Multi-tenancy
- ✅ PWA support
- ✅ Property-based testing

### Phase 2 (Q2 2024)
- [ ] Online payment integration (Paystack/Flutterwave)
- [ ] Student self-service portal
- [ ] Timetable automation
- [ ] Enhanced AI models
- [ ] Mobile apps (iOS/Android)

### Phase 3 (Q3-Q4 2024)
- [ ] Hostel management
- [ ] Research & grants tracking
- [ ] Multi-campus support
- [ ] Ministry reporting APIs
- [ ] Advanced analytics dashboard

---

## 👨‍💻 Author

**Emmanuel Nwanguma**

- GitHub: [@Emart29](https://github.com/Emart29)
- LinkedIn: [Emmanuel Nwanguma](https://www.linkedin.com/in/nwangumaemmanuel)

---

**Made with ❤️ for universities across Africa and beyond**
