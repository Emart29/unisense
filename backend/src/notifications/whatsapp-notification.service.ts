import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { CircuitBreaker } from '../common/utils/circuit-breaker';

interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  universityId: string;
}

@Injectable()
export class WhatsAppNotificationService {
  private readonly logger = new Logger(WhatsAppNotificationService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    
    this.redis.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async sendWhatsApp(phoneNumber: string, message: string, universityId: string): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      const whatsappMessage: WhatsAppMessage = {
        phoneNumber,
        message,
        universityId,
      };

      await this.redis.lpush('whatsapp:queue', JSON.stringify(whatsappMessage));
      this.logger.log(`WhatsApp message queued for ${phoneNumber}`);
    });
  }

  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
