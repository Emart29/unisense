import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsUUID } from 'class-validator';

export class CreateCourseDto {
  @IsUUID()
  @IsNotEmpty()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @Min(1)
  creditUnits: number;

  @IsString()
  @IsNotEmpty()
  faculty: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsUUID()
  @IsOptional()
  lecturerId?: string;

  @IsString()
  @IsNotEmpty()
  session: string;

  @IsString()
  @IsNotEmpty()
  semester: string;
}
