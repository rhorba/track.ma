import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FleetService } from './fleet.service';
import { DemoService } from './demo.service';

@Controller('fleet')
export class FleetController {
  constructor(
    private fleetService: FleetService,
    private demoService: DemoService,
  ) {}

  @Get('demo/positions')
  @SkipThrottle()
  getDemoPositions() {
    return this.demoService.getInitialPositions();
  }

  @Get('positions')
  @UseGuards(JwtAuthGuard)
  getPositions(@Request() req: any) {
    return this.fleetService.getLatestPositions(req.user.organizationId);
  }

  @Get('history/:vehicleId')
  @UseGuards(JwtAuthGuard)
  getHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.fleetService.getHistory(
      vehicleId,
      new Date(from),
      new Date(to ?? Date.now()),
    );
  }
}
