import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { StudentsService } from './students.service';
import { Student, EnrollmentStatus } from '../entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('StudentsService', () => {
  let service: StudentsService;
  let repository: Repository<Student>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: getRepositoryToken(Student),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    repository = module.get<Repository<Student>>(getRepositoryToken(Student));
    
    jest.clearAllMocks();
  });

  // Feature: unisense-mvp, Property 5: Student creation completeness
  // Validates: Requirements 2.1
  describe('Property 5: Student creation completeness', () => {
    it('should store and retrieve all required student fields for any valid student data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            studentId: fc.string({ minLength: 1, maxLength: 50 }),
            firstName: fc.string({ minLength: 1, maxLength: 100 }),
            lastName: fc.string({ minLength: 1, maxLength: 100 }),
            faculty: fc.string({ minLength: 1, maxLength: 100 }),
            department: fc.string({ minLength: 1, maxLength: 100 }),
            level: fc.integer({ min: 1, max: 10 }),
            enrollmentStatus: fc.constantFrom(
              EnrollmentStatus.ACTIVE,
              EnrollmentStatus.SUSPENDED,
              EnrollmentStatus.GRADUATED,
            ),
            creditLimit: fc.integer({ min: 1, max: 50 }),
          }),
          async (studentData) => {
            const createDto: CreateStudentDto = {
              universityId: studentData.universityId,
              studentId: studentData.studentId,
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              faculty: studentData.faculty,
              department: studentData.department,
              level: studentData.level,
              enrollmentStatus: studentData.enrollmentStatus,
              creditLimit: studentData.creditLimit,
            };

            const expectedStudent: Student = {
              id: fc.sample(fc.uuid(), 1)[0],
              universityId: createDto.universityId,
              studentId: createDto.studentId,
              firstName: createDto.firstName,
              lastName: createDto.lastName,
              faculty: createDto.faculty,
              department: createDto.department,
              level: createDto.level,
              enrollmentStatus: createDto.enrollmentStatus,
              creditLimit: createDto.creditLimit || 24,
              userId: null,
              createdAt: new Date(),
              university: null,
              user: null,
            };

            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(expectedStudent);
            mockRepository.save.mockResolvedValue(expectedStudent);

            const result = await service.create(createDto);

            // Verify all required fields are stored and retrievable
            expect(result.studentId).toBe(studentData.studentId);
            expect(result.firstName).toBe(studentData.firstName);
            expect(result.lastName).toBe(studentData.lastName);
            expect(result.faculty).toBe(studentData.faculty);
            expect(result.department).toBe(studentData.department);
            expect(result.level).toBe(studentData.level);
            expect(result.enrollmentStatus).toBe(studentData.enrollmentStatus);
            expect(result.universityId).toBe(studentData.universityId);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('create', () => {
    it('should throw ConflictException if student already exists', async () => {
      const createDto: CreateStudentDto = {
        universityId: 'univ-123',
        studentId: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        faculty: 'Engineering',
        department: 'Computer Science',
        level: 1,
        enrollmentStatus: EnrollmentStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return students filtered by university', async () => {
      const students = [
        { id: '1', universityId: 'univ-1', studentId: 'STU001' },
        { id: '2', universityId: 'univ-1', studentId: 'STU002' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(students),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('univ-1');

      expect(result).toEqual(students);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'student.universityId = :universityId',
        { universityId: 'univ-1' },
      );
    });

    it('should filter by faculty when provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('univ-1', 'Engineering');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'student.faculty = :faculty',
        { faculty: 'Engineering' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a student by id and universityId', async () => {
      const student = {
        id: '1',
        universityId: 'univ-1',
        studentId: 'STU001',
      };

      mockRepository.findOne.mockResolvedValue(student);

      const result = await service.findOne('1', 'univ-1');

      expect(result).toEqual(student);
    });

    it('should throw NotFoundException if student not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1', 'univ-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      const existingStudent = {
        id: '1',
        universityId: 'univ-1',
        studentId: 'STU001',
        firstName: 'John',
      };

      const updateDto = { firstName: 'Jane' };

      mockRepository.findOne.mockResolvedValue(existingStudent);
      mockRepository.save.mockResolvedValue({ ...existingStudent, ...updateDto });

      const result = await service.update('1', 'univ-1', updateDto);

      expect(result.firstName).toBe('Jane');
    });
  });

  describe('remove', () => {
    it('should remove a student', async () => {
      const student = { id: '1', universityId: 'univ-1' };

      mockRepository.findOne.mockResolvedValue(student);
      mockRepository.remove.mockResolvedValue(student);

      await service.remove('1', 'univ-1');

      expect(mockRepository.remove).toHaveBeenCalledWith(student);
    });
  });

  // Feature: unisense-mvp, Property 7: Partial CSV import resilience
  // Validates: Requirements 2.3
  describe('Property 7: Partial CSV import resilience', () => {
    it('should create valid students and reject invalid ones with error reporting', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            validStudents: fc.array(
              fc.record({
                studentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes(',') && s.trim().length > 0),
                firstName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(',') && s.trim().length > 0),
                lastName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(',') && s.trim().length > 0),
                faculty: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(',') && s.trim().length > 0),
                department: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(',') && s.trim().length > 0),
                level: fc.integer({ min: 1, max: 10 }),
                enrollmentStatus: fc.constantFrom(
                  EnrollmentStatus.ACTIVE,
                  EnrollmentStatus.SUSPENDED,
                  EnrollmentStatus.GRADUATED,
                ),
              }),
              { minLength: 1, maxLength: 3 },
            ),
            invalidStudents: fc.array(
              fc.record({
                studentId: fc.string({ minLength: 0, maxLength: 50 }).filter(s => !s.includes(',')),
                firstName: fc.string({ minLength: 0, maxLength: 100 }).filter(s => !s.includes(',')),
                lastName: fc.string({ minLength: 0, maxLength: 100 }).filter(s => !s.includes(',')),
                faculty: fc.string({ minLength: 0, maxLength: 100 }).filter(s => !s.includes(',')),
                department: fc.string({ minLength: 0, maxLength: 100 }).filter(s => !s.includes(',')),
                level: fc.oneof(
                  fc.constant('invalid'),
                  fc.constant(''),
                  fc.constant('-1'),
                ),
                enrollmentStatus: fc.oneof(
                  fc.constant('invalid_status'),
                  fc.constant(''),
                ),
              }),
              { minLength: 1, maxLength: 3 },
            ),
          }),
          async ({ universityId, validStudents, invalidStudents }) => {
            // Interleave valid and invalid students
            const allStudents = [...validStudents, ...invalidStudents];
            
            // Generate CSV content
            const header = 'student_id,first_name,last_name,faculty,department,level,enrollment_status';
            const rows = allStudents.map(s => 
              `${s.studentId},${s.firstName},${s.lastName},${s.faculty},${s.department},${s.level},${s.enrollmentStatus}`
            );
            const csvContent = [header, ...rows].join('\n');

            // Mock repository to track created students
            const createdStudents: any[] = [];
            mockRepository.findOne.mockResolvedValue(null); // No duplicates
            mockRepository.create.mockImplementation((dto) => {
              const student = {
                id: fc.sample(fc.uuid(), 1)[0],
                ...dto,
                userId: null,
                createdAt: new Date(),
                university: null,
                user: null,
              };
              createdStudents.push(student);
              return student;
            });
            mockRepository.save.mockImplementation((student) => Promise.resolve(student));

            const result = await service.importFromCSV(universityId, csvContent);

            // Verify valid students were created
            expect(result.successCount).toBe(validStudents.length);
            
            // Verify invalid students were rejected
            expect(result.failureCount).toBe(invalidStudents.length);
            
            // Verify error reporting for each failure
            expect(result.errors).toHaveLength(invalidStudents.length);
            result.errors.forEach(error => {
              expect(error.row).toBeGreaterThan(0);
              expect(error.error).toBeTruthy();
            });

            // Verify only valid students were created
            expect(createdStudents).toHaveLength(validStudents.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: unisense-mvp, Property 6: CSV import correctness
  // Validates: Requirements 2.2
  describe('Property 6: CSV import correctness', () => {
    it('should create all students with data matching CSV content for any valid CSV', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            students: fc.array(
              fc.record({
                studentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes(',') && s.trim().length > 0),
                firstName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(',') && s.trim().length > 0),
                lastName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(',') && s.trim().length > 0),
                faculty: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(',') && s.trim().length > 0),
                department: fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(',') && s.trim().length > 0),
                level: fc.integer({ min: 1, max: 10 }),
                enrollmentStatus: fc.constantFrom(
                  EnrollmentStatus.ACTIVE,
                  EnrollmentStatus.SUSPENDED,
                  EnrollmentStatus.GRADUATED,
                ),
              }),
              { minLength: 1, maxLength: 5 },
            ),
          }),
          async ({ universityId, students }) => {
            // Generate CSV content
            const header = 'student_id,first_name,last_name,faculty,department,level,enrollment_status';
            const rows = students.map(s => 
              `${s.studentId},${s.firstName},${s.lastName},${s.faculty},${s.department},${s.level},${s.enrollmentStatus}`
            );
            const csvContent = [header, ...rows].join('\n');

            // Mock repository to track created students
            const createdStudents: any[] = [];
            mockRepository.findOne.mockResolvedValue(null); // No duplicates
            mockRepository.create.mockImplementation((dto) => {
              const student = {
                id: fc.sample(fc.uuid(), 1)[0],
                ...dto,
                userId: null,
                createdAt: new Date(),
                university: null,
                user: null,
              };
              createdStudents.push(student);
              return student;
            });
            mockRepository.save.mockImplementation((student) => Promise.resolve(student));

            const result = await service.importFromCSV(universityId, csvContent);

            // Verify all students were created successfully
            expect(result.successCount).toBe(students.length);
            expect(result.failureCount).toBe(0);
            expect(result.errors).toHaveLength(0);

            // Verify each created student matches the CSV data (trimmed)
            expect(createdStudents).toHaveLength(students.length);
            students.forEach((expectedStudent, index) => {
              const createdStudent = createdStudents[index];
              expect(createdStudent.studentId).toBe(expectedStudent.studentId.trim());
              expect(createdStudent.firstName).toBe(expectedStudent.firstName.trim());
              expect(createdStudent.lastName).toBe(expectedStudent.lastName.trim());
              expect(createdStudent.faculty).toBe(expectedStudent.faculty.trim());
              expect(createdStudent.department).toBe(expectedStudent.department.trim());
              expect(createdStudent.level).toBe(expectedStudent.level);
              expect(createdStudent.enrollmentStatus).toBe(expectedStudent.enrollmentStatus);
              expect(createdStudent.universityId).toBe(universityId);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
