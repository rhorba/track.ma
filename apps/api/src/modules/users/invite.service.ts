import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UserInvite } from '../../entities/user-invite.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(UserInvite) private repo: Repository<UserInvite>,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  async send(email: string, role: string, orgId: string, invitedByUserId: string, orgName: string) {
    const existing = await this.repo.findOne({ where: { email, organizationId: orgId, isActive: true } });
    if (existing && existing.expiresAt > new Date()) {
      throw new BadRequestException('A pending invite already exists for this email');
    }
    if (existing) {
      await this.repo.update(existing.id, { isActive: false });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await this.repo.save(
      this.repo.create({ token, email, organizationId: orgId, invitedByUserId, role: role as any, expiresAt }),
    );

    const appUrl = this.config.get('APP_URL') ?? 'http://localhost:3000';
    await this.mail.sendInvite(email, orgName, `${appUrl}/accept-invite?token=${token}`);
    return { message: 'Invite sent' };
  }
}
