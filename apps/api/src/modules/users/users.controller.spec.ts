import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { InviteService } from './invite.service';
import { OrganizationsService } from '../organizations/organizations.service';

const mockUsersService = {
  findById: jest.fn().mockResolvedValue({ id: 'u-1', name: 'Ali' }),
  findByOrg: jest.fn().mockResolvedValue([{ id: 'u-1' }]),
  updateRole: jest.fn().mockResolvedValue({ id: 'u-2', role: 'fleet_manager' }),
};
const mockInviteService = {
  send: jest.fn().mockResolvedValue({ token: 'abc' }),
};
const mockOrgsService = {
  findById: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Transport Co' }),
};

const REQ = { user: { id: 'u-1', organizationId: 'org-1', role: 'org_admin' } };

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: InviteService, useValue: mockInviteService },
        { provide: OrganizationsService, useValue: mockOrgsService },
      ],
    }).compile();
    controller = module.get(UsersController);
  });

  it('getMe returns current user', async () => {
    const result = await controller.getMe(REQ);
    expect(mockUsersService.findById).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'u-1', name: 'Ali' });
  });

  it('getTeam returns org members', async () => {
    const result = await controller.getTeam(REQ);
    expect(mockUsersService.findByOrg).toHaveBeenCalledWith('org-1');
    expect(result).toHaveLength(1);
  });

  it('invite sends invite with correct params', async () => {
    const body = { email: 'new@test.ma', role: 'viewer' };
    await controller.invite(body as any, REQ);
    expect(mockOrgsService.findById).toHaveBeenCalledWith('org-1');
    expect(mockInviteService.send).toHaveBeenCalledWith(
      'new@test.ma', 'viewer', 'org-1', 'u-1', 'Transport Co',
    );
  });

  it('invite uses default viewer role when role not specified', async () => {
    const body = { email: 'new@test.ma' };
    await controller.invite(body as any, REQ);
    expect(mockInviteService.send).toHaveBeenCalledWith(
      'new@test.ma', 'viewer', 'org-1', 'u-1', 'Transport Co',
    );
  });

  it('updateRole delegates to usersService', async () => {
    const body = { role: 'fleet_manager' };
    const result = await controller.updateRole('u-2', body as any, REQ);
    expect(mockUsersService.updateRole).toHaveBeenCalledWith('u-2', 'fleet_manager', 'u-1', 'org-1');
    expect(result.role).toBe('fleet_manager');
  });
});
