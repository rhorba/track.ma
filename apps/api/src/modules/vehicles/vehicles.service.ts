import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../entities/vehicle.entity';
import { Organization } from '../../entities/organization.entity';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private repo: Repository<Vehicle>,
    @InjectRepository(Organization) private orgsRepo: Repository<Organization>,
  ) {}

  findByOrg(organizationId: string) {
    return this.repo.find({ where: { organizationId, isActive: true } });
  }

  async findOne(id: string, organizationId: string) {
    const vehicle = await this.repo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.organizationId !== organizationId) throw new ForbiddenException();
    return vehicle;
  }

  async create(dto: CreateVehicleDto, organizationId: string) {
    const org = await this.orgsRepo.findOneOrFail({ where: { id: organizationId } });
    const count = await this.repo.count({ where: { organizationId, isActive: true } });
    if (count >= org.vehicleLimit) {
      throw new BadRequestException(
        `Vehicle limit of ${org.vehicleLimit} reached for your plan (${org.tier}). Upgrade to add more vehicles.`,
      );
    }
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
