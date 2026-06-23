import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { UserInvite } from '../../entities/user-invite.entity';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

const makeRepo = (overrides: object = {}) => ({
  findOne: jest.fn().mockResolvedValue(null),
  findOneOrFail: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ id: 'user-1', name: 'Test', ...d })),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  count: jest.fn().mockResolvedValue(0),
  ...overrides,
});

const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
const pastDate = new Date(Date.now() - 1000);

const validInvite = {
  id: 'inv-1',
  token: 'valid-token',
  email: 'invited@test.ma',
  organizationId: 'org-1',
  role: 'viewer',
  isActive: true,
  expiresAt: futureDate,
};

describe('AuthService.acceptInvite', () => {
  let service: AuthService;
  let usersRepo: ReturnType<typeof makeRepo>;
  let invitesRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    usersRepo = makeRepo();
    const orgsRepo = makeRepo();
    invitesRepo = makeRepo();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Organization), useValue: orgsRepo },
        { provide: getRepositoryToken(UserInvite), useValue: invitesRepo },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('jwt-token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('secret') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('creates a new user and returns tokens for a valid invite', async () => {
    invitesRepo.findOne.mockResolvedValue(validInvite);
    usersRepo.findOne.mockResolvedValue(null); // no existing user
    invitesRepo.update.mockResolvedValue({ affected: 1 });

    const result = await service.acceptInvite(
      'valid-token',
      'New User',
      'password123',
    );

    expect(result).toHaveProperty('accessToken');
    expect(usersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'invited@test.ma',
        organizationId: 'org-1',
        role: 'viewer',
      }),
    );
    expect(invitesRepo.update).toHaveBeenCalledWith(
      { id: 'inv-1', isActive: true },
      { isActive: false, acceptedAt: expect.any(Date) },
    );
  });

  it('throws NotFoundException for a token that does not exist or is inactive', async () => {
    invitesRepo.findOne.mockResolvedValue(null);

    await expect(
      service.acceptInvite('bad-token', 'Name', 'password123'),
    ).rejects.toThrow(NotFoundException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for an expired token', async () => {
    invitesRepo.findOne.mockResolvedValue({
      ...validInvite,
      expiresAt: pastDate,
    });

    await expect(
      service.acceptInvite('valid-token', 'Name', 'password123'),
    ).rejects.toThrow(BadRequestException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('throws ConflictException if a user with the invite email already exists', async () => {
    invitesRepo.findOne.mockResolvedValue(validInvite);
    usersRepo.findOne.mockResolvedValue({
      id: 'existing',
      email: 'invited@test.ma',
    });

    await expect(
      service.acceptInvite('valid-token', 'Name', 'password123'),
    ).rejects.toThrow(ConflictException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestException on atomic update race condition (affected=0)', async () => {
    invitesRepo.findOne.mockResolvedValue(validInvite);
    usersRepo.findOne.mockResolvedValue(null);
    invitesRepo.update.mockResolvedValue({ affected: 0 }); // race: already accepted

    await expect(
      service.acceptInvite('valid-token', 'Name', 'password123'),
    ).rejects.toThrow(BadRequestException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('assigns the role from the invite to the created user', async () => {
    const adminInvite = { ...validInvite, role: 'org_admin' };
    invitesRepo.findOne.mockResolvedValue(adminInvite);
    usersRepo.findOne.mockResolvedValue(null);
    invitesRepo.update.mockResolvedValue({ affected: 1 });

    await service.acceptInvite('valid-token', 'Admin User', 'password123');

    expect(usersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'org_admin' }),
    );
  });
});
