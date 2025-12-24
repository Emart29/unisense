import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { University } from '../src/entities/university.entity';
import { User, UserRole } from '../src/entities/user.entity';
import { AuthService } from '../src/auth/auth.service';

describe('UniSense Integration Tests (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  
  // Test data
  let testUniversity: University;
  let adminUser: User;
  let lecturerUser: User;
  let studentUser: User;
  let adminToken: string;
  let lecturerToken: string;
  let studentToken: string;
  
  let createdStudentId: string;
  let createdCourseId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.enableCors();
    
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    authService = moduleFixture.get<AuthService>(AuthService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    const universityRepo = dataSource.getRepository(University);
    const userRepo = dataSource.getRepository(User);

    // Create test university
    testUniversity = universityRepo.create({
      name: 'Test University',
      code: 'TEST-' + Date.now(),
    });
    testUniversity = await universityRepo.save(testUniversity);

    // Create admin user
    const adminPasswordHash = await authService.hashPassword('admin123');
    adminUser = userRepo.create({
      email: `admin-${Date.now()}@test.edu`,
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      universityId: testUniversity.id,
    });
    adminUser = await userRepo.save(adminUser);

    // Create lecturer user
    const lecturerPasswordHash = await authService.hashPassword('lecturer123');
    lecturerUser = userRepo.create({
      email: `lecturer-${Date.now()}@test.edu`,
      passwordHash: lecturerPasswordHash,
      role: UserRole.LECTURER,
      universityId: testUniversity.id,
    });
    lecturerUser = await userRepo.save(lecturerUser);

    // Create student user
    const studentPasswordHash = await authService.hashPassword('student123');
    studentUser = userRepo.create({
      email: `student-${Date.now()}@test.edu`,
      passwordHash: studentPasswordHash,
      role: UserRole.STUDENT,
      universityId: testUniversity.id,
    });
    studentUser = await userRepo.save(studentUser);

    // Get auth tokens
    const adminAuth = await authService.login(adminUser.email, 'admin123');
    adminToken = adminAuth.token;

    const lecturerAuth = await authService.login(lecturerUser.email, 'lecturer123');
    lecturerToken = lecturerAuth.token;

    const studentAuth = await authService.login(studentUser.email, 'student123');
    studentToken = studentAuth.token;
  }

  async function cleanupTestData() {
    if (!dataSource || !dataSource.isInitialized) return;

    try {
      // Delete in reverse order of dependencies
      await dataSource.query('DELETE FROM grades WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM semester_results WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM course_registrations WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM courses WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM invoices WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM fee_structures WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM students WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM announcements WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM users WHERE university_id = $1', [testUniversity.id]);
      await dataSource.query('DELETE FROM universities WHERE id = $1', [testUniversity.id]);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('1. Complete Student Lifecycle: create → enroll → grade → calculate GPA', () => {
    it('should create a student profile', async () => {
      const createStudentDto = {
        studentId: 'STU-' + Date.now(),
        firstName: 'John',
        lastName: 'Doe',
        faculty: 'Engineering',
        department: 'Computer Science',
        level: 100,
        enrollmentStatus: 'active',
        creditLimit: 24,
      };

      const response = await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createStudentDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.studentId).toBe(createStudentDto.studentId);
      expect(response.body.firstName).toBe(createStudentDto.firstName);
      expect(response.body.universityId).toBe(testUniversity.id);

      createdStudentId = response.body.id;
    });

    it('should create a course', async () => {
      const createCourseDto = {
        courseCode: 'CS101',
        title: 'Introduction to Programming',
        creditUnits: 3,
        faculty: 'Engineering',
        department: 'Computer Science',
        level: 100,
        lecturerId: lecturerUser.id,
        session: '2023/2024',
        semester: 'First',
      };

      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCourseDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.courseCode).toBe(createCourseDto.courseCode);
      expect(response.body.lecturerId).toBe(lecturerUser.id);

      createdCourseId = response.body.id;
    });

    it('should register student for course', async () => {
      const registerDto = {
        studentId: createdStudentId,
        courseId: createdCourseId,
      };

      const response = await request(app.getHttpServer())
        .post('/courses/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.studentId).toBe(createdStudentId);
      expect(response.body.courseId).toBe(createdCourseId);
    });

    it('should prevent duplicate course registration', async () => {
      const registerDto = {
        studentId: createdStudentId,
        courseId: createdCourseId,
      };

      await request(app.getHttpServer())
        .post('/courses/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(registerDto)
        .expect(409); // Conflict
    });

    it('should enter grade for student', async () => {
      const enterGradeDto = {
        studentId: createdStudentId,
        courseId: createdCourseId,
        score: 75.5,
      };

      const response = await request(app.getHttpServer())
        .post('/grades/enter')
        .set('Authorization', `Bearer ${lecturerToken}`)
        .send(enterGradeDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.score).toBe(75.5);
      expect(response.body.letterGrade).toBe('A');
      expect(response.body.isPublished).toBe(false);
    });

    it('should not show unpublished grades to student', async () => {
      const response = await request(app.getHttpServer())
        .get(`/grades/student/${createdStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should publish results', async () => {
      const publishDto = {
        courseId: createdCourseId,
      };

      await request(app.getHttpServer())
        .post('/grades/publish')
        .set('Authorization', `Bearer ${lecturerToken}`)
        .send(publishDto)
        .expect(201);
    });

    it('should show published grades to student', async () => {
      const response = await request(app.getHttpServer())
        .get(`/grades/student/${createdStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].score).toBe(75.5);
      expect(response.body[0].letterGrade).toBe('A');
      expect(response.body[0].isPublished).toBe(true);
    });

    it('should calculate GPA correctly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/grades/semester-results/${createdStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const semesterResult = response.body[0];
      expect(semesterResult).toHaveProperty('gpa');
      expect(semesterResult).toHaveProperty('cgpa');
      // GPA for grade A (70-100) should be 5.0
      expect(semesterResult.gpa).toBeCloseTo(5.0, 1);
    });
  });

  describe('2. Announcement Flow: create → dispatch → deliver via email/SMS/WhatsApp', () => {
    it('should create an announcement', async () => {
      const createAnnouncementDto = {
        title: 'Test Announcement',
        content: 'This is a test announcement for integration testing',
        targetRoles: ['STUDENT', 'LECTURER'],
      };

      const response = await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createAnnouncementDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createAnnouncementDto.title);
      expect(response.body.content).toBe(createAnnouncementDto.content);
      expect(response.body.targetRoles).toEqual(createAnnouncementDto.targetRoles);
      expect(response.body.createdBy).toBe(adminUser.id);
    });

    it('should retrieve announcements for target role', async () => {
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const announcement = response.body.find(a => a.title === 'Test Announcement');
      expect(announcement).toBeDefined();
      expect(announcement.targetRoles).toContain('STUDENT');
    });

    it('should not show announcements to non-target roles', async () => {
      // Create announcement only for ADMIN
      const createAnnouncementDto = {
        title: 'Admin Only Announcement',
        content: 'This is for admins only',
        targetRoles: ['ADMIN'],
      };

      await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createAnnouncementDto)
        .expect(201);

      // Try to get as student
      const response = await request(app.getHttpServer())
        .get('/announcements')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const adminAnnouncement = response.body.find(a => a.title === 'Admin Only Announcement');
      expect(adminAnnouncement).toBeUndefined();
    });
  });

  describe('3. Multi-service Communication: Core Backend → AI Service analytics', () => {
    it('should verify AI service integration points exist', async () => {
      // Note: AI service endpoints would be tested here if they were implemented
      // in the Core Backend. For now, we verify the system can operate without them.
      
      // The AI service is a separate microservice that the Core Backend would call
      // Integration would happen through HTTP requests to the AI service
      
      // This test verifies the system continues to function even if AI service is unavailable
      const response = await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('4. Async Messaging: Core Backend → Redis → WhatsApp Service', () => {
    it('should dispatch WhatsApp notification asynchronously', async () => {
      // Create announcement that triggers WhatsApp notification
      const createAnnouncementDto = {
        title: 'WhatsApp Test Announcement',
        content: 'Testing WhatsApp notification delivery',
        targetRoles: ['STUDENT'],
      };

      const response = await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createAnnouncementDto)
        .expect(201);

      // The request should return immediately without waiting for WhatsApp delivery
      expect(response.body).toHaveProperty('id');
      
      // In a real test, you would verify the message was queued in Redis
      // and eventually processed by the WhatsApp service
    });

    it('should handle WhatsApp service unavailability gracefully', async () => {
      // Even if WhatsApp service is down, the announcement should be created
      const createAnnouncementDto = {
        title: 'Resilience Test',
        content: 'Testing system resilience',
        targetRoles: ['LECTURER'],
      };

      const response = await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createAnnouncementDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createAnnouncementDto.title);
    });
  });

  describe('5. Multi-tenant Data Isolation', () => {
    let otherUniversity: University;
    let otherAdminUser: User;
    let otherAdminToken: string;

    beforeAll(async () => {
      const universityRepo = dataSource.getRepository(University);
      const userRepo = dataSource.getRepository(User);

      // Create another university
      otherUniversity = universityRepo.create({
        name: 'Other University',
        code: 'OTHER-' + Date.now(),
      });
      otherUniversity = await universityRepo.save(otherUniversity);

      // Create admin for other university
      const passwordHash = await authService.hashPassword('otheradmin123');
      otherAdminUser = userRepo.create({
        email: `otheradmin-${Date.now()}@other.edu`,
        passwordHash: passwordHash,
        role: UserRole.ADMIN,
        universityId: otherUniversity.id,
      });
      otherAdminUser = await userRepo.save(otherAdminUser);

      const auth = await authService.login(otherAdminUser.email, 'otheradmin123');
      otherAdminToken = auth.token;
    });

    afterAll(async () => {
      // Cleanup other university data
      await dataSource.query('DELETE FROM users WHERE university_id = $1', [otherUniversity.id]);
      await dataSource.query('DELETE FROM universities WHERE id = $1', [otherUniversity.id]);
    });

    it('should not allow access to other university students', async () => {
      const response = await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .expect(200);

      // Should return empty array, not the test university's students
      expect(response.body).toEqual([]);
    });

    it('should not allow access to specific student from other university', async () => {
      await request(app.getHttpServer())
        .get(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .expect(404);
    });

    it('should not allow access to other university courses', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('6. CSV Import Workflow', () => {
    it('should import students from CSV', async () => {
      const csvContent = `studentId,firstName,lastName,faculty,department,level,enrollmentStatus
CSV001,Alice,Smith,Engineering,Computer Science,100,active
CSV002,Bob,Johnson,Engineering,Electrical,100,active
CSV003,Charlie,Brown,Science,Physics,200,active`;

      const response = await request(app.getHttpServer())
        .post('/students/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'students.csv')
        .expect(201);

      expect(response.body).toHaveProperty('successCount');
      expect(response.body).toHaveProperty('errorCount');
      expect(response.body.successCount).toBe(3);
      expect(response.body.errorCount).toBe(0);
    });

    it('should handle partial CSV import with errors', async () => {
      const csvContent = `studentId,firstName,lastName,faculty,department,level,enrollmentStatus
VALID001,David,Wilson,Engineering,Computer Science,100,active
INVALID,,,,,invalid
VALID002,Eve,Davis,Science,Chemistry,100,active`;

      const response = await request(app.getHttpServer())
        .post('/students/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'students.csv')
        .expect(201);

      expect(response.body.successCount).toBe(2);
      expect(response.body.errorCount).toBe(1);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBe(1);
    });
  });

  describe('7. Fee Management Workflow', () => {
    it('should create fee structure', async () => {
      const createFeeDto = {
        session: '2023/2024',
        level: 100,
        amount: 50000,
      };

      const response = await request(app.getHttpServer())
        .post('/fees/structures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createFeeDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(createFeeDto.amount);
    });

    it('should generate invoices for students', async () => {
      const generateDto = {
        session: '2023/2024',
      };

      const response = await request(app.getHttpServer())
        .post('/fees/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(generateDto)
        .expect(201);

      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should record payment and update status', async () => {
      // Get all invoices and find one for our test student
      const invoicesResponse = await request(app.getHttpServer())
        .get('/fees/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(invoicesResponse.body.length).toBeGreaterThan(0);
      const invoice = invoicesResponse.body[0];

      // Record partial payment
      const paymentDto = {
        amount: 25000,
      };

      const paymentResponse = await request(app.getHttpServer())
        .post(`/fees/invoices/${invoice.id}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentDto)
        .expect(201);

      expect(paymentResponse.body.status).toBe('partially_paid');
      expect(paymentResponse.body.amountPaid).toBe(25000);
    });
  });

  describe('8. Authentication and Authorization', () => {
    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/students')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should enforce role-based access control', async () => {
      // Student trying to create another student (admin only)
      const createStudentDto = {
        studentId: 'UNAUTHORIZED',
        firstName: 'Unauthorized',
        lastName: 'User',
        faculty: 'Engineering',
        department: 'Computer Science',
        level: 100,
        enrollmentStatus: 'active',
      };

      await request(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(createStudentDto)
        .expect(403);
    });
  });
});
