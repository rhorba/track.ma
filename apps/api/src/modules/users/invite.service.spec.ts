import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { InviteService } from './invite.service';
import { UserInvite } from '../../entities/user-invite.entity';
import { MailService } from '../mail/mail.service';

const makeRepo = (overrides: object = {}) => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ id: 'inv-1', ...d })),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  ...overrides,
});

const makeMailService = () => ({
  sendInvite: jest.fn().mockResolvedValue(undefined),
});

const makeConfigService = () => ({
  get: jest.fn((key: string) =>
    key === 'APP_URL' ? 'http://localhost:3000' : undefined,
  ),
});

describe('InviteService', () => {
  let service: InviteService;
  let repo: ReturnType<typeof makeRepo>;
  let mail: ReturnType<typeof makeMailService>;

  beforeEach(async () => {
    repo = makeRepo();
    mail = makeMailService();

    const module = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: getRepositoryToken(UserInvite), useValue: repo },
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: makeConfigService() },
      ],
    }).compile();

    service = module.get(InviteService);
  });

  it('creates a new invite and sends email when no prior invite exists', async () => {
    repo.findOne.mockResolvedValue(null);

    await service.send(
      'new@user.ma',
      'viewer',
      'org-1',
      'admin-1',
      'Acme Corp',
    );

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@user.ma',
        organizationId: 'org-1',
        invitedByUserId: 'admin-1',
        role: 'viewer',
      }),
    );
    expect(mail.sendInvite).toHaveBeenCalledWith(
      'new@user.ma',
      'Acme Corp',
      expect.stringContaining('/accept-invite?token='),
    );
  });

  it('generates a 64-char hex token (256-bit entropy)', async () => {
    await service.send('a@b.ma', 'viewer', 'org-1', 'admin-1', 'Org');
    const saved = (repo.save as jest.Mock).mock.calls[0][0];
    expect(saved.token).toHaveLength(64);
    expect(saved.token).toMatch(/^[0-9a-f]+$/);
  });

  it('sets expiresAt to ~48 hours from now', async () => {
    const before = Date.now();
    await service.send('a@b.ma', 'viewer', 'org-1', 'admin-1', 'Org');
    const after = Date.now();

    const saved = (repo.save as jest.Mock).mock.calls[0][0];
    const expMs = saved.expiresAt.getTime();
    const fortyEightH = 48 * 60 * 60 * 1000;

    expect(expMs).toBeGreaterThanOrEqual(before + fortyEightH - 100);
    expect(expMs).toBeLessThanOrEqual(after + fortyEightH + 100);
  });

  it('deactivates an existing expired invite before creating a new one', async () => {
    const expiredInvite = {
      id: 'old-inv',
      email: 'a@b.ma',
      organizationId: 'org-1',
      isActive: true,
      expiresAt: new Date(Date.now() - 1000), // already expired
    };
    repo.findOne.mockResolvedValue(expiredInvite);

    await service.send('a@b.ma', 'viewer', 'org-1', 'admin-1', 'Org');

    expect(repo.update).toHaveBeenCalledWith('old-inv', { isActive: false });
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws BadRequestException when a valid pending invite already exists', async () => {
    const activeInvite = {
      id: 'active-inv',
      email: 'a@b.ma',
      organizationId: 'org-1',
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // future
    };
    repo.findOne.mockResolvedValue(activeInvite);

    await expect(
      service.send('a@b.ma', 'viewer', 'org-1', 'admin-1', 'Org'),
    ).rejects.toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(mail.sendInvite).not.toHaveBeenCalled();
  });

  it('uses APP_URL from config for the invite link', async () => {
    await service.send('x@y.ma', 'fleet_manager', 'org-1', 'admin-1', 'Org');
    const inviteUrl = mail.sendInvite.mock.calls[0][2] as string;
    expect(inviteUrl).toContain('http://localhost:3000');
  });
});
