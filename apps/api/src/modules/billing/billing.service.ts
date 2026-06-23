import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Organization } from '../../entities/organization.entity';

const TIER_LIMITS: Record<string, number> = {
  starter: 5,
  pro: 25,
  business: 9999,
  trial: 2,
};

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    @InjectRepository(Organization) private orgsRepo: Repository<Organization>,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCheckoutSession(
    orgId: string,
    priceId: string,
    returnUrl: string,
  ) {
    const org = await this.orgsRepo.findOneOrFail({ where: { id: orgId } });

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        metadata: { orgId },
      });
      customerId = customer.id;
      await this.orgsRepo.update(orgId, { stripeCustomerId: customerId });
    }

    return this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}/billing?success=1`,
      cancel_url: `${returnUrl}/billing?cancelled=1`,
      metadata: { orgId },
    });
  }

  async handleWebhook(rawBody: Buffer, sig: string) {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      sig,
      this.config.get('STRIPE_WEBHOOK_SECRET')!,
    );

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.created'
    ) {
      const sub = event.data.object;
      const priceId = sub.items.data[0].price.id;
      const tier = this.resolveTier(priceId);
      await this.orgsRepo.update(
        { stripeCustomerId: sub.customer as string },
        {
          stripeSubscriptionId: sub.id,
          tier,
          subscriptionStatus: sub.status as any,
          vehicleLimit: TIER_LIMITS[tier],
        },
      );
    }
  }

  private resolveTier(priceId: string): 'starter' | 'pro' | 'business' {
    if (priceId === this.config.get('STRIPE_PRICE_STARTER')) return 'starter';
    if (priceId === this.config.get('STRIPE_PRICE_PRO')) return 'pro';
    return 'business';
  }
}
