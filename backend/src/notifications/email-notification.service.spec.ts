import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { EmailNotificationService } from './email-notification.service';

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailNotificationService],
    }).compile();

    service = module.get<EmailNotificationService>(EmailNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Feature: unisense-mvp, Property 22: Email notification delivery
  // Validates: Requirements 6.2
  describe('Property 22: Email notification delivery', () => {
    it('should send email to recipient email address for any notification triggered', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(), // recipient
          fc.string({ minLength: 5, maxLength: 100 }), // subject
          fc.string({ minLength: 10, maxLength: 500 }), // body
          async (recipient, subject, body) => {
            // Spy on the internal send method
            const sendSpy = jest.spyOn(service as any, 'sendEmailInternal').mockResolvedValue(undefined);

            // Send email
            await service.sendEmail(recipient, subject, body);

            // Verify email was sent to the correct recipient
            expect(sendSpy).toHaveBeenCalledWith(recipient, subject, body);
            
            // Verify it was called at least once (may be called multiple times due to retries on failure)
            expect(sendSpy).toHaveBeenCalled();

            sendSpy.mockRestore();
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);

    it('should retry email delivery on failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (recipient, subject, body) => {
            // Mock sendEmailInternal to fail twice then succeed
            let callCount = 0;
            const sendSpy = jest.spyOn(service as any, 'sendEmailInternal').mockImplementation(() => {
              callCount++;
              if (callCount <= 2) {
                return Promise.reject(new Error('Temporary failure'));
              }
              return Promise.resolve();
            });

            // Send email
            await service.sendEmail(recipient, subject, body);

            // Verify retry logic was executed (should be called 3 times: initial + 2 retries)
            expect(sendSpy).toHaveBeenCalledTimes(3);

            sendSpy.mockRestore();
          }
        ),
        { numRuns: 10 } // Reduced runs due to retry delays
      );
    }, 120000);
  });
});
