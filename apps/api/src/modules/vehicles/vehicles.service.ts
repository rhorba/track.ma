import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../entities/vehicle.entity';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private repo: Repository<Vehicle>) {}

  findByOrg(organizationId: string) {
    return this.repo.find({ where: { organizationId, isActive: true } });
  }

  async findOne(id: string, organizationId: string) {
    const vehicle = await this.repo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.organizationId !== organizationId) throw new ForbiddenException();
    return vehicle;
  }

  create(dto: CreateVehicleDto, organizationId: string) {
    const vehicle = this.repo.create({ ...dto, organizationId });
    return this.repo.save(vehicle);
  }

  async update(id: string, dto: UpdateVehicleDto, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.repo.update(id, dto);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.repo.update(id, { isActive: false });
  }
}
