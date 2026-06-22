import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { UserInvite } from '../../entities/user-invite.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Organization) private orgsRepo: Repository<Organization>,
    @InjectRepository(UserInvite) private invitesRepo: Repository<UserInvite>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    let org: Organization | null = null;
    if (dto.organizationName) {
      const slug = dto.organizationName.toLowerCase().replace(/\s+/g, '-');
      org = this.orgsRepo.create({ name: dto.organizationName, slug, vehicleLimit: 2 });
      org = await this.orgsRepo.save(org);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: org ? 'org_admin' : 'viewer',
      organizationId: org?.id,
    });
    const saved = await this.usersRepo.save(user);
    return this.issueTokens(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'name', 'role', 'organizationId', 'isActive', 'passwordHash'],
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'organizationId', 'isActive', 'refreshTokenHash'],
    });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException();

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) throw new UnauthorizedException();

    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.usersRepo.update(userId, { refreshTokenHash: undefined });
  }

  async acceptInvite(token: string, name: string, password: string) {
    const invite = await this.invitesRepo.findOne({ where: { token, isActive: true } });
    if (!invite) throw new NotFoundException('Invalid or expired invite token');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite token has expired');

    const existing = await this.usersRepo.findOne({ where: { email: invite.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const updated = await this.invitesRepo.update(
      { id: invite.id, isActive: true },
      { isActive: false, acceptedAt: new Date() },
    );
    if (!updated.affected) throw new BadRequestException('Invite already accepted');

    const passwordHash = await bcrypt.hash(password, 12);
    const entity = this.usersRepo.create({
      name,
      email: invite.email,
      passwordHash,
      role: invite.role as any,
      organizationId: invite.organizationId,
    });
    const user = await this.usersRepo.save(entity);
    return this.issueTokens(user);
  }

  private async issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email, name: user.name, orgId: user.organizationId, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update(user.id, { refreshTokenHash });

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId } };
  }
}
