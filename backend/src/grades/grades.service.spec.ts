import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradesService } from './grades.service';
import { Grade } from '../entities/grade.entity';
import { SemesterResult } from '../entities/semester-result.entity';
import { Course } from '../entities/course.entity';
import { Student } from '../entities/student.entity';
import { CourseRegistration } from '../entities/course-registration.entity';
import * as fc from 'fast-check';

describe('GradesService', () => {
  let service: GradesService;
  let gradesRepository: Repository<Grade>;
  let semesterResultsRepository: Repository<SemesterResult>;
  let coursesRepository: Repository<Course>;
  let studentsRepository: Repository<Student>;
  let courseRegistrationsRepository: Repository<CourseRegistration>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        {
          provide: getRepositoryToken(Grade),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SemesterResult),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Course),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Student),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CourseRegistration),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
    gradesRepository = module.get<Repository<Grade>>(getRepositoryToken(Grade));
    semesterResultsRepository = module.get<Repository<SemesterResult>>(getRepositoryToken(SemesterResult));
    coursesRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    studentsRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    courseRegistrationsRepository = module.get<Repository<CourseRegistration>>(getRepositoryToken(CourseRegistration));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: unisense-mvp, Property 13: Grade computation correctness
     * Validates: Requirements 4.1
     * 
     * For any numeric score entered, the system should compute the correct letter grade
     * according to the grading scale (A: 70-100, B: 60-69, C: 50-59, D: 45-49, F: 0-44)
     */
    describe('Property 13: Grade computation correctness', () => {
      it('should compute correct letter grade A for scores 70-100', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 70, max: 100, noNaN: true }),
            (score) => {
              const result = service.computeGrade(score);
              expect(result.letterGrade).toBe('A');
              expect(result.gradePoint).toBe(5.0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should compute correct letter grade B for scores 60-69.99', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 60, max: Math.fround(69.99), noNaN: true }),
            (score) => {
              const result = service.computeGrade(score);
              expect(result.letterGrade).toBe('B');
              expect(result.gradePoint).toBe(4.0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should compute correct letter grade C for scores 50-59.99', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 50, max: Math.fround(59.99), noNaN: true }),
            (score) => {
              const result = service.computeGrade(score);
              expect(result.letterGrade).toBe('C');
              expect(result.gradePoint).toBe(3.0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should compute correct letter grade D for scores 45-49.99', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 45, max: Math.fround(49.99), noNaN: true }),
            (score) => {
              const result = service.computeGrade(score);
              expect(result.letterGrade).toBe('D');
              expect(result.gradePoint).toBe(2.0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should compute correct letter grade F for scores 0-44.99', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 0, max: Math.fround(44.99), noNaN: true }),
            (score) => {
              const result = service.computeGrade(score);
              expect(result.letterGrade).toBe('F');
              expect(result.gradePoint).toBe(0.0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should handle boundary values correctly', () => {
        // Test exact boundaries
        expect(service.computeGrade(70).letterGrade).toBe('A');
        expect(service.computeGrade(69.99).letterGrade).toBe('B');
        expect(service.computeGrade(60).letterGrade).toBe('B');
        expect(service.computeGrade(59.99).letterGrade).toBe('C');
        expect(service.computeGrade(50).letterGrade).toBe('C');
        expect(service.computeGrade(49.99).letterGrade).toBe('D');
        expect(service.computeGrade(45).letterGrade).toBe('D');
        expect(service.computeGrade(44.99).letterGrade).toBe('F');
        expect(service.computeGrade(0).letterGrade).toBe('F');
      });

      it('should reject scores outside valid range', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.float({ min: -1000, max: Math.fround(-0.01), noNaN: true }),
              fc.float({ min: Math.fround(100.01), max: 1000, noNaN: true })
            ),
            (score) => {
              expect(() => service.computeGrade(score)).toThrow('Score must be between 0 and 100');
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    /**
     * Feature: unisense-mvp, Property 14: GPA calculation correctness
     * Validates: Requirements 4.2
     * 
     * For any set of course grades in a semester, the calculated GPA should equal
     * the weighted average of grade points by credit units
     */
    describe('Property 14: GPA calculation correctness', () => {
      // Generator for course grade data
      const courseGradeGenerator = () => fc.record({
        gradePoint: fc.float({ min: 0, max: 5, noNaN: true }),
        creditUnits: fc.integer({ min: 1, max: 6 }),
      });

      it('should calculate GPA as weighted average of grade points by credit units', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(courseGradeGenerator(), { minLength: 1, maxLength: 10 }),
            fc.uuid(),
            fc.uuid(),
            async (grades, studentId, universityId) => {
              // Mock the query builder to return our test data
              const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue(
                  grades.map(g => ({
                    grade_grade_point: g.gradePoint.toString(),
                    course_credit_units: g.creditUnits.toString(),
                  }))
                ),
              };

              jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

              const gpa = await service.calculateGPA(studentId, '2023/2024', 'First', universityId);

              // Calculate expected GPA manually
              let totalWeightedPoints = 0;
              let totalCredits = 0;
              for (const grade of grades) {
                totalWeightedPoints += grade.gradePoint * grade.creditUnits;
                totalCredits += grade.creditUnits;
              }
              const expectedGPA = Math.round((totalWeightedPoints / totalCredits) * 100) / 100;

              expect(gpa).toBeCloseTo(expectedGPA, 2);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return 0 for students with no grades', async () => {
        const mockQueryBuilder = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };

        jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const gpa = await service.calculateGPA('student-id', '2023/2024', 'First', 'university-id');
        expect(gpa).toBe(0);
      });

      it('should handle single course correctly', async () => {
        const mockQueryBuilder = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { grade_grade_point: '4.0', course_credit_units: '3' }
          ]),
        };

        jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const gpa = await service.calculateGPA('student-id', '2023/2024', 'First', 'university-id');
        expect(gpa).toBe(4.0);
      });
    });

    /**
     * Feature: unisense-mvp, Property 15: CGPA calculation correctness
     * Validates: Requirements 4.3
     * 
     * For any student with multiple semester results, the CGPA should equal
     * the weighted average of all grade points across all semesters
     */
    describe('Property 15: CGPA calculation correctness', () => {
      // Generator for course grade data across all semesters
      const allGradesGenerator = () => fc.record({
        gradePoint: fc.float({ min: 0, max: 5, noNaN: true }),
        creditUnits: fc.integer({ min: 1, max: 6 }),
      });

      it('should calculate CGPA as weighted average across all semesters', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(allGradesGenerator(), { minLength: 1, maxLength: 20 }),
            fc.uuid(),
            fc.uuid(),
            async (allGrades, studentId, universityId) => {
              // Mock the query builder to return all grades across semesters
              const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue(
                  allGrades.map(g => ({
                    grade_grade_point: g.gradePoint.toString(),
                    course_credit_units: g.creditUnits.toString(),
                  }))
                ),
              };

              jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

              const cgpa = await service.calculateCGPA(studentId, universityId);

              // Calculate expected CGPA manually
              let totalWeightedPoints = 0;
              let totalCredits = 0;
              for (const grade of allGrades) {
                totalWeightedPoints += grade.gradePoint * grade.creditUnits;
                totalCredits += grade.creditUnits;
              }
              const expectedCGPA = Math.round((totalWeightedPoints / totalCredits) * 100) / 100;

              expect(cgpa).toBeCloseTo(expectedCGPA, 2);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return 0 for students with no grades across all semesters', async () => {
        const mockQueryBuilder = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };

        jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const cgpa = await service.calculateCGPA('student-id', 'university-id');
        expect(cgpa).toBe(0);
      });

      it('should handle multiple semesters correctly', async () => {
        // Simulate 2 semesters: First semester (3.0 GPA, 15 credits), Second semester (4.0 GPA, 18 credits)
        const mockQueryBuilder = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            // First semester courses
            { grade_grade_point: '3.0', course_credit_units: '3' },
            { grade_grade_point: '3.0', course_credit_units: '3' },
            { grade_grade_point: '3.0', course_credit_units: '3' },
            { grade_grade_point: '3.0', course_credit_units: '3' },
            { grade_grade_point: '3.0', course_credit_units: '3' },
            // Second semester courses
            { grade_grade_point: '4.0', course_credit_units: '3' },
            { grade_grade_point: '4.0', course_credit_units: '3' },
            { grade_grade_point: '4.0', course_credit_units: '3' },
            { grade_grade_point: '4.0', course_credit_units: '3' },
            { grade_grade_point: '4.0', course_credit_units: '3' },
            { grade_grade_point: '4.0', course_credit_units: '3' },
          ]),
        };

        jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const cgpa = await service.calculateCGPA('student-id', 'university-id');
        
        // Expected: (3.0*15 + 4.0*18) / (15+18) = (45 + 72) / 33 = 117/33 = 3.545... ≈ 3.55
        expect(cgpa).toBeCloseTo(3.55, 2);
      });
    });

    /**
     * Feature: unisense-mvp, Property 16: Result publication visibility
     * Validates: Requirements 4.4
     * 
     * For any course with unpublished grades, students should not see their grades;
     * after publication, all students in that course should see their grades
     */
    describe('Property 16: Result publication visibility', () => {
      const gradeGenerator = (isPublished: boolean) => fc.record({
        id: fc.uuid(),
        studentId: fc.uuid(),
        courseId: fc.uuid(),
        universityId: fc.uuid(),
        score: fc.float({ min: 0, max: 100, noNaN: true }),
        letterGrade: fc.constantFrom('A', 'B', 'C', 'D', 'F'),
        gradePoint: fc.float({ min: 0, max: 5, noNaN: true }),
        isPublished: fc.constant(isPublished),
        createdAt: fc.date(),
      });

      it('should hide unpublished grades from students', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(gradeGenerator(false), { minLength: 1, maxLength: 5 }),
            fc.uuid(),
            fc.uuid(),
            fc.uuid(),
            async (unpublishedGrades, studentId, universityId, userId) => {
              // Mock student lookup
              jest.spyOn(studentsRepository, 'findOne').mockResolvedValue({
                id: studentId,
                universityId,
                userId,
              } as any);

              // Mock query builder that filters by isPublished
              const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn(function(condition: string) {
                  // When filtering for published grades, return empty array
                  if (condition.includes('is_published')) {
                    this.filteredForPublished = true;
                  }
                  return this;
                }),
                getMany: jest.fn(function() {
                  // If filtered for published, return empty (no published grades)
                  if (this.filteredForPublished) {
                    return Promise.resolve([]);
                  }
                  return Promise.resolve(unpublishedGrades);
                }),
              };

              jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

              // Student requesting their own grades
              const grades = await service.getStudentGrades(studentId, universityId, userId, 'STUDENT');

              // Students should not see unpublished grades
              expect(grades).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should show published grades to students', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(gradeGenerator(true), { minLength: 1, maxLength: 5 }),
            fc.uuid(),
            fc.uuid(),
            fc.uuid(),
            async (publishedGrades, studentId, universityId, userId) => {
              // Mock student lookup
              jest.spyOn(studentsRepository, 'findOne').mockResolvedValue({
                id: studentId,
                universityId,
                userId,
              } as any);

              // Mock query builder that returns published grades
              const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(publishedGrades),
              };

              jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

              // Student requesting their own grades
              const grades = await service.getStudentGrades(studentId, universityId, userId, 'STUDENT');

              // Students should see all published grades
              expect(grades).toHaveLength(publishedGrades.length);
              expect(grades).toEqual(publishedGrades);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should show all grades (published and unpublished) to lecturers', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                published: gradeGenerator(true),
                unpublished: gradeGenerator(false),
              }),
              { minLength: 1, maxLength: 3 }
            ),
            fc.uuid(),
            fc.uuid(),
            fc.uuid(),
            async (gradePairs, studentId, universityId, userId) => {
              const allGrades = [
                ...gradePairs.map(p => p.published),
                ...gradePairs.map(p => p.unpublished),
              ];

              // Mock student lookup
              jest.spyOn(studentsRepository, 'findOne').mockResolvedValue({
                id: studentId,
                universityId,
                userId: 'different-user-id', // Different from requesting user
              } as any);

              // Mock query builder that returns all grades (no isPublished filter for non-students)
              const mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(allGrades),
              };

              jest.spyOn(gradesRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

              // Lecturer requesting student grades
              const grades = await service.getStudentGrades(studentId, universityId, userId, 'LECTURER');

              // Lecturers should see all grades regardless of publication status
              expect(grades).toHaveLength(allGrades.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should prevent students from viewing other students grades', async () => {
        const studentId = 'student-1';
        const otherStudentUserId = 'user-1';
        const requestingUserId = 'user-2'; // Different user
        const universityId = 'university-1';

        // Mock student lookup
        jest.spyOn(studentsRepository, 'findOne').mockResolvedValue({
          id: studentId,
          universityId,
          userId: otherStudentUserId,
        } as any);

        // Student trying to view another student's grades
        await expect(
          service.getStudentGrades(studentId, universityId, requestingUserId, 'STUDENT')
        ).rejects.toThrow('You can only view your own grades');
      });
    });
  });
});
