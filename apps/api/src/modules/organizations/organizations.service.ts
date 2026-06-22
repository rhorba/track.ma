import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private repo: Repository<Organization>,
  ) {}

  findById(id: string) {
    return this.repo.findOneOrFail({ where: { id }, relations: ['users', 'vehicles'] });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  async update(id: string, data: Partial<Organization>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
