import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { User, UserRole } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Feature: unisense-mvp, Property 1: Valid authentication succeeds
  // Validates: Requirements 1.1
  describe('Property 1: Valid authentication succeeds', () => {
    it('should return JWT token for any valid email and password combination', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom(...Object.values(UserRole)),
          async (email, password, userId, universityId, role) => {
            // Hash the password
            const passwordHash = await service.hashPassword(password);

            // Create mock user
            const mockUser: User = {
              id: userId,
              email,
              passwordHash,
              universityId,
              role,
              createdAt: new Date(),
              university: null,
            };

            // Mock repository to return the user
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

            // Mock JWT service to return a token
            const mockToken = 'mock-jwt-token';
            jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

            // Attempt login
            const result = await service.login(email, password);

            // Verify token is returned
            expect(result).toBeDefined();
            expect(result.token).toBe(mockToken);
            expect(result.user).toBeDefined();
            expect(result.user.id).toBe(userId);
            expect(result.user.email).toBe(email);
            expect(result.user.role).toBe(role);
            expect(result.user.universityId).toBe(universityId);
          }
        ),
        { numRuns: 100 }
      );
    }, 300000);
  });

  // Feature: unisense-mvp, Property 2: Invalid authentication fails
  // Validates: Requirements 1.2
  describe('Property 2: Invalid authentication fails', () => {
    it('should reject authentication for any invalid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          fc.string({ minLength: 6, maxLength: 20 }),
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom(...Object.values(UserRole)),
          async (email, correctPassword, wrongPassword, userId, universityId, role) => {
            fc.pre(correctPassword !== wrongPassword);

            // Hash the correct password
            const passwordHash = await service.hashPassword(correctPassword);

            // Create mock user
            const mockUser: User = {
              id: userId,
              email,
              passwordHash,
              universityId,
              role,
              createdAt: new Date(),
              university: null,
            };

            // Mock repository to return the user
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

            // Attempt login with wrong password
            await expect(service.login(email, wrongPassword)).rejects.toThrow('Invalid credentials');
          }
        ),
        { numRuns: 100 }
      );
    }, 300000);

    it('should reject authentication for non-existent email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          async (email, password) => {
            // Mock repository to return null (user not found)
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

            // Attempt login
            await expect(service.login(email, password)).rejects.toThrow('Invalid credentials');
          }
        ),
        { numRuns: 100 }
      );
    }, 10000);
  });

  // Feature: unisense-mvp, Property 38: Password security
  // Validates: Requirements 13.2
  describe('Property 38: Password security', () => {
    it('should never store plaintext passwords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 6, maxLength: 50 }),
          async (password) => {
            // Hash the password
            const hash = await service.hashPassword(password);

            // Verify hash is different from plaintext
            expect(hash).not.toBe(password);
            
            // Verify hash starts with bcrypt identifier
            expect(hash).toMatch(/^\$2[aby]\$/);
            
            // Verify hash length is appropriate for bcrypt
            expect(hash.length).toBeGreaterThan(50);
          }
        ),
        { numRuns: 100 }
      );
    }, 300000);
  });
});
