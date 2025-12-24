import { IsString, IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '../../entities/student.entity';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  faculty?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  level?: number;

  @IsEnum(EnrollmentStatus)
  @IsOptional()
  enrollmentStatus?: EnrollmentStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  creditLimit?: number;
}
