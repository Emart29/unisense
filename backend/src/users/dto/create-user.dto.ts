import { IsEmail, IsNotEmpty, IsString, IsEnum, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  universityId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
