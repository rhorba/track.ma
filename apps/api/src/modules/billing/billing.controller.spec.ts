import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

const mockService = {
  createCheckoutSession: jest
    .fn()
    .mockResolvedValue({ url: 'https://checkout.stripe.com/...' }),
  handleWebhook: jest.fn().mockResolvedValue(undefined),
};

const REQ = { user: { organizationId: 'org-1' } };

describe('BillingController', () => {
  let controller: BillingController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{ provide: BillingService, useValue: mockService }],
    }).compile();
    controller = module.get(BillingController);
  });

  it('checkout delegates to service with orgId, priceId, returnUrl', async () => {
    const body = { priceId: 'price_pro', returnUrl: 'https://app.track.ma' };
    const result = await controller.checkout(body, REQ);
    expect(mockService.createCheckoutSession).toHaveBeenCalledWith(
      'org-1',
      'price_pro',
      'https://app.track.ma',
    );
    expect(result).toHaveProperty('url');
  });

  it('webhook delegates rawBody and stripe-signature to service', async () => {
    const rawBody = Buffer.from('{}');
    const req = { rawBody } as any;
    await controller.webhook(req, 'stripe-sig-abc');
    expect(mockService.handleWebhook).toHaveBeenCalledWith(
      rawBody,
      'stripe-sig-abc',
    );
  });
});
