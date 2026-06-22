import { Controller, Post, Body, Headers, Req, UseGuards, Request } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private service: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@Body() body: { priceId: string; returnUrl: string }, @Request() req: any) {
    return this.service.createCheckoutSession(req.user.organizationId, body.priceId, body.returnUrl);
  }

  @Post('webhook')
  webhook(@Req() req: RawBodyRequest<ExpressRequest>, @Headers('stripe-signature') sig: string) {
    return this.service.handleWebhook(req.rawBody as Buffer, sig);
  }
}
