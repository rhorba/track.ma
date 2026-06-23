import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { InviteService } from './invite.service';
import { OrganizationsService } from '../organizations/organizations.service';
import type { UserRole } from '../../entities/user.entity';

class InviteDto {
  @IsEmail()
  email: string;

  @IsEnum(['org_admin', 'fleet_manager', 'viewer', 'driver'])
  @IsOptional()
  role?: string = 'viewer';
}

class UpdateRoleDto {
  @IsEnum(['org_admin', 'fleet_manager', 'viewer', 'driver'])
  role: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private inviteService: InviteService,
    private orgsService: OrganizationsService,
  ) {}

  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Get('team')
  getTeam(@Request() req: any) {
    return this.usersService.findByOrg(req.user.organizationId);
  }

  @Post('invite')
  @UseGuards(RolesGuard)
  @Roles('org_admin')
  async invite(@Body() body: InviteDto, @Request() req: any) {
    const org = await this.orgsService.findById(req.user.organizationId);
    return this.inviteService.send(
      body.email,
      body.role ?? 'viewer',
      req.user.organizationId,
      req.user.id,
      org.name,
    );
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('org_admin')
  updateRole(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
    @Request() req: any,
  ) {
    return this.usersService.updateRole(
      id,
      body.role as UserRole,
      req.user.id,
      req.user.organizationId,
    );
  }
}
