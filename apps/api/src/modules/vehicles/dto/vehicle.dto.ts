import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import type { VehicleType } from '../../../entities/vehicle.entity';

export class CreateVehicleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  plate?: string;

  @IsEnum(['car', 'truck', 'van', 'motorcycle', 'boat', 'scooter'])
  @IsOptional()
  type?: VehicleType;

  @IsString()
  @IsOptional()
  imei?: string;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsNumber()
  @IsOptional()
  fuelConsumptionRate?: number;
}

export class UpdateVehicleDto extends CreateVehicleDto {}
