import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

const mockConfig = {
  get: jest.fn((key: string) => {
    const cfg: Record<string, string | number> = {
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: 587,
      SMTP_USER: 'noreply@track.ma',
      SMTP_PASS: 'secret',
    };
    return cfg[key];
  }),
};

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(MailService);
  });

  describe('sendAlert', () => {
    it('sends email via transporter', async () => {
      await service.sendAlert(
        'user@test.ma',
        'Alert!',
        '<p>Speed exceeded</p>',
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.ma',
          subject: 'Alert!',
          html: '<p>Speed exceeded</p>',
        }),
      );
    });

    it('silently catches SMTP errors without throwing', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP timeout'));
      await expect(
        service.sendAlert('user@test.ma', 'Alert!', '<p>body</p>'),
      ).resolves.not.toThrow();
    });
  });

  describe('sendInvite', () => {
    it('sends invite email with org name and link', async () => {
      await service.sendInvite(
        'newuser@test.ma',
        'Transport Co',
        'https://track.ma/accept?token=abc',
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@test.ma',
          subject: expect.stringContaining('Transport Co'),
          html: expect.stringContaining('https://track.ma/accept?token=abc'),
        }),
      );
    });
  });
});
