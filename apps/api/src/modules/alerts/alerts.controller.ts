import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private service: AlertsService) {}

  @Get()
  list(@Request() req: any) {
    return this.service.getAlerts(req.user.organizationId);
  }

  @Get('rules')
  rules(@Request() req: any) {
    return this.service.getRules(req.user.organizationId);
  }

  @Post('rules')
  createRule(@Body() body: any, @Request() req: any) {
    return this.service.createRule({ ...body, organizationId: req.user.organizationId });
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.service.acknowledge(id);
  }
}
