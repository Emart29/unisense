import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { JwtStrategy } from './jwt.strategy';
import { User, UserRole } from '../entities/user.entity';
import { JwtPayload } from './auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  // Feature: unisense-mvp, Property 3: Token-based authorization
  // Validates: Requirements 1.3
  describe('Property 3: Token-based authorization', () => {
    it('should validate JWT token and return user for any authenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.uuid(),
          fc.constantFrom(...Object.values(UserRole)),
          async (userId, email, universityId, role) => {
            // Create mock user
            const mockUser: User = {
              id: userId,
              email,
              passwordHash: 'hashed-password',
              universityId,
              role,
              createdAt: new Date(),
              university: null,
            };

            // Create JWT payload
            const payload: JwtPayload = {
              sub: userId,
              email,
              universityId,
              role,
            };

            // Mock repository to return the user
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

            // Validate the payload
            const result = await strategy.validate(payload);

            // Verify user is returned
            expect(result).toBeDefined();
            expect(result.id).toBe(userId);
            expect(result.email).toBe(email);
            expect(result.universityId).toBe(universityId);
            expect(result.role).toBe(role);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid tokens for non-existent users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.uuid(),
          fc.constantFrom(...Object.values(UserRole)),
          async (userId, email, universityId, role) => {
            // Create JWT payload
            const payload: JwtPayload = {
              sub: userId,
              email,
              universityId,
              role,
            };

            // Mock repository to return null (user not found)
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

            // Validate the payload should throw
            await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
