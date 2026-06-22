import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private service: VehiclesService) {}

  @Get()
  list(@Request() req: any) {
    return this.service.findByOrg(req.user.organizationId);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() dto: CreateVehicleDto, @Request() req: any) {
    return this.service.create(dto, req.user.organizationId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto, @Request() req: any) {
    return this.service.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.organizationId);
  }
}
