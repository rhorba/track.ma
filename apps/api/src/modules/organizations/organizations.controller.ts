import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private service: OrganizationsService) {}

  @Get('public')
  @SkipThrottle()
  async getPublicBranding(@Query('slug') slug: string) {
    if (!slug) throw new NotFoundException('slug is required');
    const branding = await this.service.findBySlugPublic(slug);
    if (!branding) throw new NotFoundException(`Organization '${slug}' not found`);
    return branding;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyOrg(@Request() req: any) {
    return this.service.findById(req.user.organizationId);
  }

  @Get('me/usage')
  @UseGuards(JwtAuthGuard)
  getUsage(@Request() req: any) {
    return this.service.getUsage(req.user.organizationId);
  }

  @Patch('me/branding')
  @UseGuards(JwtAuthGuard)
  updateBranding(@Request() req: any, @Body() dto: UpdateBrandingDto) {
    return this.service.updateBranding(req.user.organizationId, dto);
  }
}
