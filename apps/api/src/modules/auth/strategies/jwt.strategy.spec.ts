import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../../../entities/user.entity';

const activeUser = { id: 'u-1', email: 'admin@test.ma', isActive: true } as User;

const mockUsersRepo = {
  findOne: jest.fn().mockResolvedValue(activeUser),
};

const mockConfig = {
  get: jest.fn((key: string, def?: string) => (key === 'JWT_SECRET' ? 'test-secret' : def ?? '')),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfig },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
      ],
    }).compile();
    strategy = module.get(JwtStrategy);
  });

  it('returns user when active', async () => {
    const payload = { sub: 'u-1', email: 'admin@test.ma', orgId: 'org-1', role: 'org_admin' };
    const result = await strategy.validate(payload);
    expect(mockUsersRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u-1', isActive: true } });
    expect(result).toEqual(activeUser);
  });

  it('throws UnauthorizedException when user not found', async () => {
    mockUsersRepo.findOne.mockResolvedValueOnce(null);
    const payload = { sub: 'u-missing', email: 'x@x.ma', orgId: 'org-1', role: 'viewer' };
    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});
