import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker } from '../common/utils/circuit-breaker';

@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private readonly maxRetries = 2;
  private readonly retryDelay = 5000; // 5 seconds

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return this.sendSmsWithRetry(phoneNumber, message, 0);
    });
  }

  private async sendSmsWithRetry(
    phoneNumber: string,
    message: string,
    attempt: number,
  ): Promise<void> {
    try {
      await this.sendSmsInternal(phoneNumber, message);
      this.logger.log(`SMS sent successfully to ${phoneNumber}`);
    } catch (error) {
      if (attempt < this.maxRetries) {
        this.logger.warn(`SMS send failed, retrying (${attempt + 1}/${this.maxRetries})...`);
        await this.delay(this.retryDelay);
        return this.sendSmsWithRetry(phoneNumber, message, attempt + 1);
      }
      this.logger.error(`SMS send failed after ${this.maxRetries} retries: ${error.message}`);
      throw error;
    }
  }

  private async sendSmsInternal(phoneNumber: string, message: string): Promise<void> {
    // In a real implementation, this would integrate with an SMS gateway like Twilio, AWS SNS, etc.
    // For now, we'll simulate the SMS sending
    this.logger.debug(`Sending SMS to ${phoneNumber}: ${message}`);
    
    // Simulate API call
    if (process.env.SMS_API_KEY) {
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
