import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { UsersService } from './users.service';
import { User, UserRole } from '../entities/user.entity';
import { AuthService } from '../auth/auth.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue('hashed-password'),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Feature: unisense-mvp, Property 4: Multi-tenant data isolation
  // Validates: Requirements 1.4, 2.4, 10.4
  describe('Property 4: Multi-tenant data isolation', () => {
    it('should return only users belonging to the specified university', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // universityId
          fc.array(
            fc.record({
              id: fc.uuid(),
              email: fc.emailAddress(),
              universityId: fc.uuid(),
              role: fc.constantFrom(...Object.values(UserRole)),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (targetUniversityId, allUsers) => {
            // Filter users that belong to target university
            const expectedUsers = allUsers
              .filter(u => u.universityId === targetUniversityId)
              .map(u => ({
                ...u,
                passwordHash: 'hashed',
                createdAt: new Date(),
                university: null,
              }));

            // Mock repository to return only users from target university
            jest.spyOn(userRepository, 'find').mockResolvedValue(expectedUsers);

            // Query users for the target university
            const result = await service.findAll(targetUniversityId);

            // Verify all returned users belong to target university
            expect(result).toBeDefined();
            result.forEach(user => {
              expect(user.universityId).toBe(targetUniversityId);
            });

            // Verify repository was called with correct filter
            expect(userRepository.find).toHaveBeenCalledWith({
              where: { universityId: targetUniversityId },
              select: ['id', 'email', 'role', 'universityId', 'createdAt'],
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not return users from other universities when querying by ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // correctUniversityId
          fc.uuid(), // wrongUniversityId
          fc.emailAddress(),
          fc.constantFrom(...Object.values(UserRole)),
          async (userId, correctUniversityId, wrongUniversityId, email, role) => {
            fc.pre(correctUniversityId !== wrongUniversityId);

            // Create mock user belonging to correct university
            const mockUser: User = {
              id: userId,
              email,
              passwordHash: 'hashed',
              universityId: correctUniversityId,
              role,
              createdAt: new Date(),
              university: null,
            };

            // Mock repository to return null when querying with wrong university
            jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
              if (options.where.universityId === correctUniversityId) {
                return mockUser;
              }
              return null;
            });

            // Query with correct university should succeed
            const resultCorrect = await service.findOne(userId, correctUniversityId);
            expect(resultCorrect).toBeDefined();
            expect(resultCorrect.id).toBe(userId);

            // Query with wrong university should fail
            await expect(service.findOne(userId, wrongUniversityId)).rejects.toThrow('User not found');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce university isolation when updating users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // correctUniversityId
          fc.uuid(), // wrongUniversityId
          fc.emailAddress(),
          fc.constantFrom(...Object.values(UserRole)),
          async (userId, correctUniversityId, wrongUniversityId, email, role) => {
            fc.pre(correctUniversityId !== wrongUniversityId);

            // Mock repository to return null when querying with wrong university
            jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
              if (options.where && options.where.universityId === wrongUniversityId) {
                return null;
              }
              return {
                id: userId,
                email,
                passwordHash: 'hashed',
                universityId: correctUniversityId,
                role,
                createdAt: new Date(),
                university: null,
              };
            });

            // Attempt to update user with wrong university should fail
            await expect(
              service.update(userId, wrongUniversityId, { email: 'new@example.com' })
            ).rejects.toThrow('User not found');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce university isolation when deleting users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // correctUniversityId
          fc.uuid(), // wrongUniversityId
          async (userId, correctUniversityId, wrongUniversityId) => {
            fc.pre(correctUniversityId !== wrongUniversityId);

            // Mock repository to return null when querying with wrong university
            jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
              if (options.where && options.where.universityId === wrongUniversityId) {
                return null;
              }
              return {
                id: userId,
                email: 'test@example.com',
                passwordHash: 'hashed',
                universityId: correctUniversityId,
                role: UserRole.STUDENT,
                createdAt: new Date(),
                university: null,
              };
            });

            // Attempt to delete user with wrong university should fail
            await expect(service.remove(userId, wrongUniversityId)).rejects.toThrow('User not found');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
