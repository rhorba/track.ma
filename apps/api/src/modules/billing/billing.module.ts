import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../entities/organization.entity';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
