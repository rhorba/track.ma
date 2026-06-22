import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private service: OrganizationsService) {}

  @Get('me')
  getMyOrg(@Request() req: any) {
    return this.service.findById(req.user.organizationId);
  }

  @Get('me/usage')
  getUsage(@Request() req: any) {
    return this.service.getUsage(req.user.organizationId);
  }
}
