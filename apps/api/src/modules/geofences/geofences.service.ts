import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Geofence } from '../../entities/geofence.entity';

@Injectable()
export class GeofencesService {
  constructor(@InjectRepository(Geofence) private repo: Repository<Geofence>) {}

  list(organizationId: string) {
    return this.repo.find({ where: { organizationId, isActive: true } });
  }

  create(data: {
    name: string;
    polygon: { lat: number; lng: number }[];
    organizationId: string;
  }) {
    if (!data.polygon || data.polygon.length < 3) {
      throw new BadRequestException('Polygon must have at least 3 points');
    }
    return this.repo.save(this.repo.create(data));
  }

  async remove(id: string, organizationId: string) {
    await this.repo.update({ id, organizationId }, { isActive: false });
  }
}
