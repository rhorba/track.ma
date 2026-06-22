import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { TripsModule } from './modules/trips/trips.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BillingModule } from './modules/billing/billing.module';
import { RedisModule } from './modules/redis/redis.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    RedisModule,
    MailModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    VehiclesModule,
    FleetModule,
    AlertsModule,
    TripsModule,
    ReportsModule,
    BillingModule,
  ],
})
export class AppModule {}
