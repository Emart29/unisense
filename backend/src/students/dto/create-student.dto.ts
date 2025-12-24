import { IsString, IsNotEmpty, IsEnum, IsInt, Min, IsOptional, IsUUID } from 'class-validator';
import { EnrollmentStatus } from '../../entities/student.entity';

export class CreateStudentDto {
  @IsUUID()
  @IsNotEmpty()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  faculty: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsEnum(EnrollmentStatus)
  enrollmentStatus: EnrollmentStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  creditLimit?: number;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
