import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('summary')
  summary(@Request() req: any, @Query('from') from: string, @Query('to') to: string) {
    return this.service.getFleetSummary(
      req.user.organizationId,
      new Date(from || Date.now() - 30 * 86400000),
      new Date(to || Date.now()),
    );
  }
}
