import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private repo: Repository<Organization>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  findById(id: string) {
    return this.repo.findOneOrFail({
      where: { id },
      relations: ['users', 'vehicles'],
    });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  async update(id: string, data: Partial<Organization>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async getUsage(orgId: string) {
    const org = await this.repo.findOneOrFail({ where: { id: orgId } });
    const [vehicleCount, userCount] = await Promise.all([
      this.repo
        .createQueryBuilder('o')
        .innerJoin('o.vehicles', 'v', 'v.is_active = true')
        .where('o.id = :orgId', { orgId })
        .getCount(),
      this.usersRepo.count({
        where: { organizationId: orgId, isActive: true },
      }),
    ]);
    return {
      tier: org.tier,
      subscriptionStatus: org.subscriptionStatus,
      vehicleCount,
      vehicleLimit: org.vehicleLimit,
      userCount,
    };
  }
}
