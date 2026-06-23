import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

const mockService = {
  findById: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
  getUsage: jest.fn().mockResolvedValue({ vehicleCount: 3, vehicleLimit: 5 }),
  updateBranding: jest.fn().mockResolvedValue({
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#ff0000',
    slug: 'acme',
  }),
  findBySlugPublic: jest.fn(),
};

const REQ = { user: { organizationId: 'org-1' } };

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [{ provide: OrganizationsService, useValue: mockService }],
    }).compile();
    controller = module.get(OrganizationsController);
  });

  it('getMyOrg returns org for user orgId', async () => {
    const result = await controller.getMyOrg(REQ);
    expect(mockService.findById).toHaveBeenCalledWith('org-1');
    expect(result).toEqual({ id: 'org-1', name: 'Test Org' });
  });

  it('getUsage returns usage stats for org', async () => {
    const result = await controller.getUsage(REQ);
    expect(mockService.getUsage).toHaveBeenCalledWith('org-1');
    expect(result).toHaveProperty('vehicleLimit');
  });

  it('updateBranding calls service with orgId and dto', async () => {
    const dto = { logoUrl: 'https://example.com/logo.png', primaryColor: '#ff0000' };
    const result = await controller.updateBranding(REQ, dto);
    expect(mockService.updateBranding).toHaveBeenCalledWith('org-1', dto);
    expect(result.slug).toBe('acme');
  });

  it('getPublicBranding returns branding for known slug', async () => {
    mockService.findBySlugPublic.mockResolvedValue({
      name: 'Acme',
      slug: 'acme',
      logoUrl: null,
      primaryColor: '#2563eb',
    });
    const result = await controller.getPublicBranding('acme');
    expect(mockService.findBySlugPublic).toHaveBeenCalledWith('acme');
    expect(result.name).toBe('Acme');
  });

  it('getPublicBranding throws NotFoundException for unknown slug', async () => {
    mockService.findBySlugPublic.mockResolvedValue(null);
    await expect(controller.getPublicBranding('ghost')).rejects.toThrow(NotFoundException);
  });

  it('getPublicBranding throws NotFoundException when no slug provided', async () => {
    await expect(controller.getPublicBranding(undefined as any)).rejects.toThrow(NotFoundException);
  });
});
