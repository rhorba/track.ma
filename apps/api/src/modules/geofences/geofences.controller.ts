import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeofencesService } from './geofences.service';

@Controller('geofences')
@UseGuards(JwtAuthGuard)
export class GeofencesController {
  constructor(private service: GeofencesService) {}

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.organizationId);
  }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.service.create({ ...body, organizationId: req.user.organizationId });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.organizationId);
  }
}
