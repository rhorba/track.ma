import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TripsService } from './trips.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private service: TripsService) {}

  @Get('vehicle/:vehicleId')
  list(@Param('vehicleId') vehicleId: string) {
    return this.service.getTrips(vehicleId);
  }

  @Get(':id/positions')
  positions(@Param('id') id: string) {
    return this.service.getTripPositions(id);
  }
}
