import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';

const makeOrgRepo = (overrides: object = {}) => ({
  findOneOrFail: jest.fn(),
  findOne: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  createQueryBuilder: jest.fn().mockReturnValue({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
  }),
  ...overrides,
});

const makeUserRepo = (overrides: object = {}) => ({
  count: jest.fn().mockResolvedValue(0),
  ...overrides,
});

const sampleOrg: Partial<Organization> = {
  id: 'org-1',
  name: 'Acme',
  slug: 'acme',
  tier: 'starter',
  subscriptionStatus: 'active',
  vehicleLimit: 5,
};

describe('OrganizationsService.updateBranding', () => {
  let service: OrganizationsService;
  let orgRepo: ReturnType<typeof makeOrgRepo>;

  beforeEach(async () => {
    orgRepo = makeOrgRepo();
    const module = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: getRepositoryToken(User), useValue: makeUserRepo() },
      ],
    }).compile();
    service = module.get(OrganizationsService);
  });

  it('saves logoUrl and primaryColor then returns branding fields', async () => {
    orgRepo.findOneOrFail.mockResolvedValue({
      ...sampleOrg,
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#ff0000',
    });
    const result = await service.updateBranding('org-1', {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#ff0000',
    });
    expect(orgRepo.update).toHaveBeenCalledWith('org-1', {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#ff0000',
    });
    expect(result.logoUrl).toBe('https://example.com/logo.png');
    expect(result.primaryColor).toBe('#ff0000');
    expect(result.slug).toBe('acme');
  });

  it('findBySlugPublic returns null for unknown slug', async () => {
    orgRepo.findOne.mockResolvedValue(null);
    const result = await service.findBySlugPublic('unknown');
    expect(result).toBeNull();
  });

  it('findBySlugPublic returns branding fields for known slug', async () => {
    orgRepo.findOne.mockResolvedValue({
      ...sampleOrg,
      logoUrl: null,
      primaryColor: '#2563eb',
    });
    const result = await service.findBySlugPublic('acme');
    expect(result).toMatchObject({ slug: 'acme', primaryColor: '#2563eb' });
  });
});

describe('OrganizationsService.getUsage', () => {
  let service: OrganizationsService;
  let orgRepo: ReturnType<typeof makeOrgRepo>;
  let userRepo: ReturnType<typeof makeUserRepo>;

  beforeEach(async () => {
    orgRepo = makeOrgRepo();
    userRepo = makeUserRepo();

    const module = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  it('returns tier, status, vehicleLimit from org', async () => {
    orgRepo.findOneOrFail.mockResolvedValue(sampleOrg);
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(3),
    };
    orgRepo.createQueryBuilder.mockReturnValue(qb);
    userRepo.count.mockResolvedValue(2);

    const result = await service.getUsage('org-1');

    expect(result.tier).toBe('starter');
    expect(result.subscriptionStatus).toBe('active');
    expect(result.vehicleLimit).toBe(5);
  });

  it('returns correct vehicleCount from query builder', async () => {
    orgRepo.findOneOrFail.mockResolvedValue(sampleOrg);
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(4),
    };
    orgRepo.createQueryBuilder.mockReturnValue(qb);
    userRepo.count.mockResolvedValue(1);

    const result = await service.getUsage('org-1');
    expect(result.vehicleCount).toBe(4);
  });

  it('returns correct userCount from users repository', async () => {
    orgRepo.findOneOrFail.mockResolvedValue(sampleOrg);
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };
    orgRepo.createQueryBuilder.mockReturnValue(qb);
    userRepo.count.mockResolvedValue(7);

    const result = await service.getUsage('org-1');
    expect(result.userCount).toBe(7);
    expect(userRepo.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', isActive: true },
    });
  });

  it('returns 0 counts when org has no vehicles or users', async () => {
    orgRepo.findOneOrFail.mockResolvedValue({
      ...sampleOrg,
      tier: 'trial',
      vehicleLimit: 2,
    });
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };
    orgRepo.createQueryBuilder.mockReturnValue(qb);
    userRepo.count.mockResolvedValue(0);

    const result = await service.getUsage('org-1');
    expect(result.vehicleCount).toBe(0);
    expect(result.userCount).toBe(0);
  });
});
