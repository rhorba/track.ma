import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeofencesService } from './geofences.service';

class PolygonPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

class CreateGeofenceDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolygonPointDto)
  polygon: PolygonPointDto[];
}

@Controller('geofences')
@UseGuards(JwtAuthGuard)
export class GeofencesController {
  constructor(private service: GeofencesService) {}

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.organizationId);
  }

  @Post()
  create(@Body() body: CreateGeofenceDto, @Request() req: any) {
    return this.service.create({ ...body, organizationId: req.user.organizationId });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.organizationId);
  }
}
