import { IsEmail, IsOptional, IsString, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
