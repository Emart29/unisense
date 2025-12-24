import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoursesService } from './courses.service';
import { Course } from '../entities/course.entity';
import { CourseRegistration } from '../entities/course-registration.entity';
import { Student } from '../entities/student.entity';
import * as fc from 'fast-check';

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: Repository<Course>;
  let courseRegistrationRepository: Repository<CourseRegistration>;
  let studentRepository: Repository<Student>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CourseRegistration),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Student),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    courseRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    courseRegistrationRepository = module.get<Repository<CourseRegistration>>(getRepositoryToken(CourseRegistration));
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Feature: unisense-mvp, Property 8: Course creation completeness
   * Validates: Requirements 3.1
   * 
   * For any valid course data, creating a course should store all fields
   * (code, title, credit units, lecturer) and make them retrievable.
   */
  describe('Property 8: Course creation completeness', () => {
    it('should create and store all course fields correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            courseCode: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()),
            title: fc.string({ minLength: 5, maxLength: 50 }),
            creditUnits: fc.integer({ min: 1, max: 6 }),
            faculty: fc.constantFrom('Engineering', 'Science', 'Arts', 'Medicine'),
            department: fc.string({ minLength: 3, maxLength: 20 }),
            level: fc.constantFrom(100, 200, 300, 400, 500),
            lecturerId: fc.option(fc.uuid(), { nil: null }),
            session: fc.constantFrom('2023/2024', '2024/2025'),
            semester: fc.constantFrom('First', 'Second'),
          }),
          async (courseData) => {
            // Mock repository to return null (no existing course)
            jest.spyOn(courseRepository, 'findOne').mockResolvedValue(null);
            
            // Mock create and save
            const createdCourse = { id: fc.sample(fc.uuid(), 1)[0], ...courseData, createdAt: new Date() };
            jest.spyOn(courseRepository, 'create').mockReturnValue(createdCourse as any);
            jest.spyOn(courseRepository, 'save').mockResolvedValue(createdCourse as any);

            const result = await service.create(courseData);

            // Verify all fields are stored
            expect(result.universityId).toBe(courseData.universityId);
            expect(result.courseCode).toBe(courseData.courseCode);
            expect(result.title).toBe(courseData.title);
            expect(result.creditUnits).toBe(courseData.creditUnits);
            expect(result.faculty).toBe(courseData.faculty);
            expect(result.department).toBe(courseData.department);
            expect(result.level).toBe(courseData.level);
            expect(result.lecturerId).toBe(courseData.lecturerId);
            expect(result.session).toBe(courseData.session);
            expect(result.semester).toBe(courseData.semester);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: unisense-mvp, Property 9: Credit limit enforcement
   * Validates: Requirements 3.2
   * 
   * For any student and set of course registrations, the total registered
   * credit units should never exceed the student's credit limit.
   */
  describe('Property 9: Credit limit enforcement', () => {
    it('should reject registration when credit limit would be exceeded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            studentId: fc.uuid(),
            creditLimit: fc.integer({ min: 12, max: 30 }),
            existingCredits: fc.integer({ min: 0, max: 24 }),
            newCourseCredits: fc.integer({ min: 1, max: 6 }),
          }),
          async (testData) => {
            const { universityId, studentId, creditLimit, existingCredits, newCourseCredits } = testData;
            
            // Create mock student
            const mockStudent = {
              id: studentId,
              universityId,
              creditLimit,
            };

            // Create mock course
            const courseId = fc.sample(fc.uuid(), 1)[0];
            const mockCourse = {
              id: courseId,
              universityId,
              creditUnits: newCourseCredits,
            };

            // Create mock existing registrations
            const mockRegistrations = existingCredits > 0 ? [{
              studentId,
              courseId: fc.sample(fc.uuid(), 1)[0],
              course: { creditUnits: existingCredits },
            }] : [];

            // Mock repository calls
            jest.spyOn(studentRepository, 'findOne').mockResolvedValue(mockStudent as any);
            jest.spyOn(courseRepository, 'findOne').mockResolvedValue(mockCourse as any);
            jest.spyOn(courseRegistrationRepository, 'findOne').mockResolvedValue(null); // No duplicate
            jest.spyOn(courseRegistrationRepository, 'find').mockResolvedValue(mockRegistrations as any);

            const totalCredits = existingCredits + newCourseCredits;

            if (totalCredits > creditLimit) {
              // Should reject registration
              await expect(
                service.registerCourse({ studentId, courseId }, universityId)
              ).rejects.toThrow('Credit limit exceeded');
            } else {
              // Should allow registration
              const mockRegistration = {
                id: fc.sample(fc.uuid(), 1)[0],
                universityId,
                studentId,
                courseId,
              };
              jest.spyOn(courseRegistrationRepository, 'create').mockReturnValue(mockRegistration as any);
              jest.spyOn(courseRegistrationRepository, 'save').mockResolvedValue(mockRegistration as any);

              const result = await service.registerCourse({ studentId, courseId }, universityId);
              expect(result).toBeDefined();
              expect(result.studentId).toBe(studentId);
              expect(result.courseId).toBe(courseId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: unisense-mvp, Property 10: Duplicate registration prevention
   * Validates: Requirements 3.3
   * 
   * For any student and course, attempting to register for the same course
   * twice should be rejected, maintaining exactly one registration per
   * student-course pair.
   */
  describe('Property 10: Duplicate registration prevention', () => {
    it('should reject duplicate course registrations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            studentId: fc.uuid(),
            courseId: fc.uuid(),
            creditLimit: fc.integer({ min: 20, max: 30 }),
            courseCredits: fc.integer({ min: 1, max: 6 }),
          }),
          async (testData) => {
            const { universityId, studentId, courseId, creditLimit, courseCredits } = testData;
            
            // Create mock student
            const mockStudent = {
              id: studentId,
              universityId,
              creditLimit,
            };

            // Create mock course
            const mockCourse = {
              id: courseId,
              universityId,
              creditUnits: courseCredits,
            };

            // Mock repository calls
            jest.spyOn(studentRepository, 'findOne').mockResolvedValue(mockStudent as any);
            jest.spyOn(courseRepository, 'findOne').mockResolvedValue(mockCourse as any);
            jest.spyOn(courseRegistrationRepository, 'find').mockResolvedValue([]); // No existing registrations

            // First registration should succeed
            const existingRegistration = {
              id: fc.sample(fc.uuid(), 1)[0],
              universityId,
              studentId,
              courseId,
            };
            
            jest.spyOn(courseRegistrationRepository, 'findOne').mockResolvedValueOnce(null); // First check: no duplicate
            jest.spyOn(courseRegistrationRepository, 'create').mockReturnValue(existingRegistration as any);
            jest.spyOn(courseRegistrationRepository, 'save').mockResolvedValue(existingRegistration as any);

            const firstResult = await service.registerCourse({ studentId, courseId }, universityId);
            expect(firstResult).toBeDefined();

            // Second registration should fail
            jest.spyOn(courseRegistrationRepository, 'findOne').mockResolvedValueOnce(existingRegistration as any); // Second check: duplicate found

            await expect(
              service.registerCourse({ studentId, courseId }, universityId)
            ).rejects.toThrow('already registered');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: unisense-mvp, Property 11: Lecturer-course association
   * Validates: Requirements 3.4
   * 
   * For any lecturer assigned to a course, the association should be stored
   * and retrievable, allowing queries for all courses taught by that lecturer.
   */
  describe('Property 11: Lecturer-course association', () => {
    it('should store and retrieve lecturer-course associations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            lecturerId: fc.uuid(),
            numCourses: fc.integer({ min: 1, max: 5 }),
          }),
          async (testData) => {
            const { universityId, lecturerId, numCourses } = testData;
            
            // Create mock courses with the lecturer assigned
            const mockCourses = Array.from({ length: numCourses }, (_, i) => ({
              id: fc.sample(fc.uuid(), 1)[0],
              universityId,
              courseCode: `CS${100 + i}`,
              title: `Course ${i + 1}`,
              creditUnits: fc.sample(fc.integer({ min: 1, max: 6 }), 1)[0],
              faculty: 'Engineering',
              department: 'Computer Science',
              level: 100,
              lecturerId,
              session: '2023/2024',
              semester: 'First',
              createdAt: new Date(),
            }));

            // Mock repository to return courses for this lecturer
            jest.spyOn(courseRepository, 'find').mockResolvedValue(mockCourses as any);

            const result = await service.findByLecturer(lecturerId, universityId);

            // Verify all courses are associated with the lecturer
            expect(result).toHaveLength(numCourses);
            result.forEach(course => {
              expect(course.lecturerId).toBe(lecturerId);
              expect(course.universityId).toBe(universityId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: unisense-mvp, Property 12: Course filtering correctness
   * Validates: Requirements 3.5
   * 
   * For any query filtering by faculty, department, or level, the results
   * should include all and only courses matching the specified criteria.
   */
  describe('Property 12: Course filtering correctness', () => {
    it('should filter courses correctly by faculty, department, and level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            targetFaculty: fc.constantFrom('Engineering', 'Science', 'Arts', 'Medicine'),
            targetDepartment: fc.constantFrom('Computer Science', 'Mathematics', 'Physics'),
            targetLevel: fc.constantFrom(100, 200, 300, 400),
            numMatchingCourses: fc.integer({ min: 1, max: 5 }),
            numNonMatchingCourses: fc.integer({ min: 0, max: 3 }),
          }),
          async (testData) => {
            const { universityId, targetFaculty, targetDepartment, targetLevel, numMatchingCourses, numNonMatchingCourses } = testData;
            
            // Create matching courses
            const matchingCourses = Array.from({ length: numMatchingCourses }, (_, i) => ({
              id: fc.sample(fc.uuid(), 1)[0],
              universityId,
              courseCode: `MATCH${i}`,
              title: `Matching Course ${i}`,
              creditUnits: 3,
              faculty: targetFaculty,
              department: targetDepartment,
              level: targetLevel,
              lecturerId: null,
              session: '2023/2024',
              semester: 'First',
              createdAt: new Date(),
            }));

            // Create non-matching courses (different faculty, department, or level)
            const nonMatchingCourses = Array.from({ length: numNonMatchingCourses }, (_, i) => ({
              id: fc.sample(fc.uuid(), 1)[0],
              universityId,
              courseCode: `NOMATCH${i}`,
              title: `Non-Matching Course ${i}`,
              creditUnits: 3,
              faculty: targetFaculty === 'Engineering' ? 'Science' : 'Engineering',
              department: targetDepartment === 'Computer Science' ? 'Mathematics' : 'Computer Science',
              level: targetLevel === 100 ? 200 : 100,
              lecturerId: null,
              session: '2023/2024',
              semester: 'First',
              createdAt: new Date(),
            }));

            // Mock query builder
            const mockQueryBuilder = {
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(matchingCourses),
            };

            jest.spyOn(courseRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

            const result = await service.findAll(universityId, targetFaculty, targetDepartment, targetLevel);

            // Verify query builder was called with correct filters
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('course.universityId = :universityId', { universityId });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('course.faculty = :faculty', { faculty: targetFaculty });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('course.department = :department', { department: targetDepartment });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('course.level = :level', { level: targetLevel });

            // Verify all results match the criteria
            expect(result).toHaveLength(numMatchingCourses);
            result.forEach(course => {
              expect(course.faculty).toBe(targetFaculty);
              expect(course.department).toBe(targetDepartment);
              expect(course.level).toBe(targetLevel);
              expect(course.universityId).toBe(universityId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
