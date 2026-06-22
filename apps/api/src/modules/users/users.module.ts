import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UserInvite } from '../../entities/user-invite.entity';
import { Organization } from '../../entities/organization.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { InviteService } from './invite.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserInvite, Organization]), forwardRef(() => OrganizationsModule)],
  providers: [UsersService, InviteService],
  controllers: [UsersController],
  exports: [UsersService, InviteService],
})
export class UsersModule {}
