import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByOrg(organizationId: string) {
    return this.repo.find({ where: { organizationId } });
  }

  async updateRole(targetId: string, role: UserRole, requesterId: string, requesterOrgId: string) {
    if (targetId === requesterId) throw new ForbiddenException('Cannot change your own role');
    const target = await this.repo.findOne({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.organizationId !== requesterOrgId) throw new ForbiddenException();
    await this.repo.update(targetId, { role });
    return { ...target, role };
  }
}
