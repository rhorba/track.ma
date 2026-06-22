import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('me')
  getMe(@Request() req: any) {
    return this.service.findById(req.user.id);
  }

  @Get('team')
  getTeam(@Request() req: any) {
    return this.service.findByOrg(req.user.organizationId);
  }
}
