import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

const ORG_ID = 'org-1';
const USER: Partial<User> = {
  id: 'u-1',
  organizationId: ORG_ID,
  name: 'Ali',
  role: 'viewer',
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('findById delegates to repo', async () => {
    mockRepo.findOne.mockResolvedValue(USER);
    const result = await service.findById('u-1');
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u-1' } });
    expect(result).toEqual(USER);
  });

  it('findByOrg returns org members', async () => {
    mockRepo.find.mockResolvedValue([USER]);
    const result = await service.findByOrg(ORG_ID);
    expect(result).toEqual([USER]);
  });

  describe('updateRole', () => {
    it('throws ForbiddenException when trying to change own role', async () => {
      await expect(
        service.updateRole('u-1', 'org_admin' as any, 'u-1', ORG_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when target user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateRole('u-2', 'fleet_manager' as any, 'u-1', ORG_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when target is in different org', async () => {
      mockRepo.findOne.mockResolvedValue({
        ...USER,
        organizationId: 'other-org',
      });
      await expect(
        service.updateRole('u-2', 'viewer' as any, 'u-1', ORG_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates role and returns updated user', async () => {
      mockRepo.findOne.mockResolvedValue(USER);
      mockRepo.update.mockResolvedValue(undefined);
      const result = await service.updateRole(
        'u-1',
        'fleet_manager',
        'requester-id',
        ORG_ID,
      );
      expect(mockRepo.update).toHaveBeenCalledWith('u-1', {
        role: 'fleet_manager',
      });
      expect(result.role).toBe('fleet_manager');
    });
  });
});
