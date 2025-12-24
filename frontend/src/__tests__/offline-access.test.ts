/**
 * Feature: unisense-mvp, Property 33: Offline data access
 * Validates: Requirements 11.2
 * 
 * Property: For any student using the PWA without internet connectivity,
 * previously cached data (profile, course registrations, published grades)
 * should remain accessible in read-only mode.
 */

import * as fc from 'fast-check';
import { OfflineStorage } from '@/lib/offline-storage';

describe('Property 33: Offline data access', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    // Clear storage before each test
    storage = {};
    
    // Mock localStorage with proper implementation
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => storage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          storage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete storage[key];
        }),
        clear: jest.fn(() => {
          storage = {};
        }),
        length: 0,
        key: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    storage = {};
  });

  test('cached student profile remains accessible offline', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          student_id: fc.string({ minLength: 5, maxLength: 20 }),
          first_name: fc.string({ minLength: 2, maxLength: 50 }),
          last_name: fc.string({ minLength: 2, maxLength: 50 }),
          faculty: fc.string({ minLength: 3, maxLength: 100 }),
          department: fc.string({ minLength: 3, maxLength: 100 }),
          level: fc.integer({ min: 100, max: 700 }),
          enrollment_status: fc.constantFrom('active', 'suspended', 'graduated'),
        }),
        (profile) => {
          // Setup: Cache the profile
          OfflineStorage.cacheStudentProfile(profile.id, profile);

          // Test: Retrieve cached profile (simulating offline access)
          const cachedProfile = OfflineStorage.getCachedStudentProfile(profile.id);

          // Verify: Profile data matches what was cached
          expect(cachedProfile).toBeDefined();
          expect(cachedProfile.id).toBe(profile.id);
          expect(cachedProfile.student_id).toBe(profile.student_id);
          expect(cachedProfile.first_name).toBe(profile.first_name);
          expect(cachedProfile.last_name).toBe(profile.last_name);
          expect(cachedProfile.faculty).toBe(profile.faculty);
          expect(cachedProfile.department).toBe(profile.department);
          expect(cachedProfile.level).toBe(profile.level);
          expect(cachedProfile.enrollment_status).toBe(profile.enrollment_status);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cached courses remain accessible offline', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            course_code: fc.string({ minLength: 5, maxLength: 10 }),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            credit_units: fc.integer({ min: 1, max: 6 }),
            lecturer_id: fc.uuid(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (courses) => {
          // Setup: Cache courses
          OfflineStorage.cacheCourses(courses);

          // Test: Retrieve cached courses (simulating offline access)
          const cachedCourses = OfflineStorage.getCachedCourses();

          // Verify: All courses are accessible
          expect(cachedCourses).toBeDefined();
          expect(cachedCourses).toHaveLength(courses.length);
          
          courses.forEach((course, index) => {
            expect(cachedCourses[index].id).toBe(course.id);
            expect(cachedCourses[index].course_code).toBe(course.course_code);
            expect(cachedCourses[index].title).toBe(course.title);
            expect(cachedCourses[index].credit_units).toBe(course.credit_units);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cached grades remain accessible offline', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            id: fc.uuid(),
            course_id: fc.uuid(),
            score: fc.float({ min: 0, max: 100, noNaN: true }),
            letter_grade: fc.constantFrom('A', 'B', 'C', 'D', 'F'),
            grade_point: fc.float({ min: 0, max: 5, noNaN: true }),
            is_published: fc.constant(true), // Only published grades are cached
          }),
          { minLength: 1, maxLength: 15 }
        ),
        (studentId, grades) => {
          // Setup: Cache grades
          OfflineStorage.cacheGrades(studentId, grades);

          // Test: Retrieve cached grades (simulating offline access)
          const cachedGrades = OfflineStorage.getCachedGrades(studentId);

          // Verify: All published grades are accessible
          expect(cachedGrades).toBeDefined();
          expect(cachedGrades).toHaveLength(grades.length);
          
          grades.forEach((grade, index) => {
            expect(cachedGrades[index].id).toBe(grade.id);
            expect(cachedGrades[index].course_id).toBe(grade.course_id);
            expect(cachedGrades[index].score).toBe(grade.score);
            expect(cachedGrades[index].letter_grade).toBe(grade.letter_grade);
            expect(cachedGrades[index].is_published).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cached course registrations remain accessible offline', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            id: fc.uuid(),
            student_id: fc.uuid(),
            course_id: fc.uuid(),
            registered_at: fc.date().map(d => d.toISOString()),
          }),
          { minLength: 1, maxLength: 12 }
        ),
        (studentId, registrations) => {
          // Setup: Cache registrations
          OfflineStorage.cacheCourseRegistrations(studentId, registrations);

          // Test: Retrieve cached registrations (simulating offline access)
          const cachedRegistrations = OfflineStorage.getCachedCourseRegistrations(studentId);

          // Verify: All registrations are accessible
          expect(cachedRegistrations).toBeDefined();
          expect(cachedRegistrations).toHaveLength(registrations.length);
          
          registrations.forEach((reg, index) => {
            expect(cachedRegistrations[index].id).toBe(reg.id);
            expect(cachedRegistrations[index].course_id).toBe(reg.course_id);
            expect(cachedRegistrations[index].student_id).toBe(reg.student_id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all required data types remain accessible offline together', () => {
    fc.assert(
      fc.property(
        fc.record({
          studentId: fc.uuid(),
          profile: fc.record({
            id: fc.uuid(),
            student_id: fc.string({ minLength: 5, maxLength: 20 }),
            first_name: fc.string({ minLength: 2, maxLength: 50 }),
            last_name: fc.string({ minLength: 2, maxLength: 50 }),
          }),
          courses: fc.array(
            fc.record({
              id: fc.uuid(),
              course_code: fc.string({ minLength: 5, maxLength: 10 }),
              title: fc.string({ minLength: 5, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          grades: fc.array(
            fc.record({
              id: fc.uuid(),
              course_id: fc.uuid(),
              score: fc.float({ min: 0, max: 100, noNaN: true }),
              is_published: fc.constant(true),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          registrations: fc.array(
            fc.record({
              id: fc.uuid(),
              course_id: fc.uuid(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        (data) => {
          // Setup: Cache all data types
          OfflineStorage.cacheStudentProfile(data.studentId, data.profile);
          OfflineStorage.cacheCourses(data.courses);
          OfflineStorage.cacheGrades(data.studentId, data.grades);
          OfflineStorage.cacheCourseRegistrations(data.studentId, data.registrations);

          // Test: Retrieve all cached data (simulating offline access)
          const cachedProfile = OfflineStorage.getCachedStudentProfile(data.studentId);
          const cachedCourses = OfflineStorage.getCachedCourses();
          const cachedGrades = OfflineStorage.getCachedGrades(data.studentId);
          const cachedRegistrations = OfflineStorage.getCachedCourseRegistrations(data.studentId);

          // Verify: All data types are accessible offline
          expect(cachedProfile).toBeDefined();
          expect(cachedCourses).toBeDefined();
          expect(cachedGrades).toBeDefined();
          expect(cachedRegistrations).toBeDefined();

          expect(cachedProfile.id).toBe(data.profile.id);
          expect(cachedCourses).toHaveLength(data.courses.length);
          expect(cachedGrades).toHaveLength(data.grades.length);
          expect(cachedRegistrations).toHaveLength(data.registrations.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
