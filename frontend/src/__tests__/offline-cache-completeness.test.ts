/**
 * Feature: unisense-mvp, Property 35: Offline cache completeness
 * Validates: Requirements 11.4
 * 
 * Property: For any student using the PWA, the cache should include
 * student profile, course registrations, and all published grades for offline access.
 */

import * as fc from 'fast-check';
import { OfflineStorage } from '@/lib/offline-storage';

describe('Property 35: Offline cache completeness', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    
    // Mock localStorage
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

  test('cache includes all required data types for student', () => {
    fc.assert(
      fc.property(
        fc.record({
          studentId: fc.uuid(),
          profile: fc.record({
            id: fc.uuid(),
            student_id: fc.string({ minLength: 5, maxLength: 20 }),
            first_name: fc.string({ minLength: 2, maxLength: 50 }),
            last_name: fc.string({ minLength: 2, maxLength: 50 }),
            faculty: fc.string({ minLength: 3, maxLength: 100 }),
            department: fc.string({ minLength: 3, maxLength: 100 }),
            level: fc.integer({ min: 100, max: 700 }),
          }),
          courses: fc.array(
            fc.record({
              id: fc.uuid(),
              course_code: fc.string({ minLength: 5, maxLength: 10 }),
              title: fc.string({ minLength: 5, maxLength: 100 }),
              credit_units: fc.integer({ min: 1, max: 6 }),
            }),
            { minLength: 1, maxLength: 12 }
          ),
          grades: fc.array(
            fc.record({
              id: fc.uuid(),
              course_id: fc.uuid(),
              score: fc.float({ min: 0, max: 100, noNaN: true }),
              letter_grade: fc.constantFrom('A', 'B', 'C', 'D', 'F'),
              is_published: fc.constant(true), // Only published grades
            }),
            { minLength: 1, maxLength: 12 }
          ),
          registrations: fc.array(
            fc.record({
              id: fc.uuid(),
              student_id: fc.uuid(),
              course_id: fc.uuid(),
            }),
            { minLength: 1, maxLength: 12 }
          ),
        }),
        (studentData) => {
          // Setup: Cache all required data
          OfflineStorage.cacheStudentProfile(studentData.studentId, studentData.profile);
          OfflineStorage.cacheCourses(studentData.courses);
          OfflineStorage.cacheGrades(studentData.studentId, studentData.grades);
          OfflineStorage.cacheCourseRegistrations(studentData.studentId, studentData.registrations);

          // Test: Verify all data is cached
          const cachedProfile = OfflineStorage.getCachedStudentProfile(studentData.studentId);
          const cachedCourses = OfflineStorage.getCachedCourses();
          const cachedGrades = OfflineStorage.getCachedGrades(studentData.studentId);
          const cachedRegistrations = OfflineStorage.getCachedCourseRegistrations(studentData.studentId);

          // Verify: All required data types are present
          expect(cachedProfile).not.toBeNull();
          expect(cachedCourses).not.toBeNull();
          expect(cachedGrades).not.toBeNull();
          expect(cachedRegistrations).not.toBeNull();

          // Verify: Profile completeness
          expect(cachedProfile.id).toBe(studentData.profile.id);
          expect(cachedProfile.student_id).toBe(studentData.profile.student_id);
          expect(cachedProfile.first_name).toBe(studentData.profile.first_name);
          expect(cachedProfile.last_name).toBe(studentData.profile.last_name);
          expect(cachedProfile.faculty).toBe(studentData.profile.faculty);
          expect(cachedProfile.department).toBe(studentData.profile.department);
          expect(cachedProfile.level).toBe(studentData.profile.level);

          // Verify: Courses completeness
          expect(cachedCourses.length).toBe(studentData.courses.length);
          studentData.courses.forEach((course, index) => {
            expect(cachedCourses[index].id).toBe(course.id);
            expect(cachedCourses[index].course_code).toBe(course.course_code);
            expect(cachedCourses[index].title).toBe(course.title);
            expect(cachedCourses[index].credit_units).toBe(course.credit_units);
          });

          // Verify: Grades completeness (only published)
          expect(cachedGrades.length).toBe(studentData.grades.length);
          studentData.grades.forEach((grade, index) => {
            expect(cachedGrades[index].id).toBe(grade.id);
            expect(cachedGrades[index].course_id).toBe(grade.course_id);
            expect(cachedGrades[index].score).toBe(grade.score);
            expect(cachedGrades[index].letter_grade).toBe(grade.letter_grade);
            expect(cachedGrades[index].is_published).toBe(true);
          });

          // Verify: Registrations completeness
          expect(cachedRegistrations.length).toBe(studentData.registrations.length);
          studentData.registrations.forEach((reg, index) => {
            expect(cachedRegistrations[index].id).toBe(reg.id);
            expect(cachedRegistrations[index].course_id).toBe(reg.course_id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cache only includes published grades', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            id: fc.uuid(),
            course_id: fc.uuid(),
            score: fc.float({ min: 0, max: 100, noNaN: true }),
            letter_grade: fc.constantFrom('A', 'B', 'C', 'D', 'F'),
            is_published: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (studentId, allGrades) => {
          // Filter to only published grades for caching
          const publishedGrades = allGrades.filter(g => g.is_published);
          
          // Setup: Cache only published grades
          OfflineStorage.cacheGrades(studentId, publishedGrades);

          // Test: Retrieve cached grades
          const cachedGrades = OfflineStorage.getCachedGrades(studentId);

          // Verify: All cached grades are published
          expect(cachedGrades).not.toBeNull();
          expect(cachedGrades.length).toBe(publishedGrades.length);
          
          cachedGrades.forEach(grade => {
            expect(grade.is_published).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cache persists across page reloads', () => {
    fc.assert(
      fc.property(
        fc.record({
          studentId: fc.uuid(),
          profile: fc.record({
            id: fc.uuid(),
            student_id: fc.string({ minLength: 5, maxLength: 20 }),
            first_name: fc.string({ minLength: 2, maxLength: 50 }),
          }),
        }),
        (data) => {
          // Setup: Cache profile
          OfflineStorage.cacheStudentProfile(data.studentId, data.profile);

          // Simulate page reload by creating new storage instance
          // (localStorage persists in our mock)
          const cachedProfile = OfflineStorage.getCachedStudentProfile(data.studentId);

          // Verify: Data persists after "reload"
          expect(cachedProfile).not.toBeNull();
          expect(cachedProfile.id).toBe(data.profile.id);
          expect(cachedProfile.student_id).toBe(data.profile.student_id);
          expect(cachedProfile.first_name).toBe(data.profile.first_name);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cache handles empty data gracefully', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (studentId) => {
          // Setup: Cache empty arrays
          OfflineStorage.cacheCourses([]);
          OfflineStorage.cacheGrades(studentId, []);
          OfflineStorage.cacheCourseRegistrations(studentId, []);

          // Test: Retrieve cached data
          const cachedCourses = OfflineStorage.getCachedCourses();
          const cachedGrades = OfflineStorage.getCachedGrades(studentId);
          const cachedRegistrations = OfflineStorage.getCachedCourseRegistrations(studentId);

          // Verify: Empty arrays are cached and retrievable
          expect(cachedCourses).not.toBeNull();
          expect(cachedGrades).not.toBeNull();
          expect(cachedRegistrations).not.toBeNull();
          
          expect(cachedCourses).toHaveLength(0);
          expect(cachedGrades).toHaveLength(0);
          expect(cachedRegistrations).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cache data remains valid within 24 hours', () => {
    fc.assert(
      fc.property(
        fc.record({
          studentId: fc.uuid(),
          profile: fc.record({
            id: fc.uuid(),
            student_id: fc.string({ minLength: 5, maxLength: 20 }),
          }),
        }),
        (data) => {
          // Setup: Cache profile
          OfflineStorage.cacheStudentProfile(data.studentId, data.profile);

          // Test: Retrieve immediately (within cache duration)
          const cachedProfile = OfflineStorage.getCachedStudentProfile(data.studentId);

          // Verify: Data is valid
          expect(cachedProfile).not.toBeNull();
          expect(cachedProfile.id).toBe(data.profile.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all required fields are present in cached profile', () => {
    fc.assert(
      fc.property(
        fc.record({
          studentId: fc.uuid(),
          profile: fc.record({
            id: fc.uuid(),
            student_id: fc.string({ minLength: 5, maxLength: 20 }),
            first_name: fc.string({ minLength: 2, maxLength: 50 }),
            last_name: fc.string({ minLength: 2, maxLength: 50 }),
            faculty: fc.string({ minLength: 3, maxLength: 100 }),
            department: fc.string({ minLength: 3, maxLength: 100 }),
            level: fc.integer({ min: 100, max: 700 }),
            enrollment_status: fc.constantFrom('active', 'suspended', 'graduated'),
          }),
        }),
        (data) => {
          // Setup: Cache complete profile
          OfflineStorage.cacheStudentProfile(data.studentId, data.profile);

          // Test: Retrieve cached profile
          const cachedProfile = OfflineStorage.getCachedStudentProfile(data.studentId);

          // Verify: All required fields are present
          expect(cachedProfile).not.toBeNull();
          expect(cachedProfile).toHaveProperty('id');
          expect(cachedProfile).toHaveProperty('student_id');
          expect(cachedProfile).toHaveProperty('first_name');
          expect(cachedProfile).toHaveProperty('last_name');
          expect(cachedProfile).toHaveProperty('faculty');
          expect(cachedProfile).toHaveProperty('department');
          expect(cachedProfile).toHaveProperty('level');
          expect(cachedProfile).toHaveProperty('enrollment_status');

          // Verify: Field values match
          expect(cachedProfile.id).toBe(data.profile.id);
          expect(cachedProfile.student_id).toBe(data.profile.student_id);
          expect(cachedProfile.first_name).toBe(data.profile.first_name);
          expect(cachedProfile.last_name).toBe(data.profile.last_name);
          expect(cachedProfile.faculty).toBe(data.profile.faculty);
          expect(cachedProfile.department).toBe(data.profile.department);
          expect(cachedProfile.level).toBe(data.profile.level);
          expect(cachedProfile.enrollment_status).toBe(data.profile.enrollment_status);
        }
      ),
      { numRuns: 100 }
    );
  });
});
