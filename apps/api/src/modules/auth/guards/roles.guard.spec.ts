import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function makeContext(role: string | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = makeContext('viewer');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user role matches required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['org_admin']);
    const ctx = makeContext('org_admin');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user role does not match required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['org_admin']);
    const ctx = makeContext('viewer');
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('denies access when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['org_admin']);
    const ctx = makeContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows access when user has one of multiple allowed roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['org_admin', 'fleet_manager']);
    const ctx = makeContext('fleet_manager');
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
