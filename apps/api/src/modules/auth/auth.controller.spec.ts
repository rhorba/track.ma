import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn().mockResolvedValue({ accessToken: 'tok' }),
  login: jest.fn().mockResolvedValue({ accessToken: 'tok' }),
  refresh: jest.fn().mockResolvedValue({ accessToken: 'tok' }),
  logout: jest.fn().mockResolvedValue({ success: true }),
  acceptInvite: jest.fn().mockResolvedValue({ accessToken: 'tok' }),
};

describe('AuthController — throttle decorators', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register calls authService.register', async () => {
    const dto = { name: 'Ali', email: 'ali@test.com', password: 'password123' };
    const result = await controller.register(dto);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'tok' });
  });

  it('login calls authService.login', async () => {
    const dto = { email: 'ali@test.com', password: 'password123' };
    const result = await controller.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'tok' });
  });

  it('register route has @Throttle metadata (limit=10)', () => {
    const limit = Reflect.getMetadata(
      'THROTTLER:LIMITdefault',
      AuthController.prototype.register,
    );
    expect(limit).toBe(10);
  });

  it('login route has @Throttle metadata (limit=10)', () => {
    const limit = Reflect.getMetadata(
      'THROTTLER:LIMITdefault',
      AuthController.prototype.login,
    );
    expect(limit).toBe(10);
  });
});
