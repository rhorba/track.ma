import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from '../../entities/vehicle.entity';
import { Organization } from '../../entities/organization.entity';

const mockVehicleRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockOrgsRepo = {
  findOneOrFail: jest.fn(),
};

const ORG_ID = 'org-1';
const VEHICLE: Partial<Vehicle> = { id: 'v-1', organizationId: ORG_ID, isActive: true, name: 'Truck 1' };
const ORG: Partial<Organization> = { id: ORG_ID, vehicleLimit: 5, tier: 'starter' } as any;

describe('VehiclesService', () => {
  let service: VehiclesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: mockVehicleRepo },
        { provide: getRepositoryToken(Organization), useValue: mockOrgsRepo },
      ],
    }).compile();
    service = module.get(VehiclesService);
  });

  describe('findByOrg', () => {
    it('returns active vehicles for org', async () => {
      mockVehicleRepo.find.mockResolvedValue([VEHICLE]);
      const result = await service.findByOrg(ORG_ID);
      expect(mockVehicleRepo.find).toHaveBeenCalledWith({ where: { organizationId: ORG_ID, isActive: true } });
      expect(result).toEqual([VEHICLE]);
    });
  });

  describe('findOne', () => {
    it('returns vehicle when found and org matches', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(VEHICLE);
      const result = await service.findOne('v-1', ORG_ID);
      expect(result).toEqual(VEHICLE);
    });

    it('throws NotFoundException when vehicle not found', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('v-x', ORG_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when org does not match', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({ ...VEHICLE, organizationId: 'other-org' });
      await expect(service.findOne('v-1', ORG_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('creates vehicle when under limit', async () => {
      mockOrgsRepo.findOneOrFail.mockResolvedValue(ORG);
      mockVehicleRepo.count.mockResolvedValue(3);
      mockVehicleRepo.create.mockReturnValue(VEHICLE);
      mockVehicleRepo.save.mockResolvedValue(VEHICLE);

      const dto = { name: 'Truck 1', imei: '123456789012345' } as any;
      const result = await service.create(dto, ORG_ID);
      expect(result).toEqual(VEHICLE);
    });

    it('throws BadRequestException when at vehicle limit', async () => {
      mockOrgsRepo.findOneOrFail.mockResolvedValue(ORG);
      mockVehicleRepo.count.mockResolvedValue(5); // at limit
      const dto = { name: 'New Truck' } as any;
      await expect(service.create(dto, ORG_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates vehicle and returns updated entity', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(VEHICLE);
      mockVehicleRepo.update.mockResolvedValue(undefined);
      const updated = { ...VEHICLE, name: 'Updated' };
      mockVehicleRepo.findOne.mockResolvedValueOnce(VEHICLE).mockResolvedValueOnce(updated);

      const result = await service.update('v-1', { name: 'Updated' } as any, ORG_ID);
      expect(mockVehicleRepo.update).toHaveBeenCalledWith('v-1', { name: 'Updated' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('soft-deletes vehicle by setting isActive=false', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(VEHICLE);
      mockVehicleRepo.update.mockResolvedValue(undefined);
      await service.remove('v-1', ORG_ID);
      expect(mockVehicleRepo.update).toHaveBeenCalledWith('v-1', { isActive: false });
    });
  });
});
