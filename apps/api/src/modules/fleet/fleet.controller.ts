import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FleetService } from './fleet.service';

@Controller('fleet')
@UseGuards(JwtAuthGuard)
export class FleetController {
  constructor(private fleetService: FleetService) {}

  @Get('positions')
  getPositions(@Request() req: any) {
    return this.fleetService.getLatestPositions(req.user.organizationId);
  }

  @Get('history/:vehicleId')
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
