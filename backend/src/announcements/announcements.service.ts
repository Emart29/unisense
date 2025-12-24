import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../entities/announcement.entity';
import { User } from '../entities/user.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    createAnnouncementDto: CreateAnnouncementDto,
    universityId: string,
    createdBy: string,
  ): Promise<Announcement> {
    // Create the announcement
    const announcement = this.announcementRepository.create({
      ...createAnnouncementDto,
      universityId,
      createdBy,
    });

    const savedAnnouncement = await this.announcementRepository.save(announcement);

    // Trigger notifications asynchronously (don't await)
    this.sendNotifications(savedAnnouncement).catch((error) => {
      console.error('Failed to send notifications:', error);
    });

    return savedAnnouncement;
  }

  private async sendNotifications(announcement: Announcement): Promise<void> {
    // Find all users matching the target roles in the same university
    const recipients = await this.userRepository.find({
      where: {
        universityId: announcement.universityId,
        role: announcement.targetRoles.length > 0 ? undefined : undefined,
      },
    });

    // Filter by target roles
    const filteredRecipients = recipients.filter((user) =>
      announcement.targetRoles.includes(user.role),
    );

    // Send notifications to all recipients
    const notificationPromises = filteredRecipients.map((recipient) =>
      this.notificationService.sendMultiChannelNotification(
        {
          email: recipient.email,
          phoneNumber: undefined, // Would need to add phone number to user entity
        },
        announcement.title,
        announcement.content,
        announcement.universityId,
      ),
    );

    await Promise.allSettled(notificationPromises);
  }

  async findAll(universityId: string, userRole?: string): Promise<Announcement[]> {
    const queryBuilder = this.announcementRepository
      .createQueryBuilder('announcement')
      .where('announcement.universityId = :universityId', { universityId })
      .orderBy('announcement.createdAt', 'DESC');

    // If user role is provided, filter announcements targeting that role
    if (userRole) {
      queryBuilder.andWhere(':role = ANY(announcement.targetRoles)', { role: userRole });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, universityId: string): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id, universityId },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  async remove(id: string, universityId: string): Promise<void> {
    const announcement = await this.findOne(id, universityId);
    await this.announcementRepository.remove(announcement);
  }
}
