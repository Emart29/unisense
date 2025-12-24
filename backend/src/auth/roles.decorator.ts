import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { ROLES_KEY } from './roles.guard';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
