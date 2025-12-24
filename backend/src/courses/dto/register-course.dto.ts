import { IsUUID, IsNotEmpty } from 'class-validator';

export class RegisterCourseDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}
