import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { Organization } from '../../entities/organization.entity';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_new' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session' }),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

const mockOrg: Partial<Organization> = {
  id: 'org-1',
  stripeCustomerId: null as any,
};

const mockOrgsRepo = {
  findOneOrFail: jest.fn().mockResolvedValue(mockOrg),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
};

const mockConfig = {
  get: jest.fn((key: string, def?: string) => {
    const map: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_fake',
      STRIPE_WEBHOOK_SECRET: 'whsec_fake',
      STRIPE_PRICE_STARTER: 'price_starter',
      STRIPE_PRICE_PRO: 'price_pro',
    };
    return map[key] ?? def ?? '';
  }),
};

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: getRepositoryToken(Organization), useValue: mockOrgsRepo },
      ],
    }).compile();
    service = module.get(BillingService);
  });

  describe('createCheckoutSession', () => {
    it('creates a new Stripe customer when org has none', async () => {
      mockOrgsRepo.findOneOrFail.mockResolvedValueOnce({ id: 'org-1', stripeCustomerId: null });
      const result = await service.createCheckoutSession('org-1', 'price_pro', 'https://app.track.ma');
      expect(result).toHaveProperty('url');
      expect(mockOrgsRepo.update).toHaveBeenCalledWith('org-1', { stripeCustomerId: 'cus_new' });
    });

    it('reuses existing Stripe customer', async () => {
      mockOrgsRepo.findOneOrFail.mockResolvedValueOnce({ id: 'org-1', stripeCustomerId: 'cus_existing' });
      const result = await service.createCheckoutSession('org-1', 'price_pro', 'https://app.track.ma');
      expect(result).toHaveProperty('url');
    });
  });

  describe('handleWebhook', () => {
    it('updates org tier on subscription.updated event', async () => {
      const stripe = (service as any).stripe;
      const mockSub = {
        id: 'sub_1',
        customer: 'cus_existing',
        status: 'active',
        metadata: { orgId: 'org-1' },
        items: { data: [{ price: { id: 'price_pro' } }] },
      };
      stripe.webhooks.constructEvent.mockReturnValueOnce({
        type: 'customer.subscription.updated',
        data: { object: mockSub },
      });

      await service.handleWebhook(Buffer.from('{}'), 'sig');
      expect(mockOrgsRepo.update).toHaveBeenCalledWith(
        { stripeCustomerId: 'cus_existing' },
        expect.objectContaining({ tier: 'pro', subscriptionStatus: 'active' }),
      );
    });

    it('ignores unhandled webhook event types', async () => {
      const stripe = (service as any).stripe;
      stripe.webhooks.constructEvent.mockReturnValueOnce({
        type: 'payment_intent.succeeded',
        data: { object: {} },
      });

      await service.handleWebhook(Buffer.from('{}'), 'sig');
      expect(mockOrgsRepo.update).not.toHaveBeenCalled();
    });
  });
});
