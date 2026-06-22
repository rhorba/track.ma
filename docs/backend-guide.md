# Backend Development Guide — TrackMa

**Author**: Backend Developer  
**Date**: 2026-06-22

---

## API Conventions

### URL Structure

```
/api/{resource}          → collection
/api/{resource}/:id      → single item
/api/{resource}/:id/{sub-resource}  → nested
```

### HTTP Methods

| Method | Use case | Success code |
|---|---|---|
| GET | Read (no side effects) | 200 |
| POST | Create new resource | 201 |
| PATCH | Partial update | 200 |
| DELETE | Remove (soft delete by default) | 200 or 204 |

### Response Shape

**Success**:
```json
{ "id": "uuid", "name": "...", ... }
```

**List**:
```json
{ "data": [...], "total": N, "page": 1, "limit": 20 }
```

**Error**:
```json
{ "statusCode": 400, "message": "Validation failed", "error": "Bad Request" }
```

---

## Module Structure Pattern

Every feature module follows the same layout:

```
modules/vehicles/
├── vehicles.module.ts          — DI wiring
├── vehicles.controller.ts      — HTTP handlers
├── vehicles.service.ts         — Business logic
├── vehicles.service.spec.ts    — Unit tests
├── dto/
│   ├── create-vehicle.dto.ts   — Input validation
│   └── update-vehicle.dto.ts
└── (entity is in /entities/)
```

**Rule**: Controllers handle HTTP only (no business logic). Services handle business logic. No business logic in entities.

---

## Service Layer Patterns

### Organization isolation (all queries must filter by org)

```typescript
async findAll(organizationId: string): Promise<Vehicle[]> {
  return this.vehicleRepo.find({
    where: { organizationId, isActive: true },
    order: { createdAt: 'DESC' },
  });
}
```

**Never** accept `organizationId` from the request body — always pull it from the JWT payload:

```typescript
@Get()
findAll(@GetUser() user: JwtPayload) {
  return this.vehiclesService.findAll(user.organizationId);
}
```

### Ownership check pattern

```typescript
async findOne(id: string, organizationId: string): Promise<Vehicle> {
  const vehicle = await this.vehicleRepo.findOne({ where: { id } });
  if (!vehicle) throw new NotFoundException();
  if (vehicle.organizationId !== organizationId) throw new ForbiddenException();
  return vehicle;
}
```

### DTO Validation

```typescript
import { IsString, IsEnum, IsOptional, Length } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 20)
  licensePlate: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsString()
  @IsOptional()
  @Matches(/^\d{15}$/, { message: 'IMEI must be 15 digits' })
  imei?: string;
}
```

---

## Authentication

### Getting the current user in a controller

```typescript
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload } from '@trackma/shared';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  @Get()
  findAll(@GetUser() user: JwtPayload) {
    return this.vehiclesService.findAll(user.organizationId);
  }
}
```

### Role protection

```typescript
@Post()
@Roles('org_admin', 'fleet_manager')
@UseGuards(JwtAuthGuard, RolesGuard)
create(@Body() dto: CreateVehicleDto, @GetUser() user: JwtPayload) {
  return this.vehiclesService.create(dto, user.organizationId);
}
```

---

## Redis Usage

### Caching (via REDIS_CLIENT)

```typescript
// Cache a value
await this.redisClient.set(`vehicle:${id}:latest`, JSON.stringify(position), 'EX', 300);

// Read from cache
const cached = await this.redisClient.get(`vehicle:${id}:latest`);
if (cached) return JSON.parse(cached);
```

### Pub/Sub (REDIS_SUBSCRIBER only for subscribe)

```typescript
// In constructor — subscribe to GPS positions
this.redisSubscriber.subscribe(REDIS_CHANNELS.GPS_POSITION, (message) => {
  const position: GpsPosition = JSON.parse(message);
  this.handlePosition(position);
});
```

**Critical**: Never use `REDIS_SUBSCRIBER` for commands like `SET`, `GET`, `PUBLISH`. It can only be in subscribe mode. Use `REDIS_CLIENT` for all non-subscribe operations.

---

## Error Handling

Use NestJS built-in exceptions:

```typescript
throw new NotFoundException('Vehicle not found');
throw new ForbiddenException('Not your resource');
throw new ConflictException('IMEI already in use');
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Invalid credentials');
```

For domain-specific errors, use `BadRequestException` with a clear message — don't create custom exception classes unless absolutely necessary.

---

## Testing a Service

```typescript
describe('VehiclesService.create', () => {
  it('assigns organizationId from the caller, not the DTO', async () => {
    const dto: CreateVehicleDto = { name: 'Test', licensePlate: '123', type: VehicleType.CAR };
    vehicleRepo.save.mockResolvedValue({ id: 'v1', organizationId: 'org1', ...dto });

    const result = await service.create(dto, 'org1');

    expect(vehicleRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org1' })
    );
  });
});
```

---

## Adding a New Feature Checklist

- [ ] Create module folder with `.module.ts`, `.controller.ts`, `.service.ts`
- [ ] Add entity to `src/entities/` if new table needed
- [ ] Add DTOs with class-validator decorators
- [ ] Add organizationId filter to all queries
- [ ] Add ownership check in `findOne` and mutations
- [ ] Apply `JwtAuthGuard` + `RolesGuard` to controller
- [ ] Register module in `app.module.ts`
- [ ] Write unit tests for service methods
- [ ] Test endpoints manually with a REST client (Insomnia/Postman)
