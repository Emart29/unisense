import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker } from '../common/utils/circuit-breaker';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private readonly maxRetries = 2;
  private readonly retryDelay = 5000; // 5 seconds

  async sendEmail(recipient: string, subject: string, body: string): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return this.sendEmailWithRetry(recipient, subject, body, 0);
    });
  }

  private async sendEmailWithRetry(
    recipient: string,
    subject: string,
    body: string,
    attempt: number,
  ): Promise<void> {
    try {
      await this.sendEmailInternal(recipient, subject, body);
      this.logger.log(`Email sent successfully to ${recipient}`);
    } catch (error) {
      if (attempt < this.maxRetries) {
        this.logger.warn(`Email send failed, retrying (${attempt + 1}/${this.maxRetries})...`);
        await this.delay(this.retryDelay);
        return this.sendEmailWithRetry(recipient, subject, body, attempt + 1);
      }
      this.logger.error(`Email send failed after ${this.maxRetries} retries: ${error.message}`);
      throw error;
    }
  }

  private async sendEmailInternal(recipient: string, subject: string, body: string): Promise<void> {
    // In a real implementation, this would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll simulate the email sending
    this.logger.debug(`Sending email to ${recipient}: ${subject}`);
    
    // Simulate API call
    if (process.env.EMAIL_API_KEY) {
      // Would make actual API call here
      return Promise.resolve();
    }
    
    // For testing/development, just log
    return Promise.resolve();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }
}
