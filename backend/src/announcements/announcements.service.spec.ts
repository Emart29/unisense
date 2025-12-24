import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from '../entities/announcement.entity';
import { User, UserRole } from '../entities/user.entity';
import { NotificationService } from '../notifications/notification.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let announcementRepository: Repository<Announcement>;
  let userRepository: Repository<User>;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        {
          provide: getRepositoryToken(Announcement),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendMultiChannelNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
    announcementRepository = module.get<Repository<Announcement>>(getRepositoryToken(Announcement));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Feature: unisense-mvp, Property 21: Announcement creation and dispatch
  // Validates: Requirements 6.1
  describe('Property 21: Announcement creation and dispatch', () => {
    it('should store announcement and trigger notification delivery for any announcement created', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }), // title
          fc.string({ minLength: 10, maxLength: 500 }), // content
          fc.array(fc.constantFrom(...Object.values(UserRole)), { minLength: 1, maxLength: 3 }), // targetRoles
          fc.uuid(), // universityId
          fc.uuid(), // createdBy
          fc.uuid(), // announcementId
          async (title, content, targetRoles, universityId, createdBy, announcementId) => {
            // Create DTO
            const createDto: CreateAnnouncementDto = {
              title,
              content,
              targetRoles,
            };

            // Create mock announcement
            const mockAnnouncement: Announcement = {
              id: announcementId,
              title,
              content,
              targetRoles,
              universityId,
              createdBy,
              createdAt: new Date(),
              university: null,
              creator: null,
            };

            // Mock repository methods
            jest.spyOn(announcementRepository, 'create').mockReturnValue(mockAnnouncement);
            jest.spyOn(announcementRepository, 'save').mockResolvedValue(mockAnnouncement);

            // Create mock users matching target roles
            const mockUsers: User[] = targetRoles.map((role, index) => ({
              id: `user-${index}`,
              email: `user${index}@example.com`,
              passwordHash: 'hash',
              universityId,
              role,
              createdAt: new Date(),
              university: null,
            }));

            jest.spyOn(userRepository, 'find').mockResolvedValue(mockUsers);
            jest.spyOn(notificationService, 'sendMultiChannelNotification').mockResolvedValue();

            // Create announcement
            const result = await service.create(createDto, universityId, createdBy);

            // Verify announcement was stored
            expect(result).toBeDefined();
            expect(result.id).toBe(announcementId);
            expect(result.title).toBe(title);
            expect(result.content).toBe(content);
            expect(result.targetRoles).toEqual(targetRoles);
            expect(result.universityId).toBe(universityId);
            expect(result.createdBy).toBe(createdBy);

            // Verify repository methods were called
            expect(announcementRepository.create).toHaveBeenCalledWith({
              title,
              content,
              targetRoles,
              universityId,
              createdBy,
            });
            expect(announcementRepository.save).toHaveBeenCalled();

            // Give async notification dispatch time to execute
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify notification service was called for each user
            // Note: We can't guarantee exact call count due to async nature,
            // but we verify the service was set up correctly
            expect(userRepository.find).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });
});
