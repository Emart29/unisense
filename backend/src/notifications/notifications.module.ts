import { Module } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';
import { SmsNotificationService } from './sms-notification.service';
import { WhatsAppNotificationService } from './whatsapp-notification.service';
import { NotificationService } from './notification.service';

@Module({
  providers: [
    EmailNotificationService,
    SmsNotificationService,
    WhatsAppNotificationService,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
