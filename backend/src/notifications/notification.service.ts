import { Injectable, Logger } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';
import { SmsNotificationService } from './sms-notification.service';
import { WhatsAppNotificationService } from './whatsapp-notification.service';

export interface NotificationRecipient {
  email?: string;
  phoneNumber?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailNotificationService,
    private readonly smsService: SmsNotificationService,
    private readonly whatsappService: WhatsAppNotificationService,
  ) {}

  async sendMultiChannelNotification(
    recipient: NotificationRecipient,
    subject: string,
    message: string,
    universityId: string,
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send email if available
    if (recipient.email) {
      promises.push(
        this.emailService.sendEmail(recipient.email, subject, message).catch((error) => {
          this.logger.error(`Failed to send email to ${recipient.email}: ${error.message}`);
        }),
      );
    }

    // Send SMS if available
    if (recipient.phoneNumber) {
      promises.push(
        this.smsService.sendSms(recipient.phoneNumber, message).catch((error) => {
          this.logger.error(`Failed to send SMS to ${recipient.phoneNumber}: ${error.message}`);
        }),
      );
    }

    // Send WhatsApp if available
    if (recipient.phoneNumber) {
      promises.push(
        this.whatsappService.sendWhatsApp(recipient.phoneNumber, message, universityId).catch((error) => {
          this.logger.error(`Failed to queue WhatsApp message to ${recipient.phoneNumber}: ${error.message}`);
        }),
      );
    }

    // Execute all notifications in parallel, but don't fail if some fail
    await Promise.allSettled(promises);
  }
}
